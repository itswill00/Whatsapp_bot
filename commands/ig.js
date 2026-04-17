import fs from 'fs';
import { downloadMedia } from '../utils/ytDlpEngine.js';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

export default {
    name: "ig",
    description: "Download video/foto Instagram Reels atau Post",
    execute: async (sock, msg, args) => {
        const remoteJid = msg.key.remoteJid;

        if (!args.length || !args[0].includes('instagram.com')) {
            return sock.sendMessage(remoteJid, {
                text: `Kirim link setelah perintah.\n_Contoh: !ig https://instagram.com/reel/xxx_`
            }, { quoted: msg });
        }

        const url = args[0];
        await sock.sendMessage(remoteJid, { text: `_Mengunduh dari Instagram..._` }, { quoted: msg });

        let filePath = null;
        try {
            const { filePath: fp, ext: rawExt, meta } = await downloadMedia(url, 'instagram');
            filePath = fp;
            const ext = rawExt.toLowerCase();
            const buffer = fs.readFileSync(filePath);

            // Format caption ringkas
            let caption = `*Instagram*`;
            if (meta) {
                if (meta.uploader) caption += ` · @${meta.uploader}`;
                if (meta.title)    caption += `\n_${meta.title.slice(0, 100)}${meta.title.length > 100 ? '…' : ''}_`;
            }

            if (IMAGE_EXTENSIONS.includes(ext)) {
                await sock.sendMessage(remoteJid, { image: buffer, caption }, { quoted: msg });
            } else {
                await sock.sendMessage(remoteJid, { video: buffer, mimetype: 'video/mp4', caption }, { quoted: msg });
            }

        } catch (err) {
            console.error(`[IG Downloader Error]:`, err.message);
            
            // Format rincian error teknis yang compact
            const errorSnippet = err.message.slice(0, 150).replace(/\n/g, ' ');
            
            sock.sendMessage(remoteJid, {
                text: `Gagal diproses oleh engine.\n_Details: ${errorSnippet}_`
            }, { quoted: msg });
        } finally {
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
    }
};
