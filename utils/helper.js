/**
 * Extracts the main text from various WhatsApp message types.
 * @param {Object} msg - The raw message object from Baileys
 * @returns {string} The extracted message text
 */
export function extractMessageText(msg) {
    if (!msg.message) return '';

    // Handle ephemeral messages (Disappearing Messages)
    const msgObj = msg.message.ephemeralMessage ? msg.message.ephemeralMessage.message : msg.message;

    if (msgObj.conversation) return msgObj.conversation;
    if (msgObj.extendedTextMessage?.text) return msgObj.extendedTextMessage.text;
    if (msgObj.imageMessage?.caption) return msgObj.imageMessage.caption;
    if (msgObj.videoMessage?.caption) return msgObj.videoMessage.caption;

    return '';
}
