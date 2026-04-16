import axios from 'axios';

export default {
    name: "tiktok",
    description: "Download video Tiktok tanpa watermark. Gunakan format !tiktok <link_video>",
    execute: async (sock, msg, args) => {
        if (args.length === 0) return await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Mana linknya? Contoh: !tiktok https://vt.tiktok.com/xxxx/" }, { quoted: msg });
        
        const url = args[0];
        if (!url.includes('tiktok.com')) return await sock.sendMessage(msg.key.remoteJid, { text: "❌ Link tidak valid! Pastikan itu adalah URL TikTok." }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "⏳", key: msg.key } });

        try {
            // Scraping via Free Public API (TikWM)
            const response = await axios.post("https://www.tikwm.com/api/", { 
                url: url, 
                count: 12, 
                cursor: 0, 
                web: 1, 
                hd: 1 
            });
            const data = response.data?.data;

            if (!data || !data.play) {
                return await sock.sendMessage(msg.key.remoteJid, { text: "❌ Gagal mengunduh. Pastikan video tidak di-private." }, { quoted: msg });
            }

            let videoUrl = data.play;
            if (videoUrl.startsWith('/')) videoUrl = `https://www.tikwm.com${videoUrl}`;

            let hdVideoUrl = data.hdplay || videoUrl; // Prefer HD if available
            if (hdVideoUrl.startsWith('/')) hdVideoUrl = `https://www.tikwm.com${hdVideoUrl}`;
            
            const caption = `📱 *TikTok Downloader*\n\n👤 *Akun:* ${data.author?.nickname || 'Unknown'}\n📝 *Deskripsi:* ${data.title || '-'}\n🎵 *Musik:* ${data.music_info?.title || '-'}\n\n_Auto-Downloaded by Bot_`;

            await sock.sendMessage(msg.key.remoteJid, { 
                video: { url: hdVideoUrl }, 
                caption: caption,
                mimetype: 'video/mp4'
            }, { quoted: msg });

        } catch (error) {
            console.error("[Tiktok Downloader Error]:", error?.message);
            await sock.sendMessage(msg.key.remoteJid, { text: "❌ Server pengunduh internal error atau koneksi terputus." }, { quoted: msg });
        }
    }
};
