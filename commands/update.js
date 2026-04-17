import { exec } from 'child_process';
import config from '../config.js';

export default {
    name: "update",
    description: "Menarik (git pull) pembaruan otomatis dari GitHub (Hanya Owner)",
    execute: async (sock, msg, args) => {
        // Keamanan mutlak: Hanya eksekusi git jika itu owner asli
        let sender = msg.key.participant || msg.key.remoteJid;
        if (sender.includes(':')) sender = sender.split(':')[0] + '@s.whatsapp.net';
        
        let configOwner = config.ownerNumber;
        if (configOwner.includes(':')) configOwner = configOwner.split(':')[0] + '@s.whatsapp.net';

        if (sender !== configOwner) return;

        await sock.sendMessage(msg.key.remoteJid, { text: "SYSTEM UPDATE\nAction: git_pull_origin\nStatus: synchronizing" }, { quoted: msg });

        exec('git pull origin main', async (err, stdout, stderr) => {
            if (err) {
                console.error("[Git Pull Error]:", err);
                return await sock.sendMessage(msg.key.remoteJid, { text: `ERROR: git_pull_failed\nDetails: ${stderr}` }, { quoted: msg });
            }

            if (stdout.includes('Already up to date')) {
                return await sock.sendMessage(msg.key.remoteJid, { text: "SYSTEM UPDATE\nStatus: already_up_to_date" }, { quoted: msg });
            }

            // Jika ada update (perubahan baris kode)
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `SYSTEM UPDATE\nStatus: successfully_merged\nDetails: ${stdout}\nAction: auto_restart` 
            }, { quoted: msg });
            
            // Tunggu 2 detik, lalu exit node. PM2 akan secara otomatis men-spawn bot lagi dengan versi terbaru!
            setTimeout(() => {
                process.exit(1);
            }, 2500);
        });
    }
};
