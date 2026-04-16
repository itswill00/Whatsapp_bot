import { afkUsers } from '../utils/afkData.js';

export default {
    name: "afk",
    description: "Setel status kamu menjadi Away From-Keyboard biar nggak diganggu.",
    execute: async (sock, msg, args) => {
        const sender = msg.key.participant || msg.key.remoteJid;
        const reason = args.length > 0 ? args.join(' ') : 'Sedang sibuk/tidak aktif';
        
        afkUsers.set(sender, { reason, time: Date.now() });
        
        await sock.sendMessage(msg.key.remoteJid, { text: `💤 Baiklah! Kamu sekarang tercatat sedang AFK.\n\n*Alasan:* ${reason}\n\n_Ketikan pesan apa saja nanti untuk mematikan mode ini._` }, { quoted: msg });
    }
};
