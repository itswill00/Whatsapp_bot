import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { getMediaBuffer, saveTempFile } from '../utils/media.js';

// Dynamically set path so we don't have to worry about missing global ffmpeg installations
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export default {
    name: "sticker",
    description: "Buat stiker dari foto/video (Kirim foto atau balas media dengan !sticker)",
    execute: async (sock, msg, args) => {
        const buffer = await getMediaBuffer(msg);
        if (!buffer) {
            return await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Kirim gambar/video atau balas pesan bergambar dengan perintah !sticker" }, { quoted: msg });
        }

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "⚙️", key: msg.key } });

        const tempInput = saveTempFile(buffer, 'media');
        const tempOutput = tempInput + '.webp';

        // Convert payload into standard WhatsApp 512x512 WebP sticker format
        ffmpeg(tempInput)
            .inputOptions('-y')
            .addOutputOptions([
                "-vcodec", "libwebp",
                "-vf", "scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease,fps=15, pad=512:512:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
                "-loop", "0",
                "-t", "00:00:10" // Limit videos/GIFs to 10 seconds max to prevent size bloat
            ])
            .toFormat('webp')
            .save(tempOutput)
            .on('end', async () => {
                try {
                    const webpBuffer = fs.readFileSync(tempOutput);
                    await sock.sendMessage(msg.key.remoteJid, { sticker: webpBuffer }, { quoted: msg });
                } catch (e) {
                    console.error("Failed to send sticker:", e);
                } finally {
                    fs.unlinkSync(tempInput);
                    fs.unlinkSync(tempOutput);
                }
            })
            .on('error', async (err) => {
                console.error("[Sticker Converter Error]:", err);
                await sock.sendMessage(msg.key.remoteJid, { text: "❌ Sistem gagal mengkonversi media menjadi stiker." }, { quoted: msg });
                if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
            });
    }
};
