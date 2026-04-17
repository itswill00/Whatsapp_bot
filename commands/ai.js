import Groq from "groq-sdk";
import config from '../config.js';

let groq = null;

export default {
    name: "ai",
    description: "Ngobrol pintar dengan AI menggunakan Groq LLaMA3",
    execute: async (sock, msg, args) => {
        if (!config.groqApiKey) {
            return await sock.sendMessage(msg.key.remoteJid, { text: "Gagal: API Key Groq belum diatur di config.js." }, { quoted: msg });
        }

        if (args.length === 0) {
            return await sock.sendMessage(msg.key.remoteJid, { text: `Gunakan format: ${config.prefix}ai <pertanyaan>` }, { quoted: msg });
        }

        try {
            if (!groq) groq = new Groq({ apiKey: config.groqApiKey });

            const response = await groq.chat.completions.create({
                messages: [
                    { 
                        role: "system", 
                        content: "You are Wil-AI, a technical system architect. Provide concise, accurate, and professional technical assistance. Tone: Senior Engineer. Language: Indonesian (unless context dictates otherwise)." 
                    },
                    { role: "user", content: args.join(" ") }
                ],
                model: "llama-3.1-8b-instant",
            });

            const reply = response.choices[0]?.message?.content || "Error: Empty response.";
            await sock.sendMessage(msg.key.remoteJid, { text: reply }, { quoted: msg });
        } catch (error) {
            console.error("[Groq AI Error]:", error?.message || error);
            await sock.sendMessage(msg.key.remoteJid, { text: "ERROR: ai_connection_failed" }, { quoted: msg });
        }
    }
};
