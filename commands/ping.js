export default {
    name: "ping",
    description: "Check bot latency or if the bot is alive",
    execute: async (sock, msg, args) => {
        // Send a simple text reply
        await sock.sendMessage(msg.key.remoteJid, { text: "pong!" }, { quoted: msg });
    }
};
