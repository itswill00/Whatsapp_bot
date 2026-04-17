import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { uploadFile } from '../utils/uploader.js';
import axios from 'axios';

export default {
    name: "hd",
    description: "Pertajam foto buram (AI Upscale). Balas gambar dengan !hd",
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

            // Stage 2: Upload to Cloud (Multi-Uploader)
            const imageUrl = await uploadFile(buffer);
            console.log(`[HD] Image uploaded to: ${imageUrl}`);

            // Stage 3: Multi-AI Engine Rotation (7 Engines)
            const engines = [
                { name: "Engine-Alpha", url: `https://api.vreden.my.id/api/remini?url=${encodeURIComponent(imageUrl)}` },
                { name: "Engine-Beta",  url: `https://api.agatz.xyz/api/remini?url=${encodeURIComponent(imageUrl)}` },
                { name: "Engine-Gamma", url: `https://api.siputzx.my.id/api/ai/remini?url=${encodeURIComponent(imageUrl)}` },
                { name: "Engine-Delta", url: `https://widipe.com/remini?url=${encodeURIComponent(imageUrl)}` },
                { name: "Engine-Zeta",  url: `https://api.lolhuman.xyz/api/remini?apikey=64333e8746c37251145caaa2&img=${encodeURIComponent(imageUrl)}` },
                { name: "Engine-Omega", url: `https://skizo.tech/api/remini?url=${encodeURIComponent(imageUrl)}&apikey=drshper` },
                { name: "Engine-Sigma", url: `https://api.alyaserver.my.id/api/remini?url=${encodeURIComponent(imageUrl)}` }
            ];

            let finalImage = null;
            let usedEngine = "";

            for (const engine of engines) {
                try {
                    console.log(`[HD] Invoking ${engine.name}...`);
                    const res = await axios.get(engine.url, { 
                        timeout: 45000, 
                        responseType: 'arraybuffer',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    });

                    // Verifikasi apakah response adalah gambar yang valid
                    const contentType = res.headers['content-type'];
                    if (contentType && contentType.includes('image')) {
                        finalImage = Buffer.from(res.data);
                        usedEngine = engine.name;
                        break;
                    } 
                    
                    // Cek jika response adalah JSON berisi URL (Beberapa API me-return JSON)
                    if (contentType && contentType.includes('json')) {
                        const json = JSON.parse(res.data.toString());
                        const nestedUrl = json.url || json.result || (json.data && json.data.url);
                        if (nestedUrl) {
                            const imgRes = await axios.get(nestedUrl, { timeout: 30000, responseType: 'arraybuffer' });
                            finalImage = Buffer.from(imgRes.data);
                            usedEngine = engine.name;
                            break;
                        }
                    }
                } catch (e) {
                    console.error(`[HD] ${engine.name} Error: ${e.message}`);
                }
            }

            if (!finalImage) {
                throw new Error("Sistem AI sedang bermasalah di semua server komunitas (404/Timeout).");
            }

            await sock.sendMessage(remoteJid, { 
                image: finalImage, 
                caption: `*AI Image Enhancer*\n_Berhasil diproses via ${usedEngine}_` 
            }, { quoted: msg });

        } catch (error) {
            console.error("[HD Final Error]:", error.message);
            sock.sendMessage(remoteJid, { text: `❌ Gagal memproses gambar.\n_Details: ${error.message}_` }, { quoted: msg });
        }
    }
};
