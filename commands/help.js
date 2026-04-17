import config from '../config.js';

export default {
    name: "help",
    description: "Tampilkan daftar perintah",
    execute: async (sock, msg, args, commands) => {
        const p = config.prefix;

        const categories = {
            "System":     ["restart", "update", "speedtest", "ping", "sysinfo"],
            "AI & Vision":["ai", "ocr", "hd", "summarize"],
            "Media DL":   ["play", "tiktok", "ig", "yt", "twitter"],
            "Utilitas":   ["ssweb", "afk", "sticker", "remindme"],
            "Grup":       ["kick", "promote", "demote", "hidetag"]
        };

        let out = `*Wil-AI* — System Command Index\n\n`;

        for (const [cat, names] of Object.entries(categories)) {
            const available = names.filter(n => commands.has(n));
            if (!available.length) continue;

            out += `*${cat}*\n`;
            available.forEach(n => {
                out += `· ${p}${n}\n`;
            });
            out += `\n`;
        }

        out += `_Type a command to begin._`;

        await sock.sendMessage(msg.key.remoteJid, { text: out.trim() }, { quoted: msg });
    }
};
