import config from '../config.js';

export default {
    name: "help",
    description: "List all available commands",
    execute: async (sock, msg, args, commands) => {
        let text = `COMMAND LIST\nPrefix: ${config.prefix}\n\n`;
        
        commands.forEach((cmd) => {
            text += `- ${cmd.name}: ${cmd.description}\n`;
        });

        await sock.sendMessage(msg.key.remoteJid, { text: text.trim() }, { quoted: msg });
    }
};
