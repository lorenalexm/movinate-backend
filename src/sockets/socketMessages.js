/**
 * An object containing all of the messages sent to and from the socket server.
 * @readonly
 */
export let socketMessages = Object.freeze({
	/** @property {string} connection The default Socket.io connection message. */
	connection: "connection",
	/** @property {string} connect Emitted when a new client connects. */
	connect: "connect",
	/** @property {string} disconnect Emitted when a client disconnects. */
	disconnect: "disconnect",
	/** @property {string} userCount Emitted every time a user joins or leaves a room. Returns a negative number if emitted to an invalid room. */
	userCount: "userCount",
	/** @property {string} createRoom Emitted when a user creates a new room. */
	createRoom: "createRoom",
	/** @property {string} joinRoom Emitted when a user wants to join an existing room. Will fail if room doesn't exist. */
	joinRoom: "joinRoom",
	/** @property {string} setUserServer Emitted to update the Plex.tv server of a user. They must be in a room for success. */
	setUserServer: "setUserServer",
	/** @property {string} setUserLibrary Emitted to update the Plex.tv library of a user. They must be in a room for success. */
	setUserLibrary: "setUserLibrary",
	/** @property {string} upvote Emitted when a media item is upvoted by a user. */
	upvote: "upvote",
	/** @property {string} consensusReached Emitted when all users in a room have upvoted the same media. */
	consensusReached: "consensusReached"
})
