import Groq from 'groq-sdk';
import config from '../config.js';
import { messageHistory } from '../utils/messageHistory.js';
import { decodeJid } from '../utils/helper.js';

let groq;

export default {
    name: "summarize",
    description: "Merangkum diskusi terakhir di grup menggunakan AI (Pesan terakhir).",
    execute: async (sock, msg, args) => {
        const remoteJid = msg.key.remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');
        
        if (!isGroup) {
            return await sock.sendMessage(remoteJid, { text: "Perintah ini hanya bisa digunakan di dalam Grup." }, { quoted: msg });
        }

        if (!config.groqApiKey) {
            return await sock.sendMessage(remoteJid, { text: "Gagal: API Key Groq belum diatur dalam config.js." }, { quoted: msg });
        }

        const history = messageHistory.get(remoteJid);
        
        if (history.length < 5) {
            return await sock.sendMessage(remoteJid, { text: "Data pembicaraan belum cukup untuk dirangkum (Minimal 5 pesan)." }, { quoted: msg });
        }

        await sock.sendMessage(remoteJid, { react: { text: "📝", key: msg.key } });

        const transcript = history.map(h => `${h.name}: ${h.text}`).join('\n');

        if (!groq) groq = new Groq({ apiKey: config.groqApiKey });

        try {
            const response = await groq.chat.completions.create({
                messages: [
                    { 
                        role: "system", 
                        content: "Nama kamu adalah Wil-AI, asisten senior yang profesional. Tugas kamu adalah merangkum obrolan grup berikut dalam poin-per-poin singkat dan bermakna. Gunakan Bahasa Indonesia. Fokus pada keputusan atau inti masalah. Gaya bicara: Humanis-Minimalis. Jangan gunakan emoji berlebihan." 
                    },
                    { 
                        role: "user", 
                        content: `Berikut adalah transkrip diskusi grup terakhir:\n\n${transcript}` 
                    }
                ],
                model: "llama-3.3-70b-versatile",
            });

            const summary = response.choices[0]?.message?.content || "Maaf, Wil-AI gagal merangkum diskusi saat ini.";
            const finalOutput = `*CONVERSATION DIGEST* | _Group Briefing_\n` +
                                `──────────────────────\n\n` +
                                `${summary}\n\n` +
                                `──────────────────────\n` +
                                `_Source: Last ${history.length} messages_`;
                                
            await sock.sendMessage(remoteJid, { text: finalOutput }, { quoted: msg });

        } catch (error) {
            console.error("[Summarize Error]:", error);
            await sock.sendMessage(remoteJid, { text: "Terjadi kesalahan teknis saat menghubungi AI." }, { quoted: msg });
        }
    }
};
