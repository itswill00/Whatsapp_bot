export default {
    name: "ping",
    description: "Cek latensi bot",
    execute: async (sock, msg, args) => {
        const timestamp = (msg.messageTimestamp.low || msg.messageTimestamp);
        const latency = Date.now() - (timestamp * 1000);

        await sock.sendMessage(msg.key.remoteJid, { 
            text: `Pong — ${latency}ms` 
        }, { quoted: msg });
    }
};
