import config from '../config.js';

export default {
    name: "restart",
    description: "Konfigurasi sistem untuk Restart bot (Hanya Owner)",
    execute: async (sock, msg, args) => {
        // Keamanan: Hanya Owner yang ada di config.js yang bisa merestart server
        const sender = msg.key.participant || msg.key.remoteJid;
        if (sender !== config.ownerNumber) return; 

        await sock.sendMessage(msg.key.remoteJid, { text: "🔄 Mulai merestart node process... Jika menggunakan PM2, bot akan online kembali dalam beberapa detik." }, { quoted: msg });
        
        // Timeout sedikit sebelum force-close untuk memastikan pesan terkirim
        setTimeout(() => {
            process.exit(1); 
        }, 1500);
    }
};
