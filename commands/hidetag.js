import { getGroupDetails } from '../utils/helper.js';

export default {
    name: "hidetag",
    description: "Mentions semua anggota grup secara diam-diam (Hanya Admin)",
    execute: async (sock, msg, args) => {
        const d = await getGroupDetails(sock, msg);
        if (!d.isGroup) return sock.sendMessage(msg.key.remoteJid, { text: "ERROR: group_chat_only" }, { quoted: msg });
        if (d.error) return;
        
        if (!d.isSenderAdmin) return sock.sendMessage(msg.key.remoteJid, { text: "ERROR: permission_denied_admin_required" }, { quoted: msg });

        const mappedJids = d.participants.map(part => part.id);
        const text = args.length > 0 ? args.join(' ') : 'No context provided';

        await sock.sendMessage(msg.key.remoteJid, { 
            text: `Pengumuman Grup\n${text}`, 
            mentions: mappedJids 
        });
    }
};
