import axios from 'axios';

export default {
    name: "ssweb",
    description: "Ambil tangkapan layar website secara instan. Format: !ssweb <url>",
    execute: async (sock, msg, args) => {
        const remoteJid = msg.key.remoteJid;

        if (!args.length) {
            return sock.sendMessage(remoteJid, {
                text: `⚠️ Mana linknya? Contoh: !ssweb https://google.com/`
            }, { quoted: msg });
        }

        let url = args[0];
        if (!url.startsWith('http')) url = 'https://' + url;

        await sock.sendMessage(remoteJid, { react: { text: "⏳", key: msg.key } });

        try {
            // Menggunakan API Screenshot Public yang cepat
            const ssUrl = `https://api.vreden.web.id/api/ssweb?url=${encodeURIComponent(url)}`;
            
            await sock.sendMessage(remoteJid, { 
                image: { url: ssUrl }, 
                caption: `*Web Screenshot*\n_Target: ${url}_` 
            }, { quoted: msg });

        } catch (error) {
            console.error("[SSWEB Error]:", error.message);
            sock.sendMessage(remoteJid, { text: "❌ Gagal mengambil screenshot. Pastikan URL valid." }, { quoted: msg });
        }
    }
};
