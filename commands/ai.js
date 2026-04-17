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

        if (!groq) groq = new Groq({ apiKey: config.groqApiKey });

        const prompt = args.join(" ");

        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { 
                        role: "system", 
                        content: "Nama kamu adalah Wil-AI. Kamu adalah asisten teknis yang tenang, cerdas, dan to-the-point. Berikan jawaban yang manusiawi namun efisien. Jangan gunakan emoji berlebihan. Gaya bicara: Senior Software Engineer." 
                    },
                    { role: "user", content: prompt }
                ],
                model: "llama-3.1-8b-instant",
            });

            const reply = chatCompletion.choices[0]?.message?.content || "ERROR: null_response_from_engine";
            
            await sock.sendMessage(msg.key.remoteJid, { text: reply }, { quoted: msg });
        } catch (error) {
            console.error("[Groq AI Error]:", error?.message || error);
            await sock.sendMessage(msg.key.remoteJid, { text: "ERROR: ai_connection_failed" }, { quoted: msg });
        }
    }
};
