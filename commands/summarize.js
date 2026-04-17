import Groq from 'groq-sdk';
import config from '../config.js';
import { messageHistory } from '../utils/messageHistory.js';

let groq;

export default {
    name: "summarize",
    description: "Merangkum diskusi terakhir di grup menggunakan AI (Pesan terakhir).",
    execute: async (sock, msg, args) => {
        const isGroup = msg.key.remoteJid.endsWith('@g.us');
        if (!isGroup) {
            return await sock.sendMessage(msg.key.remoteJid, { text: "Perintah ini hanya bisa digunakan di dalam Grup." }, { quoted: msg });
        }

        if (!config.groqApiKey) {
            return await sock.sendMessage(msg.key.remoteJid, { text: "Gagal: API Key Groq belum diatur." }, { quoted: msg });
        }

        const history = messageHistory.get(msg.key.remoteJid);
        
        if (history.length < 5) {
            return await sock.sendMessage(msg.key.remoteJid, { text: "Data pembicaraan belum cukup. Biarkan obrolan mengalir lebih banyak sebelum dirangkum." }, { quoted: msg });
        }

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "📝", key: msg.key } });

        // Build the transcript for AI
        const transcript = history.map(h => `${h.name}: ${h.text}`).join('\n');

        if (!groq) groq = new Groq({ apiKey: config.groqApiKey });

        try {
            const response = await groq.chat.completions.create({
                messages: [
                    { 
                        role: "system", 
                        content: "Nama kamu adalah Wil-AI. Kamu adalah asisten ringkasan diskusi grup. Tugas kamu adalah merangkum obrolan berikut dalam poin-per-poin singkat, padat, dan profesional. Gunakan Bahasa Indonesia yang natural. Pastikan informasi penting seperti keputusan atau pertanyaan yang belum terjawab tetap ada. Jangan gunakan emoji berlebihan. Gaya bicara: Humanis-Minimalis." 
                    },
                    { 
                        role: "user", 
                        content: `Berikut adalah transkrip diskusi grup terakhir:\n\n${transcript}` 
                    }
                ],
                model: "llama-3.3-70b-versatile",
            });

            const summary = response.choices[0]?.message?.content || "Maaf, Wil-AI gagal merangkum diskusi saat ini.";
            
            const finalOutput = `Rangkuman Diskusi Terakhir\n\n${summary}`;

            await sock.sendMessage(msg.key.remoteJid, { text: finalOutput }, { quoted: msg });

        } catch (error) {
            console.error("[Summarize Error]:", error);
            await sock.sendMessage(msg.key.remoteJid, { text: "Terjadi kesalahan teknis saat mencoba merangkum diskusi." }, { quoted: msg });
        }
    }
};
