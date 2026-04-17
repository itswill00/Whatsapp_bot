import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { uploadFile } from '../utils/uploader.js';
import axios from 'axios';

export default {
    name: "hd",
    description: "Bersihkan dan tajamkan foto (AI Upscale). Balas pesan gambar dengan !hd",
    execute: async (sock, msg, args) => {
        const remoteJid = msg.key.remoteJid;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
        const mime = quoted?.imageMessage?.mimetype || quoted?.documentWithCaptionMessage?.message?.documentMessage?.mimetype;

        if (!/image/.test(mime)) {
            return sock.sendMessage(remoteJid, { text: "⚠️ Balas pesan gambar yang ingin ditajamkan dengan perintah !hd" }, { quoted: msg });
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏳", key: msg.key } });

        try {
            // Stage 1: Download Media
            const buffer = await downloadMediaMessage(
                { message: quoted },
                'buffer',
                {},
                { logger: console }
            );

            // Stage 2: Upload to Cloud
            const imageUrl = await uploadFile(buffer);
            console.log(`[HD] Image uploaded to: ${imageUrl}`);

            // Stage 3: Process via Multiple Engines
            const engines = [
                { name: "Vreden",  url: `https://api.vreden.web.id/api/remini?url=${encodeURIComponent(imageUrl)}` },
                { name: "Widipe",  url: `https://widipe.com/remini?url=${encodeURIComponent(imageUrl)}` },
                { name: "Siputzx", url: `https://api.siputzx.my.id/api/ai/remini?url=${encodeURIComponent(imageUrl)}` }
            ];

            let resultUrl = null;
            let engineUsed = "";

            for (const engine of engines) {
                try {
                    console.log(`[HD] Trying engine: ${engine.name}...`);
                    // API ini biasanya langsung mengembalikan stream gambar atau JSON dengan url
                    // Namun kebanyakan API publik di ekosistem ini langsung mengirim stream
                    // Kita akan verifikasi apakah URL ini valid/bisa diakses
                    const check = await axios.get(engine.url, { timeout: 30000, responseType: 'arraybuffer' });
                    if (check.status === 200 && check.data.length > 5000) { // Valid image usually > 5KB
                        resultUrl = engine.url;
                        engineUsed = engine.name;
                        break;
                    }
                } catch (e) {
                    console.error(`[HD] Engine ${engine.name} failed:`, e.message);
                }
            }

            if (!resultUrl) throw new Error("Semua mesin AI sedang sibuk atau gagal memproses gambar ini.");

            await sock.sendMessage(remoteJid, { 
                image: { url: resultUrl }, 
                caption: `*AI Image Enhancer*\n_Berhasil ditajamkan via ${engineUsed}_` 
            }, { quoted: msg });

        } catch (error) {
            console.error("[HD Error]:", error.message);
            sock.sendMessage(remoteJid, { text: `❌ Gagal memproses gambar.\n_Details: ${error.message}_` }, { quoted: msg });
        }
    }
};
