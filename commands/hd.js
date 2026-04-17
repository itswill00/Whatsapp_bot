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

            // Stage 2: Universal Upload
            const imageUrl = await uploadFile(buffer);
            console.log(`[HD] Source URL: ${imageUrl}`);

            // Stage 3: Professional AI Engine Chain
            const engines = [
                { name: "Alpha",    url: `https://api.vreden.web.id/api/remini?url=${encodeURIComponent(imageUrl)}` },
                { name: "Beta",     url: `https://api.agatz.xyz/api/remini?url=${encodeURIComponent(imageUrl)}` },
                { name: "Gamma",    url: `https://widipe.com/remini?url=${encodeURIComponent(imageUrl)}` },
                { name: "Delta",    url: `https://api.siputzx.my.id/api/ai/remini?url=${encodeURIComponent(imageUrl)}` },
                { name: "Epsilon",  url: `https://skizo.tech/api/remini?url=${encodeURIComponent(imageUrl)}&apikey=drshper` }
            ];

            let finalBuffer = null;
            let usedEngine = "";

            for (const engine of engines) {
                try {
                    console.log(`[HD] Attempting Engine: ${engine.name}...`);
                    
                    // Fetch metadata first or fetch whole but with timeout
                    const res = await axios.get(engine.url, { 
                        timeout: 50000, 
                        responseType: 'arraybuffer',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'image/*, application/json'
                        }
                    });

                    const contentType = res.headers['content-type'] || "";

                    // Case A: Server returns binary image data
                    if (contentType.includes('image')) {
                        if (res.data.length > 1000) { // Safety check
                            finalBuffer = Buffer.from(res.data);
                            usedEngine = engine.name;
                            break;
                        }
                    }

                    // Case B: Server returns JSON with a result URL
                    if (contentType.includes('json') || contentType.includes('text')) {
                        const str = res.data.toString();
                        if (str.startsWith('{')) {
                            const json = JSON.parse(str);
                            const resultUrl = json.url || json.result || json.data?.url || (json.status && json.data);
                            
                            if (typeof resultUrl === 'string' && resultUrl.startsWith('http')) {
                                console.log(`[HD] ${engine.name} returned JSON URL: ${resultUrl}`);
                                const imgRes = await axios.get(resultUrl, { timeout: 30000, responseType: 'arraybuffer' });
                                if (imgRes.status === 200) {
                                    finalBuffer = Buffer.from(imgRes.data);
                                    usedEngine = engine.name;
                                    break;
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error(`[HD] Engine ${engine.name} Error: ${e.message}`);
                    continue;
                }
            }

            if (!finalBuffer) throw new Error("Semua server AI (Alpha-Epsilon) sedang tidak merespon/timeout.");

            await sock.sendMessage(remoteJid, { 
                image: finalBuffer, 
                caption: `*AI Image Enhancer (Stabilized)*\n_Berhasil dijernihkan via Server ${usedEngine}_` 
            }, { quoted: msg });

        } catch (error) {
            console.error("[HD Ultimate Error]:", error.message);
            // Final User-Friendly advice
            const helpMsg = `❌ Gagal memproses gambar.\n\n_Details: ${error.message}_\n\n*Saran:* Coba lagi secara berkala atau gunakan gambar dengan ukuran di bawah 2MB. Server komunitas sering mengalami traffik tinggi.`;
            sock.sendMessage(remoteJid, { text: helpMsg }, { quoted: msg });
        }
    }
};
