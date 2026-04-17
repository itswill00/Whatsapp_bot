import fs from 'fs';
import { downloadMedia } from '../utils/ytDlpEngine.js';

export default {
    name: "yt",
    description: "Download video YouTube berdurasi pendek (max 50MB)",
    execute: async (sock, msg, args) => {
        const remoteJid = msg.key.remoteJid;

        if (!args.length || !(args[0].includes('youtube.com') || args[0].includes('youtu.be'))) {
            return sock.sendMessage(remoteJid, {
                text: `Kirim link setelah perintah.\n_Contoh: !yt https://youtu.be/xxx_`
            }, { quoted: msg });
        }

        const url = args[0];
        await sock.sendMessage(remoteJid, { text: `_Mengunduh video dari YouTube..._` }, { quoted: msg });

        let filePath = null;
        try {
            const { filePath: fp, meta } = await downloadMedia(url, 'youtube');
            filePath = fp;
            const buffer = fs.readFileSync(filePath);

            let caption = `*YouTube*`;
            if (meta) {
                if (meta.uploader) caption += ` · @${meta.uploader.replace(/\s+/g, '')}`;
                if (meta.title)    caption += `\n_${meta.title.slice(0, 80)}${meta.title.length > 80 ? '…' : ''}_`;
            }

            await sock.sendMessage(remoteJid, { video: buffer, mimetype: 'video/mp4', caption }, { quoted: msg });

        } catch (err) {
            console.error(`[YT Downloader Error]:`, err.message);
            sock.sendMessage(remoteJid, {
                text: `Gagal mengunduh video YouTube.\n_Pastikan batas tidak lebih dari resolusi 720p / 50 MB limits._`
            }, { quoted: msg });
        } finally {
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
    }
};
