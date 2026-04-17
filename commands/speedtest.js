import speedTest from 'speedtest-net';

export default {
    name: "speedtest",
    description: "Uji kecepatan internet VPS (Ookla Engine)",
    execute: async (sock, msg, args) => {
        const remoteJid = msg.key.remoteJid;
        
        await sock.sendMessage(remoteJid, { text: "_Sedang mengukur performa jaringan... Mohon tunggu._" }, { quoted: msg });

        try {
            // Run speedtest with auto-accept license
            const result = await speedTest({ 
                acceptLicense: true, 
                acceptGdpr: true 
            });

            // Convert bandwidth (bytes per second) to Mbps
            const download = (result.download.bandwidth * 8 / 1000000).toFixed(2);
            const upload = (result.upload.bandwidth * 8 / 1000000).toFixed(2);
            const ping = result.ping.latency.toFixed(0);
            const jitter = result.ping.jitter.toFixed(0);
            const isp = result.isp || "Unknown";
            const server = result.server.location || "Unknown";

            const output = `*NETWORK AUDIT* | _Performance Status_\n` +
                           `──────────────────────\n` +
                           `• Download : ${download} Mbps\n` +
                           `• Upload   : ${upload} Mbps\n` +
                           `• Latency  : ${ping} ms (${jitter}ms)\n` +
                           `──────────────────────\n` +
                           `_Node: ${isp} / ${server}_`;

            await sock.sendMessage(remoteJid, { text: output }, { quoted: msg });

        } catch (error) {
            console.error("[Speedtest Error]:", error);
            
            let errorMsg = "Gagal menjalankan speedtest.";
            if (error.message.includes('not found')) {
                errorMsg = "Gagal: Library speedtest-net bermasalah atau butuh binary di VPS.";
            }
            
            await sock.sendMessage(remoteJid, { text: errorMsg }, { quoted: msg });
        }
    }
};
