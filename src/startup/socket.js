const socketio = require("socket.io");
const redis = require("redis");
let config = require("../models/Config");
const {
  generateMessage,
  getBoardData,
  checkGameStatus,
  finishGame,
} = require("../utils/socketUtils");
const Filter = require("bad-words");

//for when second user join to the board
const subscriber = redis.createClient();
subscriber.subscribe("server");

const client = redis.createClient();
client.on("error", function (error) {
  console.error(error);
});

// client.flushall();

const createSocketServer = (server) => {
  const io = socketio(server);

  //sockets that connect from waiting.html
  io.of("/waiting").on("connection", (socket) => {
    console.log("client is connected to waiting");
    const boardRoom = socket.handshake.headers.board;
    socket.join(boardRoom);

    subscriber.on("message", (channel, message) => {
      io.of("/waiting").to(message).emit("join");
    });
  });

  //sockets that connect from playground.html
  io.of("/playground").on("connection", (socket) => {
    console.log("client is connected to playground");
    const boardRoom = socket.handshake.headers.board;
    socket.join(boardRoom);

    //setup user environment
    //get board data
    client.get(`board-${boardRoom}`, async (err, reply) => {
      try {
        if (reply) {
          const jsonData = JSON.parse(reply);
          socket.emit("boardData", jsonData);
        } else {
          const { board, error } = await getBoardData(boardRoom);
          if (error) {
            socket.emit("error", error);
          } else {
            const stringData = JSON.stringify(board);
            client.set(`board-${boardRoom}`, stringData);
            socket.emit("boardData", board);
          }
        }
      } catch (error) {
        console.log(error);
      }
    });

    //get message history
    client.get(`messages-${boardRoom}`, (err, reply) => {
      if (reply) {
        const jsonData = JSON.parse(reply);
        socket.emit("messagesHistory", jsonData);
      }
    });

    //get resent moves if exist
    client.get(`moves-${boardRoom}`, (err, reply) => {
      if (reply) {
        const moves = JSON.parse(reply);
        socket.emit("moves", moves);
      } else {
        const moves = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        client.set(`moves-${boardRoom}`, JSON.stringify(moves));
        socket.emit("moves", moves);
      }
    });

    //whos turn to move
    client.get(`turn-${boardRoom}`, (err, reply) => {
      if (reply) {
        socket.emit("turn", reply);
      } else {
        client.set(`turn-${boardRoom}`, "x");
        socket.emit("turn", "x");
      }
    });

    //new message
    socket.on("myMessage", (msg, callback) => {
      const filter = new Filter({ list: config.bannedWords });

      if (filter.isProfane(msg.text)) {
        return callback({ message: "be polite please!" });
      }
      const newMessage = generateMessage(msg);

      client.get(`messages-${boardRoom}`, (err, reply) => {
        if (reply) {
          let messageHistory = JSON.parse(reply);
          messageHistory.push(newMessage);
          client.set(`messages-${boardRoom}`, JSON.stringify(messageHistory));
        } else {
          let firstMessage = [];
          firstMessage.push(newMessage);
          client.set(`messages-${boardRoom}`, JSON.stringify(firstMessage));
        }
      });

      io.of("/playground").to(boardRoom).emit("message", newMessage);
      callback();
    });

    //user moves
    socket.on("change", (data) => {
      let moves = [];
      client.get(`moves-${boardRoom}`, (err, reply) => {
        moves = JSON.parse(reply);
        moves[data.index] = data.turn;

        const { XWins, OWins, isDraw } = checkGameStatus(moves);

        const newTurn = data.turn == "x" ? "o" : "x";

        if (!XWins && !OWins && !isDraw) {
          client.set(`turn-${boardRoom}`, newTurn);
          client.set(`moves-${boardRoom}`, JSON.stringify(moves));
          const changes = {
            moves,
            newTurn,
          };

          io.of("/playground").to(boardRoom).emit("changesForClients", changes);
        } else {
          client.get(`board-${boardRoom}`, (err, reply) => {
            const board = JSON.parse(reply);
            let status = "";
            board.roundsNumber += 1;

            if (XWins) {
              board.user1Wins += 1;
              status = `user 1 ${board.user1.nickName} wins`;
            } else if (OWins) {
              board.user2Wins += 1;
              status = `user 2 ${board.user2.nickName} wins`;
            } else if (isDraw) {
              board.drawsNumber += 1;
              status = "Draw";
            }
            client.set(`board-${boardRoom}`, JSON.stringify(board));
            const changes = {
              moves,
              newTurn,
            };

            io.of("/playground")
              .to(boardRoom)
              .emit("changesForClients", changes);

            io.of("/playground")
              .to(boardRoom)
              .emit("endRound", { board, status });
          });
        }
      });
    });

    socket.on("continue", (data, cb) => {
      const moves = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      client.set(`moves-${boardRoom}`, JSON.stringify(moves));
      client.set(`turn-${boardRoom}`, "x");
      client.get(`board-${boardRoom}`, (err, reply) => {
        const board = JSON.parse(reply);
        cb({
          moves,
          turn: "x",
          board,
        });
      });
      socket.broadcast
        .to(boardRoom)
        .emit("otherUserDecision", { decision: "continue" });
    });

    socket.on("finish", (data, cb) => {
      client.get(`board-${boardRoom}`, async (err, reply) => {
        const board = JSON.parse(reply);
        const data = await finishGame(board);
        if (data.error) {
        }
      });
      cb();
      socket.broadcast
        .to(boardRoom)
        .emit("otherUserDecision", { decision: "end" });
    });
  });
};

module.exports = createSocketServer;
