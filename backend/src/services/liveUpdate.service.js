/**
 * Real-time updates now run over Socket.IO (see ../socket.js). This module is a
 * thin compatibility layer so controllers/services keep importing the same
 * `publishLiveUpdate` / `isUserOnline` names without changes.
 */
export { publishLiveUpdate, isUserOnline, emitToUser, indexConversationPartners } from '../socket.js';
