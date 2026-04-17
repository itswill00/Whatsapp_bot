import yts from 'yt-search';
import axios from 'axios';

export default {
    name: "play",
    description: "Ciptakan mesin pencari dan pemutar lagu MP3 dari YouTube hanya dengan judul.",
    execute: async (sock, msg, args) => {
        if (!args.length) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Masukkan judul lagu yang ingin didengar! Contoh: *!play adele hello*" }, { quoted: msg });
        
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🔍", key: msg.key } });
        const query = args.join(" ");

        try {
            // 1. Scraping data via yt-search
            const searchResults = await yts(query);
            const videos = searchResults.videos;
            if (!videos.length) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Tidak menemukan lagu tersebut di YouTube." }, { quoted: msg });
            
            const video = videos[0];
            const caption = `🎵 *YOUTUBE AUDIO PLAYER*\n\n📌 *Judul:* ${video.title}\n⏱️ *Durasi:* ${video.timestamp}\n👀 *Views:* ${video.views}\n🔗 *Channel:* ${video.author.name}\n\n_⏳ Mesin sedang menarik MP3 dari server, mohon dimaklumi apabila memakan waktu beberapa detik..._`;
            
            // 2. Berikan notifikasi awal kepada user (berupa thumbnail & Info)
            await sock.sendMessage(msg.key.remoteJid, { image: { url: video.thumbnail }, caption: caption }, { quoted: msg });
            
            // 3. Tarik MP3 menggunakan Multi-API Fallback System
            const youtubeUrl = video.url;
            const apiSources = [
                {
                    url: `https://api.vreden.web.id/api/ytmp3?url=${encodeURIComponent(youtubeUrl)}`,
                    parser: (data) => data?.result?.download?.url || data?.result?.download
                },
                {
                    url: `https://aemt.me/youtube?url=${encodeURIComponent(youtubeUrl)}&filter=audioandvideo`,
                    parser: (data) => data?.url
                },
                {
                    url: `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(youtubeUrl)}`,
                    parser: (data) => data?.data?.dl || data?.data?.url
                },
                {
                    url: `https://api.tiklydown.eu.org/api/download/ytmp3?url=${encodeURIComponent(youtubeUrl)}`,
                    parser: (data) => data?.url || data?.result?.url
                }
            ];

            let audioUrl = null;
            
            // Loop through each API until one returns a valid audio URL
            for (const source of apiSources) {
                try {
                    const res = await axios.get(source.url, { timeout: 10000 }).catch(() => null);
                    if (res && res.data) {
                        const parsedUrl = source.parser(res.data);
                        if (parsedUrl) {
                            audioUrl = parsedUrl;
                            break; // Stop immediately if we found a working link
                        }
                    }
                } catch (err) {
                    console.error("[API Fallback Error]:", err.message);
                }
            }

            if (!audioUrl) {
                return sock.sendMessage(msg.key.remoteJid, { text: "❌ Semua server pengunduh sedang sibuk. Silakan coba lagi beberapa saat lagi atau gunakan judul lagu lain." }, { quoted: msg });
            }

            await sock.sendMessage(msg.key.remoteJid, { 
                audio: { url: audioUrl }, 
                mimetype: 'audio/mp4', // Mimetype universal agar bisa diplay di dalam WA
                ptt: false // Jadikan true jika ingin wujudnya Voice Note bulat (bukan dokumen lagu)
            }, { quoted: msg });

        } catch (e) {
            console.error("[Play Command Error]:", e);
            sock.sendMessage(msg.key.remoteJid, { text: "❌ Koneksi mesih pencari YouTube sedang terdistorsi/error." }, { quoted: msg });
        }
    }
};
