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

        await sock.sendMessage(msg.key.remoteJid, { text: "⏳ Sedang menghubungi GitHub Repository dan mensinkronisasikan perubahan..." }, { quoted: msg });

        exec('git pull origin main', async (err, stdout, stderr) => {
            if (err) {
                console.error("[Git Pull Error]:", err);
                return await sock.sendMessage(msg.key.remoteJid, { text: `❌ Sistem gagal ditarik dari GitHub:\n\n${stderr}` }, { quoted: msg });
            }

            if (stdout.includes('Already up to date')) {
                return await sock.sendMessage(msg.key.remoteJid, { text: "✅ Bot sudah menggunakan versi paling terbaru. Tidak ada update yang tersedia." }, { quoted: msg });
            }

            // Jika ada update (perubahan baris kode)
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `✅ *Update Sukses Ditarik!*\n\n*Log Output:*\n${stdout}\n\n🔄 Bot akan melalukan _auto-restart_ untuk menerapkan pembaruan logika...` 
            }, { quoted: msg });
            
            // Tunggu 2 detik, lalu exit node. PM2 akan secara otomatis men-spawn bot lagi dengan versi terbaru!
            setTimeout(() => {
                process.exit(1);
            }, 2500);
        });
    }
};
