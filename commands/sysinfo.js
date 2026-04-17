import os from 'os';

function fmtBytes(b) {
    if (b === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(1024));
    return `${(b / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function fmtUptime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return h > 0 ? `${h}j ${m}m` : `${m}m ${s}s`;
}

export default {
    name: "sysinfo",
    description: "Info mesin dan status runtime bot",
    execute: async (sock, msg, args, commands) => {
        const cpu = os.cpus()[0]?.model?.trim() || "Unknown";
        const cores = os.cpus().length;
        const totalMem = os.totalmem();
        const usedMem = totalMem - os.freemem();
        const memPct = ((usedMem / totalMem) * 100).toFixed(0);
        const rss = process.memoryUsage().rss;

        const out =
            `*System Info*\n` +
            `\n` +
            `*OS*\n` +
            `  ${os.type()} ${os.arch()}  —  up ${fmtUptime(os.uptime())}\n` +
            `\n` +
            `*CPU*\n` +
            `  ${cpu.length > 32 ? cpu.slice(0, 32) + '…' : cpu}  (${cores} core)\n` +
            `\n` +
            `*RAM*\n` +
            `  ${fmtBytes(usedMem)} / ${fmtBytes(totalMem)}  (${memPct}%)\n` +
            `\n` +
            `*Bot*\n` +
            `  Node ${process.version}  —  up ${fmtUptime(Math.floor(process.uptime()))}\n` +
            `  RSS ${fmtBytes(rss)}  —  ${commands?.size ?? 0} commands`;

        await sock.sendMessage(msg.key.remoteJid, { text: out }, { quoted: msg });
    }
};
