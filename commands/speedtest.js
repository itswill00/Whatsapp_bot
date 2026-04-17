import speedTest from 'speedtest-net';

export default {
    name: "speedtest",
    description: "Uji kecepatan internet server",
    execute: async (sock, msg, args) => {
        const remoteJid = msg.key.remoteJid;

        await sock.sendMessage(remoteJid, { text: "_Mengukur kecepatan jaringan..._" }, { quoted: msg });

        try {
            const result = await speedTest({ acceptLicense: true, acceptGdpr: true });

            const dl = (result.download.bandwidth * 8 / 1_000_000).toFixed(1);
            const ul = (result.upload.bandwidth * 8 / 1_000_000).toFixed(1);
            const ping = result.ping.latency.toFixed(0);
            const jitter = result.ping.jitter.toFixed(0);
            const isp = result.isp || "Unknown";
            const loc = result.server.location || "Unknown";

            const out = `*Network Test*\n` +
                        `Download  ${dl} Mbps\n` +
                        `Upload    ${ul} Mbps\n` +
                        `Ping      ${ping} ms  Jitter ${jitter} ms\n` +
                        `\n` +
                        `_${isp} — ${loc}_`;

            await sock.sendMessage(remoteJid, { text: out }, { quoted: msg });

        } catch (err) {
            console.error("[Speedtest Error]:", err);
            await sock.sendMessage(remoteJid, { text: "Speedtest gagal. Cek log server untuk detail." }, { quoted: msg });
        }
    }
};
