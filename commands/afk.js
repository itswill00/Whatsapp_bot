import { afkUsers } from '../utils/afkData.js';
import { decodeJid } from '../utils/helper.js';
import config from '../config.js';

export default {
    name: "afk",
    description: "Setel status kamu menjadi Away From-Keyboard biar nggak diganggu.",
    execute: async (sock, msg, args) => {
        const botId = decodeJid(sock.user?.id);
        const fromMe = msg.key.fromMe;
        const isGroup = msg.key.remoteJid.endsWith('@g.us');
        const sender = isGroup ? decodeJid(msg.key.participant || msg.key.remoteJid) : (fromMe ? botId : decodeJid(msg.key.remoteJid));
        
        // Default target is the person running the command
        let targetAfkId = sender;

        const isOwner = Array.isArray(config.ownerNumber) 
            ? config.ownerNumber.map(n => decodeJid(n)).includes(sender)
            : decodeJid(config.ownerNumber) === sender;

        if (!isGroup && isOwner && fromMe) {
            targetAfkId = botId;
        }

        const reason = args.length > 0 ? args.join(' ') : 'Sedang sibuk/tidak aktif';
        
        afkUsers.set(targetAfkId, { reason, time: Date.now() });
        
        const output = `AFK aktif — _${reason}_`;

        await sock.sendMessage(msg.key.remoteJid, { text: output, mentions: [targetAfkId] }, { quoted: msg });
    }
};
