import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { uploadToTelegraph } from '../utils/uploader.js';

export default {
    name: "hd",
    description: "Bersihkan dan tajamkan foto buram (AI Upscale). Balas pesan gambar dengan !hd",
    execute: async (sock, msg, args) => {
        const remoteJid = msg.key.remoteJid;
        
        // Ambil pesan gambar dari quoted message atau pesan itu sendiri
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
        const mime = quoted?.imageMessage?.mimetype || quoted?.documentWithCaptionMessage?.message?.documentMessage?.mimetype;

        if (!/image/.test(mime)) {
            return sock.sendMessage(remoteJid, { text: "⚠️ Balas pesan gambar yang ingin ditajamkan dengan perintah !hd" }, { quoted: msg });
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏳", key: msg.key } });

        try {
            // Download gambar dari Baileys
            const buffer = await downloadMediaMessage(
                { message: quoted },
                'buffer',
                {},
                { logger: console }
            );

            // Upload ke host publik
            const imageUrl = await uploadToTelegraph(buffer);

            // Panggil API Upscaler (Remini Logic)
            const upscaleUrl = `https://api.vreden.web.id/api/remini?url=${encodeURIComponent(imageUrl)}`;
            
            await sock.sendMessage(remoteJid, { 
                image: { url: upscaleUrl }, 
                caption: `*AI Image Enhancer*\n_Berhasil meningkatkan resolusi gambar_` 
            }, { quoted: msg });

        } catch (error) {
            console.error("[HD Error]:", error.message);
            sock.sendMessage(remoteJid, { text: "❌ Gagal memproses gambar. Coba lagi nanti." }, { quoted: msg });
        }
    }
};
