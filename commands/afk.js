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

        // If the owner runs it in PM, they mean "Turn the BOT into AFK mode for anyone chatting with the bot"
        const configOwner = decodeJid(config.ownerNumber);

        if (!isGroup && sender === configOwner) {
            targetAfkId = decodeJid(sock.user?.id);
        }

        const reason = args.length > 0 ? args.join(' ') : 'Sedang sibuk/tidak aktif';
        
        afkUsers.set(targetAfkId, { reason, time: Date.now() });
        
        await sock.sendMessage(msg.key.remoteJid, { text: `Mode AFK diaktifkan untuk @${targetAfkId.split('@')[0]}.\nAlasan: ${reason}` }, { quoted: msg });
    }
};
