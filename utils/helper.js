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

/**
 * Helper to fetch group context and determine admin statuses.
 */
export async function getGroupDetails(sock, msg) {
    const isGroup = msg.key.remoteJid.endsWith('@g.us');
    if (!isGroup) return { isGroup: false };

    const groupMetadata = await sock.groupMetadata(msg.key.remoteJid).catch(e => null);
    if (!groupMetadata) return { isGroup: true, error: true };

    const sender = msg.key.participant || msg.key.remoteJid;
    // Baileys sock.user.id often contains a colon for the device ID (e.g. 62812...:12@s.whatsapp.net)
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

    const participants = groupMetadata.participants;
    const isSenderAdmin = participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));
    const isBotAdmin = participants.some(p => p.id === botId && (p.admin === 'admin' || p.admin === 'superadmin'));

    return {
        isGroup,
        participants,
        isSenderAdmin,
        isBotAdmin,
        groupMetadata
    };
}
