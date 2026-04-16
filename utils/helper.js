/**
 * Extracts the main text from various WhatsApp message types.
 * @param {Object} msg - The raw message object from Baileys
 * @returns {string} The extracted message text
 */
export function extractMessageText(msg) {
    if (!msg.message) return '';

    const type = Object.keys(msg.message)[0];
    
    if (type === 'conversation') {
        return msg.message.conversation;
    } else if (type === 'extendedTextMessage') {
        return msg.message.extendedTextMessage.text;
    } else if (type === 'imageMessage') {
        return msg.message.imageMessage.caption || '';
    } else if (type === 'videoMessage') {
        return msg.message.videoMessage.caption || '';
    }

    return '';
}
