import yts from 'yt-search';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: "play",
    description: "Pemutar musik YouTube premium menggunakan Local Downloader Engine (yt-dlp)",
    execute: async (sock, msg, args) => {
        if (!args.length) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Masukkan judul lagu! Contoh: *!play lathi*" }, { quoted: msg });

        const query = args.join(" ");
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🔍", key: msg.key } });

        try {
            // 1. Cari video di YouTube
            const searchResults = await yts(query);
            const video = searchResults.videos[0];
            if (!video) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Lagu tidak ditemukan." }, { quoted: msg });

            // Batasi durasi agar tidak membebani server (Max 10 Menit)
            if (video.seconds > 600) {
                return sock.sendMessage(msg.key.remoteJid, { text: "❌ Durasi terlalu panjang! Maksimal 10 menit agar server tetap stabil." }, { quoted: msg });
            }

            const caption = `Pemutar Musik YouTube\nJudul: ${video.title}\nDurasi: ${video.timestamp}\nStatus: Sedang memproses file via VPS...`;
            await sock.sendMessage(msg.key.remoteJid, { image: { url: video.thumbnail }, caption: caption }, { quoted: msg });

            // 2. Persiapkan Folder Temp
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            
            const fileName = `audio_${Date.now()}.mp3`;
            const filePath = path.join(tempDir, fileName);

            // 3. Eksekusi yt-dlp secara lokal
            // Penyamaran Elit: Pura-pura jadi HP Android/iOS untuk menipu bot-detection YouTube
            const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
            const ytDlpCommand = `yt-dlp -x --audio-format mp3 --audio-quality 0 --no-check-certificates --user-agent "${userAgent}" --extractor-args "youtube:player-client=android,ios" "${video.url}" -o "${filePath}"`;

            exec(ytDlpCommand, async (error, stdout, stderr) => {
                if (error) {
                    console.error("[yt-dlp Error]:", error);
                    console.error("[yt-dlp Stderr]:", stderr);
                    
                    if (error.message.includes('not found')) {
                        return sock.sendMessage(msg.key.remoteJid, { text: "ERROR: yt_dlp_binary_not_found_on_vps" }, { quoted: msg });
                    }
                    
                    const errorSnippet = stderr ? stderr.slice(-150) : error.message.slice(0, 150);
                    return sock.sendMessage(msg.key.remoteJid, { text: `ERROR: processing_failed\nDetails: ${errorSnippet}` }, { quoted: msg });
                }

                // 4. Kirim Audio ke WhatsApp
                try {
                    const audioBuffer = fs.readFileSync(filePath);
                    await sock.sendMessage(msg.key.remoteJid, { 
                        audio: audioBuffer, 
                        mimetype: 'audio/mp4', 
                        ptt: false 
                    }, { quoted: msg });
                } catch (sendErr) {
                    console.error("[Send Audio Error]:", sendErr);
                } finally {
                    // 5. Hapus file temp setelah dikirim (Clean up)
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                }
            });

        } catch (e) {
            console.error("[Play Local Engine Error]:", e);
            sock.sendMessage(msg.key.remoteJid, { text: "❌ Sistem internal mengalami kegagalan proses." }, { quoted: msg });
        }
    }
};
