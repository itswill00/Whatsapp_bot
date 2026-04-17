import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { decodeJid } from '../utils/helper.js';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: "restart",
    description: "Restart bot (Hanya Owner)",
    execute: async (sock, msg, args) => {
        const sender = decodeJid(msg.key.participant || msg.key.remoteJid);
        const configOwner = decodeJid(config.ownerNumber);

        // Internal Debug Log
        console.log(`[Auth Check] Sender: ${sender} | Owner: ${configOwner}`);

        if (sender !== configOwner) {
            return await sock.sendMessage(msg.key.remoteJid, { text: "Maaf, akses ditolak. Perintah ini hanya bisa dijalankan oleh Owner." }, { quoted: msg });
        } 

        // Save reboot state
        const rebootPath = path.join(__dirname, '../data/reboot.json');
        if (!fs.existsSync(path.dirname(rebootPath))) {
            fs.mkdirSync(path.dirname(rebootPath), { recursive: true });
        }
        fs.writeFileSync(rebootPath, JSON.stringify({ jid: msg.key.remoteJid, type: 'restart' }));

        await sock.sendMessage(msg.key.remoteJid, { text: "Proses restart dimulai. Tunggu sebentar sampai bot aktif kembali." }, { quoted: msg });
        
        setTimeout(() => {
            process.exit(1); 
        }, 1500);
    }
};
