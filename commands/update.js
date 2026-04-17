import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: "update",
    description: "Update bot dari GitHub (Hanya Owner)",
    execute: async (sock, msg, args) => {
        let sender = msg.key.participant || msg.key.remoteJid;
        if (sender.includes(':')) sender = sender.split(':')[0] + '@s.whatsapp.net';
        
        let configOwner = config.ownerNumber;
        if (configOwner.includes(':')) configOwner = configOwner.split(':')[0] + '@s.whatsapp.net';

        if (sender !== configOwner) return;

        await sock.sendMessage(msg.key.remoteJid, { text: "Sedang mengunduh update dari GitHub..." }, { quoted: msg });

        exec('git pull origin main', async (err, stdout, stderr) => {
            if (err) {
                console.error("[Git Pull Error]:", err);
                return await sock.sendMessage(msg.key.remoteJid, { text: "Gagal menarik update dari GitHub. Cek log server." }, { quoted: msg });
            }

            if (stdout.includes('Already up to date')) {
                return await sock.sendMessage(msg.key.remoteJid, { text: "Bot sudah menggunakan versi terbaru." }, { quoted: msg });
            }

            // Save reboot state
            const rebootPath = path.join(__dirname, '../data/reboot.json');
            if (!fs.existsSync(path.dirname(rebootPath))) {
                fs.mkdirSync(path.dirname(rebootPath), { recursive: true });
            }
            fs.writeFileSync(rebootPath, JSON.stringify({ jid: msg.key.remoteJid, type: 'update' }));

            await sock.sendMessage(msg.key.remoteJid, { text: "Update berhasil diunduh. Bot akan restart otomatis untuk menerapkan perubahan." }, { quoted: msg });
            
            setTimeout(() => {
                process.exit(1);
            }, 2500);
        });
    }
};
