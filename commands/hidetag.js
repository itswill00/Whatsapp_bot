import { getGroupDetails } from '../utils/helper.js';

export default {
    name: "hidetag",
    description: "Mentions semua anggota grup secara diam-diam (Hanya Admin)",
    execute: async (sock, msg, args) => {
        const d = await getGroupDetails(sock, msg);
        if (!d.isGroup) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Perintah khusus grup!" }, { quoted: msg });
        if (d.error) return;
        
        if (!d.isSenderAdmin) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Hanya Admin yang boleh melakukan tag ke semua orang." }, { quoted: msg });

        const mappedJids = d.participants.map(part => part.id);
        const text = args.length > 0 ? args.join(' ') : 'Panggilan kepada semua member grup!';

        await sock.sendMessage(msg.key.remoteJid, { 
            text: `📢 *PENGUMUMAN*\n\n${text}`, 
            mentions: mappedJids 
        });
    }
};
