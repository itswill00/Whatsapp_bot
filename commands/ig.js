import axios from 'axios';

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

        try {
            // Mencoba API Publik yang sering aktif di komunitas WA Bot ID
            // API Ke-1: Widipe
            let apiUrl = `https://widipe.com/download/igdl?url=${encodeURIComponent(url)}`;
            let response = await axios.get(apiUrl, { timeout: 15000 }).catch(() => null);
            let mediaData = response?.data?.result;

            if (!mediaData || mediaData.length === 0) {
                // API Ke-2 Fallback: SIPUTZX
                apiUrl = `https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(url)}`;
                response = await axios.get(apiUrl, { timeout: 15000 }).catch(() => null);
                mediaData = response?.data?.data; // Siputzx biasanya mengembalikan `data` array
            }

            if (!mediaData || mediaData.length === 0) {
                throw new Error("Semua API Spoofing sedang down atau Rate Limited.");
            }

            // Ambil URL resolusi tertinggi dari array result (biasanya index pertama)
            // Format respon berbeda-beda tiap API, kita ambil item URL nya
            let videoUrl = typeof mediaData[0] === 'string' ? mediaData[0] : (mediaData[0].url || mediaData[0]);

            if (!videoUrl) throw new Error("Gagal mengambil media direct link dari JSON response.");

            const caption = `*Instagram*\n_Berhasil diekstrak via Cloud API_`;

            // Mimetype otomatis di-handle WhatsApp jika dikirim sebagai dokumen/video URL
            await sock.sendMessage(remoteJid, { 
                video: { url: videoUrl }, 
                caption: caption,
                mimetype: 'video/mp4'
            }, { quoted: msg });

        } catch (err) {
            console.error(`[IG Downloader Error]:`, err.message);
            sock.sendMessage(remoteJid, {
                text: `Gagal diproses oleh API Pihak Ketiga.\n_Details: ${err.message}_`
            }, { quoted: msg });
        }
    }
};

