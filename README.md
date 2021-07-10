#xoGame: online xo game

#evn variables:
PORT
MONGODB_URL
SECRET_JWT

#to start playing as user after creating users and setting configs go to LOCALHOST:PORT and create new board or join to one of open boards

#admin pannel

------ adding admin:

GET /api/admin/create HTTP/1.1
Host: $URL

------ setting configs:

PATCH /api/admin/config HTTP/1.1
Host: $URL
Authorization: Bearer $TOKEN
Content-Type: application/json

{
"joinTimeOut": 60,
"moveTimeOut" : 30,
"validCredits" : [100, 200, 300],
"bannedWords": ["biAdab", "bishor", "khar", "gav"]
}

------- create new user:
POST /api/admin/user HTTP/1.1
Host: $URL
Authorization: Bearer $TOKEN
Content-Type: application/json
Content-Length: 74

{
"nickName": $NICK_NAME,
"fullName": $FULL_NAME,
"credit" : 300

}

-------- adding avatar for user
POST /api/admin/avatar/$USER_ID HTTP/1.1
Host: $URL
Authorization: Bearer $ADMIN_TOKEN
Content-Length: 226
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

----WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="avatar"; filename=$FILE_URL
Content-Type: image/jpeg

------- update user
YOU CAN UPDATE CREDIT, NICKNAME, FULLNAME
FOR UPDATE AVATAR USE ABOVE API AGAIN

PATCH /api/admin/user/$USER_ID HTTP/1.1
Host: $URL
Authorization: Bearer $ADMIN-TOKNE
Content-Type: application/json
Content-Length: 23

{
"credit": 500

}

------ DELETE USER
DELETE /api/admin/user/$USER_ID HTTP/1.1
Host: $URL
Authorization: Bearer $ADMIN_TOKEN
