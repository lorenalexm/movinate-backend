import express from "express"
import http from "http"
import { Server } from "socket.io"
import { create as createSocketServer } from "./sockets/index.js"

let app = express()
let server = http.createServer(app)
let io = new Server(server)

createSocketServer(io)
server.listen(3000, () => {
	console.log("Server is running on port 3000")
})
