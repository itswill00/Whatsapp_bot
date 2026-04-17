import os from 'os';

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    
    let timeStr = "";
    if (d > 0) timeStr += `${d} Hari, `;
    if (h > 0) timeStr += `${h} Jam, `;
    timeStr += `${m} Menit, ${s} Detik`;
    return timeStr;
}

export default {
    name: "sysinfo",
    description: "Melihat spesifikasi mesin (VPS/Hosting) dan status performa bot",
    execute: async (sock, msg, args, commands) => {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "📊", key: msg.key } });

        // 1. Gathering OS Metrics
        const cpuModel = os.cpus()[0]?.model?.trim() || "Model Processor Tidak Diketahui";
        const cpuCores = os.cpus().length;
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
        const serverUptime = formatUptime(os.uptime());
        
        // 2. Node.js Engine Metrics
        const processUptime = formatUptime(process.uptime());
        const nodeMemUsage = process.memoryUsage();
        
        // Build Minimalist Monotonic UI
        const text = `SYSTEM DIAGNOSTICS
        
OS & HOSTING
Platform: ${os.type()} (${os.arch()})
Uptime: ${serverUptime}

PROCESSOR
Model: ${cpuModel}
Cores: ${cpuCores}

MEMORY
Total: ${formatBytes(totalMem)}
Used: ${formatBytes(usedMem)} (${memUsagePercent}%)
Free: ${formatBytes(freeMem)}

BOT RUNTIME
Version: ${process.version}
Uptime: ${processUptime}
Memory RSS: ${formatBytes(nodeMemUsage.rss)}
Heap Used: ${formatBytes(nodeMemUsage.heapUsed)}

METRICS
Commands: ${commands ? commands.size : '0'}`;

        await sock.sendMessage(msg.key.remoteJid, { text: text }, { quoted: msg });
    }
};
