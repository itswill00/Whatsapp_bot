import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { decodeJid } from '../utils/helper.js';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: "update",
    description: "Update bot dari GitHub (Hanya Owner)",
    execute: async (sock, msg, args) => {
        const rawSender = msg.key.participant || msg.key.remoteJid;
        const sender = decodeJid(rawSender);
        const isOwner = Array.isArray(config.ownerNumber) 
            ? config.ownerNumber.map(n => decodeJid(n)).includes(sender)
            : decodeJid(config.ownerNumber) === sender;

        if (!isOwner) {
            return await sock.sendMessage(msg.key.remoteJid, { text: "Maaf, akses ditolak. Perintah ini khusus untuk Owner bot." }, { quoted: msg });
        }

        await sock.sendMessage(msg.key.remoteJid, { text: "_Menarik update dari GitHub..._" }, { quoted: msg });

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

            await sock.sendMessage(msg.key.remoteJid, { text: "_Update selesai. Bot akan restart._" }, { quoted: msg });
            
            setTimeout(() => {
                process.exit(1);
            }, 2500);
        });
    }
};
