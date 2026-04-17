import fs from 'fs';
import { downloadMedia } from '../utils/ytDlpEngine.js';

export default {
    name: "twitter",
    description: "Download video dari Twitter/X",
    execute: async (sock, msg, args) => {
        const remoteJid = msg.key.remoteJid;

        if (!args.length || !(args[0].includes('twitter.com') || args[0].includes('x.com') || args[0].includes('t.co'))) {
            return sock.sendMessage(remoteJid, {
                text: `Kirim link setelah perintah.\n_Contoh: !twitter https://x.com/xxx_`
            }, { quoted: msg });
        }

        const url = args[0];
        await sock.sendMessage(remoteJid, { text: `_Mengunduh dari Twitter..._` }, { quoted: msg });

        let filePath = null;
        try {
            const { filePath: fp, meta } = await downloadMedia(url, 'twitter');
            filePath = fp;
            const buffer = fs.readFileSync(filePath);

            let caption = `*Twitter*`;
            if (meta) {
                if (meta.uploader) caption += ` · @${meta.uploader.replace(/\s+/g, '')}`;
                if (meta.title)    caption += `\n_${meta.title.slice(0, 80)}${meta.title.length > 80 ? '…' : ''}_`;
            }

            await sock.sendMessage(remoteJid, { video: buffer, mimetype: 'video/mp4', caption }, { quoted: msg });

        } catch (err) {
            console.error(`[Twitter Downloader Error]:`, err.message);
            sock.sendMessage(remoteJid, {
                text: `Gagal mengunduh URL Twitter yang diberikan.\n_Pastikan akun publik dan link memuat video._`
            }, { quoted: msg });
        } finally {
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
    }
};
