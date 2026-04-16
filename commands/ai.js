import Groq from "groq-sdk";
import config from '../config.js';

let groq = null;

export default {
    name: "ai",
    description: "Ngobrol pintar dengan AI menggunakan Groq LLaMA3",
    execute: async (sock, msg, args) => {
        if (!config.groqApiKey) {
            return await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ API Key Groq belum diatur di config.js!" }, { quoted: msg });
        }

        if (args.length === 0) {
            return await sock.sendMessage(msg.key.remoteJid, { text: `ℹ️ Gunakan format: ${config.prefix}ai <pertanyaanmu>` }, { quoted: msg });
        }

        if (!groq) groq = new Groq({ apiKey: config.groqApiKey });

        const prompt = args.join(" ");

        try {
            // Reaction timeout loop prevention
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "🤖", key: msg.key } });

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama3-8b-8192", // Fast and free model
            });

            const reply = chatCompletion.choices[0]?.message?.content || "Maaf, AI tidak dapat merespon saat ini.";
            
            await sock.sendMessage(msg.key.remoteJid, { text: reply }, { quoted: msg });
        } catch (error) {
            console.error("[Groq AI Error]:", error?.message || error);
            await sock.sendMessage(msg.key.remoteJid, { text: "❌ Terjadi masalah dengan koneksi AI." }, { quoted: msg });
        }
    }
};
