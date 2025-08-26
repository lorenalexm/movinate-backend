import crypto from "crypto"
import { socketMessages } from "./socketMessages"

/**
 * @typedef {Object} User
 * @property {String} roomId The Socket.io room
 * @property {String} server - The Plex.tv server address.
 * @property {String} library The library whos media will be voted upon
 */

/**
 * Contains a list of every room being used to vote.
 * Each room is a {@link Set} containing an Id for each {@link User}.
 */
let rooms = {}

/**
 * Contains a list of ever {@link User} connected.
 */
let users = {}

/**
 * Uses the crypto library to generate a short Id string.
 * @returns {String} An uppercase 4 digit string.
 */
function getIdString() {
	return crypto.randomBytes(2).toString("hex").toUpperCase()
}

/**
 * Generates and ensures that a room Id is not currently in use.
 * @returns {String} An uppercase 4 digit string.
 */
function generateRoomId() {
	let id = getIdString()
	if (Object.prototype.hasOwnProperty.call(rooms, id)) {
		return generateRoomId()
	} else {
		return id
	}
}

/**
 * Creates and populates a new {@link User} object.
 * @returns {User}
 */
function createUser(roomId) {
	return {
		roomId,
		server: "",
		library: ""
	}
}

/**
 * Retreives the Plex.tv information from the first {@link User} within the room.
 * @param {String} id The Id of an active room.
 * @returns {{server: String, library: String}} The server and library information for a room.
 */
function getPlexInformationForRoom(id) {
	if (rooms[id]) {
		let roomOwner = users[rooms[id].values().next().value]
		return {
			server: roomOwner.server,
			library: roomOwner.library
		}
	}
}

/**
 * Checks to see if the parameter is a plain object type, and not null.
 * @param {Object} parameter An object to be checked.
 * @returns Whether or not the parameter is a plain object.
 */
function isObject(parameter) {
	return parameter != null && Object.getPrototypeOf(parameter) == Object.prototype
}

/**
 * Informs a room of the current {@link User} count. Gives a negative value if room does not exist.
 * @param {Server} io The Socket.io server to broadcast to.
 * @param {String} id The Id of an active room.
 */
function emitRoomUserCount(io, id) {
	let count = rooms[id]?.size || -1
	io.to(id).emit(socketMessages.userCount, { count })
}

/**
 * Creates the socket connection and registers all message handlers.
 * @param {Server} io The Socket.io server to create the connection against.
 */
function create(io) {
	io.on(socketMessages.connection, (socket) => {
		console.log(`Socket ${socket.id} - Received connection.`)
		disconnect(socket)
		createRoom(socket)
		joinRoom(socket)
		setUserServer(socket)
		setUserLibrary(socket)
	})
}

/**
 * Finds and removes the {@link User} from a room.
 * Deletes the room if there are no remaining {@link User} objects.
 * @param {Socket} socket The socket to register this message with.
 */
function disconnect(socket) {
	socket.on(socketMessages.disconnect, () => {
		console.log(`Socket ${socket.id} - Received disconnection.`)
		let user = users[socket.id]
		if (user) {
			let id = user.roomId
			if (rooms[id]) {
				rooms[id].delete(socket.id)
				if (rooms[id].size == 0) {
					delete rooms[id]
				} else {
					emitRoomUserCount(socket.server, id)
				}
			}
			
			delete users[socket.id]
		}
	})
}

/**
 * Creates a room with a unique Id, creates the new {@link User}, and joins the room.
 * The callback function returns the Id for the room.
 * @param {Socket} socket The socket to register this message with.
 */
function createRoom(socket) {
	socket.on(socketMessages.createRoom, (callback) => {
		let id = generateRoomId()
		rooms[id] = new Set()
		rooms[id].add(socket.id)

		users[socket.id] = createUser(id)
		socket.join(id)

		let data = {
			id: id
		}

		console.log(`Socket ${socket.id} - Created a room with the id ${id}.`)
		callback(data)
		emitRoomUserCount(socket.server, id)
	})
}

/**
 * Joins a newly created {@link User} to a room.
 * The callback function returns a success boolean. Returns server and library strings on success, error message on fail.
 * @param {Socket} socket The socket to register this message with.
 */
function joinRoom(socket) {
	socket.on(socketMessages.joinRoom, (id, callback) => {
		if (rooms[id]) {
			rooms[id].add(socket.id)

			users[socket.id] = createUser(id)
			let { server, library } = getPlexInformationForRoom(id)
			users[socket.id].server = server
			users[socket.id].library = library
			socket.join(id)

			console.log(`Socket ${socket.id} - Joined a room with the id ${id}.`)
			callback({
				success: true,
				server: server,
				library: library
			})
			emitRoomUserCount(socket.server, id)
		} else {
			console.error(`Socket ${socket.id} - Failed to join room with id ${id}. Room not found in rooms object.`)
			callback({
				success: false,
				message: `Unable to find room with the Id: ${id}`
			})
		}
	})
}

/**
 * Updates a {@link User} with a new server value.
 * Callback function returns success boolean and message string.
 * @param {Socket} socket The socket to register this message with.
 */
function setUserServer(socket) {
	socket.on(socketMessages.setUserServer, (server, callback) => {
		let user = users[socket.id]
		if (user) {
			console.log(`Socket ${socket.id} - Updated the Plex.tv server.`)
			if (isObject(server)) {
				user.server = server
				callback({
					success: true,
					message: "Updated the server for the user."
				})
			} else {
				callback({
					success: false,
					message: "Failed to update the Plex.tv server. An invalid server object was received."
				})
			}
			
		} else {
			console.error(`Socket ${socket.id} - Failed to update the Plex.tv server. Socket not found in users object.`)
			callback({
				success: false,
				message: `Unable to find user with the Id: ${socket.id}`
			})
		}
	})
}

/**
 * Updates a {@link User} with a new library value.
 * Callback function returns success boolean and message string.
 * @param {Socket} socket The socket to register this message with. 
 */
function setUserLibrary(socket) {
	socket.on(socketMessages.setUserLibrary, (library, callback) => {
		let user = users[socket.id]
		if (user) {
			if (isObject(library)) {
				user.library = library
				callback({
					success: true,
					message: "Updated the library for the user."
				})
			} else {
				callback({
					success: false,
					message: "Failed to update the Plex.tv library. An invalid library object was received."
				})
			}
			
		} else {
			console.error(`Socket ${socket.id} - Failed to update the Plex.tv library. Socket not found in users object.`)
			callback({
				success: false,
				message: `Unable to find user with the Id: ${socket.id}`
			})
		}
	})
}

export { create, createRoom }
