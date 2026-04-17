import config from '../config.js';

export default {
    name: "restart",
    description: "Konfigurasi sistem untuk Restart bot (Hanya Owner)",
    execute: async (sock, msg, args) => {
        // Keamanan: Hanya Owner yang ada di config.js yang bisa merestart server
        let sender = msg.key.participant || msg.key.remoteJid;
        if (sender.includes(':')) sender = sender.split(':')[0] + '@s.whatsapp.net';

        let configOwner = config.ownerNumber;
        if (configOwner.includes(':')) configOwner = configOwner.split(':')[0] + '@s.whatsapp.net';

        if (sender !== configOwner) return; 

        await sock.sendMessage(msg.key.remoteJid, { text: "SYSTEM RESTART\nAction: process_reboot\nStatus: triggered" }, { quoted: msg });
        
        // Timeout sedikit sebelum force-close untuk memastikan pesan terkirim
        setTimeout(() => {
            process.exit(1); 
        }, 1500);
    }
};
