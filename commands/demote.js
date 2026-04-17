import { getGroupDetails } from '../utils/helper.js';

export default {
    name: "demote",
    description: "Turunkan admin menjadi member (Hanya Admin) dengan me-reply.",
    execute: async (sock, msg, args) => {
        const d = await getGroupDetails(sock, msg);
        if (!d.isGroup) return sock.sendMessage(msg.key.remoteJid, { text: "ERROR: group_chat_only" }, { quoted: msg });
        if (d.error) return;
        
        if (!d.isSenderAdmin) return sock.sendMessage(msg.key.remoteJid, { text: "ERROR: permission_denied_admin_required" }, { quoted: msg });
        if (!d.isBotAdmin) return sock.sendMessage(msg.key.remoteJid, { text: "ERROR: bot_upgrade_required_promote_to_admin" }, { quoted: msg });

        let target = null;
        if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
            target = msg.message.extendedTextMessage.contextInfo.participant;
        } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }

        if (!target) return sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Reply/tag orangnya yang mau diturunkan dari admin." }, { quoted: msg });

        try {
            await sock.groupParticipantsUpdate(msg.key.remoteJid, [target], "demote");
            await sock.sendMessage(msg.key.remoteJid, { text: "GROUP ACTION\nType: demote_participant\nStatus: success" }, { quoted: msg });
        } catch (e) {
            console.error(e);
            await sock.sendMessage(msg.key.remoteJid, { text: "ERROR: group_action_failed" }, { quoted: msg });
        }
    }
};
