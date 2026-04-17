import { afkUsers } from '../utils/afkData.js';
import config from '../config.js';

export default {
    name: "afk",
    description: "Setel status kamu menjadi Away From-Keyboard biar nggak diganggu.",
    execute: async (sock, msg, args) => {
        let rawSender = msg.key.participant || msg.key.remoteJid;
        const sender = rawSender.includes(':') ? rawSender.split(':')[0] + '@s.whatsapp.net' : rawSender;
        const isGroup = msg.key.remoteJid.endsWith('@g.us');
        
        // Default target is the person running the command
        let targetAfkId = sender;

        // If the owner runs it in PM, they mean "Turn the BOT into AFK mode for anyone chatting with the bot"
        let configOwner = config.ownerNumber;
        if (configOwner.includes(':')) configOwner = configOwner.split(':')[0] + '@s.whatsapp.net';

        if (!isGroup && sender === configOwner) {
            targetAfkId = sock.user.id.includes(':') ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : sock.user.id;
        }

        const reason = args.length > 0 ? args.join(' ') : 'Sedang sibuk/tidak aktif';
        
        afkUsers.set(targetAfkId, { reason, time: Date.now() });
        
        await sock.sendMessage(msg.key.remoteJid, { text: `💤 Baiklah! Kamu sekarang tercatat sedang AFK.\n\n*Alasan:* ${reason}\n\n_Ketikan pesan apa saja nanti untuk mematikan mode ini._` }, { quoted: msg });
    }
};
