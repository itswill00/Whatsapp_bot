import config from '../config.js';

export default {
    name: "help",
    description: "List all available commands",
    execute: async (sock, msg, args, commands) => {
        const prefix = config.prefix;
        
        let helpHeader = `*WIL-AI* | Assistant System\n`;
        helpHeader += `──────────────────────\n\n`;

        const categories = {
            "SYSTEM": ["restart", "update", "speedtest", "ping", "sysinfo"],
            "AI ENGINE": ["ai", "summarize", "play", "tiktok"],
            "UTILITIES": ["afk", "sticker", "remindme"],
            "GROUP MGMT": ["kick", "promote", "demote", "hidetag"]
        };

        let helpBody = "";

        for (const [category, cmdNames] of Object.entries(categories)) {
            let categoryBlock = `┌─ *${category}*\n`;
            let filteredCommands = cmdNames.filter(name => commands.has(name));
            
            filteredCommands.forEach((name, index) => {
                const cmd = commands.get(name);
                const isLast = index === filteredCommands.length - 1;
                const symbol = isLast ? "└" : "├";
                categoryBlock += `${symbol} ${prefix}${cmd.name} › _${cmd.description}_\n`;
            });

            if (filteredCommands.length > 0) {
                helpBody += categoryBlock + "\n";
            }
        }

        const helpFooter = `──────────────────────\n_Interface: Terminal v2.0_\n_Mode: Human-Minimalist_`;

        const finalHelp = helpHeader + helpBody + helpFooter;

        await sock.sendMessage(msg.key.remoteJid, { text: finalHelp.trim() }, { quoted: msg });
    }
};
