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
            
            // 3. Tarik MP3 menggunakan Public API
            // API Vreden and AEMT are popular robust public YouTube scrapers
            const apiUrl = `https://api.vreden.web.id/api/ytmp3?url=${encodeURIComponent(video.url)}`;
            const response = await axios.get(apiUrl).catch(() => null);
            
            let audioUrl = null;
            if (response && response.data && response.data.result && response.data.result.download) {
                audioUrl = response.data.result.download.url || response.data.result.download;
            }

            if (!audioUrl) {
                // Fallback REST API
                const fbRes = await axios.get(`https://aemt.me/youtube?url=${encodeURIComponent(video.url)}&filter=audioandvideo`).catch(() => null);
                if (fbRes && fbRes.data && fbRes.data.url) audioUrl = fbRes.data.url;
            }

            if (!audioUrl) {
                return sock.sendMessage(msg.key.remoteJid, { text: "❌ Gagal mengonversi video YouTube ini menjadi MP3. Server pihak ketiga sedang sibuk/down." }, { quoted: msg });
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
