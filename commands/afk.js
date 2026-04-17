import { afkUsers } from '../utils/afkData.js';
import { decodeJid } from '../utils/helper.js';
import config from '../config.js';

export default {
    name: "afk",
    description: "Setel status kamu menjadi Away From-Keyboard biar nggak diganggu.",
    execute: async (sock, msg, args) => {
        const sender = decodeJid(msg.key.participant || msg.key.remoteJid);
        const isGroup = msg.key.remoteJid.endsWith('@g.us');
        
        // Default target is the person running the command
        let targetAfkId = sender;

        const isOwner = Array.isArray(config.ownerNumber) 
            ? config.ownerNumber.map(n => decodeJid(n)).includes(sender)
            : decodeJid(config.ownerNumber) === sender;

        if (!isGroup && isOwner) {
            targetAfkId = decodeJid(sock.user?.id);
        }

        const reason = args.length > 0 ? args.join(' ') : 'Sedang sibuk/tidak aktif';
        
        afkUsers.set(targetAfkId, { reason, time: Date.now() });
        
        const output = `AFK aktif — _${reason}_`;

        await sock.sendMessage(msg.key.remoteJid, { text: output, mentions: [targetAfkId] }, { quoted: msg });
    }
};
