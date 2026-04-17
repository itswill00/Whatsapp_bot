import config from '../config.js';

export default {
    name: "help",
    description: "List all available commands",
    execute: async (sock, msg, args, commands) => {
        const prefix = config.prefix;
        
        let helpHeader = `*SYSTEM COMMAND CENTER*\n`;
        helpHeader += `_Assistant: Wil-AI Elite_\n`;
        helpHeader += `_Status: Active / Optimal_\n\n`;

        // Logically group commands for better UX
        const categories = {
            "SYSTEM": ["restart", "update", "ping", "sysinfo"],
            "AI & MEDIA": ["ai", "summarize", "play", "tiktok"],
            "UTILITY": ["afk", "sticker", "remindme"],
            "GROUP ADMIN": ["kick", "promote", "demote", "hidetag"]
        };

        let helpBody = "";

        for (const [category, cmdNames] of Object.entries(categories)) {
            let categoryText = `*─── [ ${category} ] ───*\n`;
            let hasAdded = false;

            cmdNames.forEach(name => {
                const cmd = commands.get(name);
                if (cmd) {
                    categoryText += `> *${prefix}${cmd.name}*\n  _${cmd.description}_\n`;
                    hasAdded = true;
                }
            });

            if (hasAdded) {
                helpBody += categoryText + "\n";
            }
        }

        const helpFooter = `\n_Ketik perintah di atas untuk memulai instruksi._\n_Gunakan dengan bijak._`;

        const finalHelp = helpHeader + helpBody + helpFooter;

        await sock.sendMessage(msg.key.remoteJid, { 
            text: finalHelp.trim(),
            contextInfo: {
                externalAdReply: {
                    title: "Wil-AI Human-Minimalist Assistant",
                    body: "System Menu & Documentation",
                    thumbnailUrl: "https://telegra.ph/file/279c16262b9a7be834a3e.jpg", // Professional placeholder thumbnail
                    sourceUrl: "https://github.com/itswill00",
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: msg });
    }
};
