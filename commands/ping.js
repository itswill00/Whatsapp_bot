export default {
    name: "ping",
    description: "Check bot latency or if the bot is alive",
    execute: async (sock, msg, args) => {
        const start = Date.now();
        const timestamp = (msg.messageTimestamp.low || msg.messageTimestamp);
        const latency = start - (timestamp * 1000);
        
        const output = `*PING* | _System Latency_\n` +
                       `• Response : ${latency}ms\n` +
                       `• Status   : Stable`;

        await sock.sendMessage(msg.key.remoteJid, { text: output }, { quoted: msg });
    }
};
