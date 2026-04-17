import { downloadMediaMessage } from '@whiskeysockets/baileys';
import Groq from "groq-sdk";
import config from '../config.js';

let groq = null;

export default {
    name: "ocr",
    description: "Baca teks dari gambar (AI Vision). Balas pesan gambar dengan !ocr",
    execute: async (sock, msg, args) => {
        const remoteJid = msg.key.remoteJid;

        if (!config.groqApiKey) {
            return sock.sendMessage(remoteJid, { text: "⚠️ Fitur ini membutuhkan Groq API Key di config.js" }, { quoted: msg });
        }

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
        const mime = quoted?.imageMessage?.mimetype || quoted?.documentWithCaptionMessage?.message?.documentMessage?.mimetype;

        if (!/image/.test(mime)) {
            return sock.sendMessage(remoteJid, { text: "⚠️ Balas pesan gambar yang ingin dibaca teksnya dengan perintah !ocr" }, { quoted: msg });
        }

        await sock.sendMessage(remoteJid, { react: { text: "👁️", key: msg.key } });

        try {
            if (!groq) groq = new Groq({ apiKey: config.groqApiKey });

            const buffer = await downloadMediaMessage(
                { message: quoted },
                'buffer',
                {},
                { logger: console }
            );

            const base64Image = buffer.toString('base64');

            const response = await groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: [
                            { 
                                type: "text", 
                                text: "Tolong ekstrak semua teks dari gambar ini dengan akurat. Jika tidak ada teks, jelaskan apa isi gambarnya secara singkat. Berikan hasil akhir saja tanpa basa-basi." 
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mime};base64,${base64Image}`,
                                },
                            },
                        ],
                    },
                ],
                model: "llama-3.2-11b-vision-preview",
            });

            const result = response.choices[0]?.message?.content || "Gagal membaca gambar.";

            await sock.sendMessage(remoteJid, { 
                text: `*AI OCR Vision*\n\n${result}` 
            }, { quoted: msg });

        } catch (error) {
            console.error("[OCR Vision Error]:", error.message);
            sock.sendMessage(remoteJid, { text: "❌ Terjadi kesalahan pada AI Vision. Pastikan API Key valid dan batas penggunaan mencukupi." }, { quoted: msg });
        }
    }
};
