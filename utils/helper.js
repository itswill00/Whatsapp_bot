/**
 * Helper to normalize JIDs by removing Multi-Device suffixes (e.g., :1 or .0:1)
 */
export function decodeJid(jid) {
    if (!jid) return jid;
    if (typeof jid !== 'string') return jid;
    if (jid.includes('@g.us')) return jid; // Already a group JID

    const cleaned = jid.includes('@') ? jid.trim().replace(/:.*@/, '@').replace(/\.0@/, '@') : jid.trim();
    
    // Standardize to @s.whatsapp.net for standard users
    if (cleaned.endsWith('@c.us') || cleaned.endsWith('@s.whatsapp.net')) {
        return cleaned.replace('@c.us', '@s.whatsapp.net');
    }
    
    return cleaned;
}

/**
 * Extracts the main text from various WhatsApp message types.
 * @param {Object} msg - The raw message object from Baileys
 * @returns {string} The extracted message text
 */
export function extractMessageText(msg) {
    if (!msg.message) return '';

    // Handle ephemeral messages (Disappearing Messages)
    const msgObj = msg.message.ephemeralMessage ? msg.message.ephemeralMessage.message : msg.message;
    // Handle viewOnce messages
    const finalMsg = msgObj.viewOnceMessage?.message || msgObj.viewOnceMessageV2?.message || msgObj.viewOnceMessageV2Extension?.message || msgObj;

    if (finalMsg.conversation) return finalMsg.conversation;
    if (finalMsg.extendedTextMessage?.text) return finalMsg.extendedTextMessage.text;
    if (finalMsg.imageMessage?.caption) return finalMsg.imageMessage.caption;
    if (finalMsg.videoMessage?.caption) return finalMsg.videoMessage.caption;
    if (finalMsg.buttonsResponseMessage?.selectedButtonId) return finalMsg.buttonsResponseMessage.selectedButtonId;
    if (finalMsg.listResponseMessage?.singleSelectReply?.selectedRowId) return finalMsg.listResponseMessage.singleSelectReply.selectedRowId;
    if (finalMsg.templateButtonReplyMessage?.selectedId) return finalMsg.templateButtonReplyMessage.selectedId;

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

    let rawSender = msg.key.participant || msg.key.remoteJid;
    const sender = rawSender.includes(':') ? rawSender.split(':')[0] + '@s.whatsapp.net' : rawSender;
    
    // Baileys sock.user.id often contains a colon for the device ID (e.g. 62812...:12@s.whatsapp.net)
    const botId = sock.user.id.includes(':') ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : sock.user.id;

    const participants = groupMetadata.participants;
    
    // In Baileys, participant id in groupMetadata usually doesn't have a colon, but we must be safe
    const isSenderAdmin = participants.some(p => {
        const pId = p.id.includes(':') ? p.id.split(':')[0] + '@s.whatsapp.net' : p.id;
        return pId === sender && (p.admin === 'admin' || p.admin === 'superadmin');
    });
    const isBotAdmin = participants.some(p => p.id === botId && (p.admin === 'admin' || p.admin === 'superadmin'));

    return {
        isGroup,
        participants,
        isSenderAdmin,
        isBotAdmin,
        groupMetadata
    };
}
