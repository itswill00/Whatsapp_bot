export default {
    name: "ping",
    description: "Check bot latency or if the bot is alive",
    execute: async (sock, msg, args) => {
        const start = Date.now();
        const timestamp = (msg.messageTimestamp.low || msg.messageTimestamp);
        const latency = start - (timestamp * 1000);
        
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `*PONG!* 🏓\n_Speed: ${latency}ms_` 
        }, { quoted: msg });
    }
};
