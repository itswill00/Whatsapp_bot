import { getGroupDetails } from '../utils/helper.js';

export default {
    name: "kick",
    description: "Keluarkan member dari grup (Hanya Admin) dengan cara me-reply pesan atau tag.",
    execute: async (sock, msg, args) => {
        const d = await getGroupDetails(sock, msg);
        if (!d.isGroup) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Perintah ini khusus Grup!" }, { quoted: msg });
        if (d.error) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Gagal membaca data grup." }, { quoted: msg });
        
        if (!d.isSenderAdmin) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kamu bukan Admin grup!" }, { quoted: msg });
        if (!d.isBotAdmin) return sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Jadikan bot admin terlebih dahulu untuk bisa Kick orang." }, { quoted: msg });

        let target = null;
        if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
            target = msg.message.extendedTextMessage.contextInfo.participant; // User replied
        } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0]; // User tagged
        }

        if (!target) return sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Peringatan: Reply pesannya atau tag orangnya yang mau dikeluakan." }, { quoted: msg });

        try {
            await sock.groupParticipantsUpdate(msg.key.remoteJid, [target], "remove");
            await sock.sendMessage(msg.key.remoteJid, { text: "👋 Sayonara! Sukses mengeluarkan member." }, { quoted: msg });
        } catch (e) {
            console.error(e);
            await sock.sendMessage(msg.key.remoteJid, { text: "❌ Gagal mengeluarkan member." }, { quoted: msg });
        }
    }
};
