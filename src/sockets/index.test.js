import { describe, beforeEach, afterEach, test, expect } from "@jest/globals"
import { createServer } from "http"
import { Server } from "socket.io"
import { io as Client } from "socket.io-client"
import { create } from "."
import { socketMessages } from "./socketMessages"

describe("Testing the Socket.io behaviour", () => {
	let port, io, client

	beforeEach((done) => {
		let http = createServer()
		io = new Server(http)
		create(io)
		http.listen(() => {
			port = http.address().port
			client = new Client(`http://localhost:${port}`)
			client.on(socketMessages.connect, done)
		})
	})

	afterEach(() => {
		client.close()
		io.close()
	})

	test("Successfully creates a room and updates the user count.", (done) => {
		client.once(socketMessages.userCount, (data) => {
			expect(data.count).toEqual(1)
			done()
		})

		client.emit(socketMessages.createRoom, (data) => {
			expect(data).toHaveProperty("id")
		})
	})

	test("Successfully creates a room and has another client join the same room.", (done) => {
		let roomCreated = false
		let secondClient

		client.on(socketMessages.userCount, (data) => {
			if (roomCreated == false) {
				expect(data.count).toEqual(1)
				roomCreated = true
				return
			}
			
			expect(data.count).toEqual(2)
			secondClient.close()
			done()
		})
		
		client.emit(socketMessages.createRoom, (data) => {
			expect(data).toHaveProperty("id")
			let roomId = data.id

			secondClient = new Client(`http://localhost:${port}`)
			secondClient.on(socketMessages.connect, () => {
				secondClient.emit(socketMessages.joinRoom, roomId, (data) => {
					expect(data).toHaveProperty("success")
					expect(data.success).toBe(true)
				})
			})
		})
	})

	test("Successfully updates the Plex.tv server of a user.", (done) => {
		client.emit(socketMessages.createRoom, (data) => {
			expect(data).toHaveProperty("id")

			client.emit(socketMessages.setUserServer, { server: "https://plex.tv" }, (data) => {
				expect(data).toHaveProperty("success")
				expect(data.success).toBe(true)
				done()
			})
		})
	})

	test("Fails updates the Plex.tv server of a user if invalid server object", (done) => {
		client.emit(socketMessages.createRoom, (data) => {
			expect(data).toHaveProperty("id")
			failUpdating(socketMessages.setUserServer, done)
		})
	})

	test("Successfully updates the Plex.tv library of a user.", (done) => {
		client.emit(socketMessages.createRoom, (data) => {
			expect(data).toHaveProperty("id")

			client.emit(socketMessages.setUserLibrary, { server: "https://plex.tv" }, (data) => {
				expect(data).toHaveProperty("success")
				expect(data.success).toBe(true)
				done()
			})
		})
	})

	test("Fails updates the Plex.tv library of a user if invalid library object", (done) => {
		client.emit(socketMessages.createRoom, (data) => {
			expect(data).toHaveProperty("id")
			failUpdating(socketMessages.setUserLibrary, done)
		})
	})

	/**
	 * Attempts to fail {@link socketMessages.setUserLibrary} and {@link socketMessages.setUserServer} messages.
	 * Passes in a variety of objects that should be invalid on the server.
	 * @param {string} message The socket message that should be tested.
	 * @param {Function} done To be called when testing is completed.
	 */
	function failUpdating(message, done) {
		client.emit(message, false, (data) => {
			expect(data).toHaveProperty("success")
			expect(data.success).toBe(false)
		})

		client.emit(message, 1234, (data) => {
			expect(data).toHaveProperty("success")
			expect(data.success).toBe(false)
		})

		client.emit(message, ["Bad", "String"], (data) => {
			expect(data).toHaveProperty("success")
			expect(data.success).toBe(false)
		})

		client.emit(message, "Bad string", (data) => {
			expect(data).toHaveProperty("success")
			expect(data.success).toBe(false)
		})

		client.emit(message, null, (data) => {
			expect(data).toHaveProperty("success")
			expect(data.success).toBe(false)
			done()
		})
	}
})
