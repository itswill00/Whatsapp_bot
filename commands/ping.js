export default {
    name: "ping",
    description: "Check bot latency or if the bot is alive",
    execute: async (sock, msg, args) => {
        // Send a simple text reply
        const timestamp = msg.messageTimestamp;
        const now = Math.floor(Date.now() / 1000);
        const latency = now - (timestamp.low || timestamp);
        await sock.sendMessage(msg.key.remoteJid, { text: `SYSTEM STATUS: active\nLatency: ${latency}s` }, { quoted: msg });
    }
};
