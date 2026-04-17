import Groq from "groq-sdk";
import config from '../config.js';

let groq = null;

export default {
    name: "ai",
    description: "Ngobrol pintar dengan AI menggunakan Groq LLaMA3",
    execute: async (sock, msg, args) => {
        if (!config.groqApiKey) {
            return await sock.sendMessage(msg.key.remoteJid, { text: "ERROR: groq_api_key_not_configured" }, { quoted: msg });
        }

        if (args.length === 0) {
            return await sock.sendMessage(msg.key.remoteJid, { text: `INFO: Usage: ${config.prefix}ai <query>` }, { quoted: msg });
        }

        if (!groq) groq = new Groq({ apiKey: config.groqApiKey });

        const prompt = args.join(" ");

        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { 
                        role: "system", 
                        content: "You are a technical system assistant. Your tone is cold, formal, and direct. Provide technical clarity and raw data without excessive pleasantries, 'fluff', or emojis. Be to-the-point. Persona: Zero Gimmick Technical Entity." 
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
