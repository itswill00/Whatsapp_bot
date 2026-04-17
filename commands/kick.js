import { getGroupDetails } from '../utils/helper.js';

export default {
    name: "kick",
    description: "Keluarkan member dari grup (Hanya Admin) dengan cara me-reply pesan atau tag.",
    execute: async (sock, msg, args) => {
        const d = await getGroupDetails(sock, msg);
        if (!d.isGroup) return sock.sendMessage(msg.key.remoteJid, { text: "ERROR: group_chat_only" }, { quoted: msg });
        if (d.error) return sock.sendMessage(msg.key.remoteJid, { text: "ERROR: failed_to_fetch_metadata" }, { quoted: msg });
        
        if (!d.isSenderAdmin) return sock.sendMessage(msg.key.remoteJid, { text: "ERROR: permission_denied_admin_required" }, { quoted: msg });
        if (!d.isBotAdmin) return sock.sendMessage(msg.key.remoteJid, { text: "ERROR: bot_upgrade_required_promote_to_admin" }, { quoted: msg });

        let target = null;
        if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
            target = msg.message.extendedTextMessage.contextInfo.participant; // User replied
        } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0]; // User tagged
        }

        if (!target) return sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Peringatan: Reply pesannya atau tag orangnya yang mau dikeluakan." }, { quoted: msg });

        try {
            await sock.groupParticipantsUpdate(msg.key.remoteJid, [target], "remove");
            await sock.sendMessage(msg.key.remoteJid, { text: "Berhasil mengeluarkan orang tersebut dari grup." }, { quoted: msg });
        } catch (e) {
            console.error(e);
            await sock.sendMessage(msg.key.remoteJid, { text: "Gagal memproses pengeluaran member." }, { quoted: msg });
        }
    }
};
