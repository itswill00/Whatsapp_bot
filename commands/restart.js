import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: "restart",
    description: "Restart bot (Hanya Owner)",
    execute: async (sock, msg, args) => {
        let sender = msg.key.participant || msg.key.remoteJid;
        if (sender.includes(':')) sender = sender.split(':')[0] + '@s.whatsapp.net';

        let configOwner = config.ownerNumber;
        if (configOwner.includes(':')) configOwner = configOwner.split(':')[0] + '@s.whatsapp.net';

        if (sender !== configOwner) return; 

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
