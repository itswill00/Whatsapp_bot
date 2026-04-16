import { getGroupDetails } from '../utils/helper.js';

export default {
    name: "promote",
    description: "Jadikan admin (Hanya Admin) dengan cara me-reply pesan target.",
    execute: async (sock, msg, args) => {
        const d = await getGroupDetails(sock, msg);
        if (!d.isGroup) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Perintah ini khusus Grup!" }, { quoted: msg });
        if (d.error) return;
        
        if (!d.isSenderAdmin) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Kamu bukan Admin grup!" }, { quoted: msg });
        if (!d.isBotAdmin) return sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Jadikan bot admin terlebih dahulu!" }, { quoted: msg });

        let target = null;
        if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
            target = msg.message.extendedTextMessage.contextInfo.participant;
        } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }

        if (!target) return sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Reply/tag orangnya yang mau dijadikan admin." }, { quoted: msg });

        try {
            await sock.groupParticipantsUpdate(msg.key.remoteJid, [target], "promote");
            await sock.sendMessage(msg.key.remoteJid, { text: "📈 Target sukses diangkat jadi Admin." }, { quoted: msg });
        } catch (e) {
            console.error(e);
            await sock.sendMessage(msg.key.remoteJid, { text: "❌ Gagal promote member." }, { quoted: msg });
        }
    }
};
