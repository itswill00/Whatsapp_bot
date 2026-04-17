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

        const providers = [
            {
                name: "Widipe",
                url: `https://widipe.com/download/igdl?url=${encodeURIComponent(url)}`,
                parser: (res) => res?.data?.result?.[0]?.url || res?.data?.result?.[0]
            },
            {
                name: "Alya",
                url: `https://api.alyaserver.my.id/api/download/igdl?url=${encodeURIComponent(url)}`,
                parser: (res) => res?.data?.data?.[0]?.url || res?.data?.data?.[0]
            },
            {
                name: "Ryzendesu",
                url: `https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`,
                parser: (res) => res?.data?.result?.[0]?.url || res?.data?.result?.[0]
            },
            {
                name: "Siputzx",
                url: `https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(url)}`,
                parser: (res) => res?.data?.data?.[0]?.url || res?.data?.data?.[0]
            }
        ];

        let videoUrl = null;
        let lastError = "Semua provider gagal mengembalikan data.";

        try {
            for (const provider of providers) {
                try {
                    console.log(`[IG] Mencoba provider: ${provider.name}`);
                    const response = await axios.get(provider.url, { timeout: 10000 });
                    const result = provider.parser(response);
                    
                    if (result && typeof result === 'string' && result.startsWith('http')) {
                        videoUrl = result;
                        console.log(`[IG] Berhasil menggunakan provider: ${provider.name}`);
                        break;
                    }
                } catch (e) {
                    console.error(`[IG] Provider ${provider.name} gagal:`, e.message);
                }
            }

            if (!videoUrl) throw new Error(lastError);

            const caption = `*Instagram*\n_Berhasil diekstrak via provider cadangan_`;

            await sock.sendMessage(remoteJid, { 
                video: { url: videoUrl }, 
                caption: caption,
                mimetype: 'video/mp4'
            }, { quoted: msg });

        } catch (err) {
            console.error(`[IG Downloader Error]:`, err.message);
            sock.sendMessage(remoteJid, {
                text: `Gagal diproses.\n_Details: ${err.message}_`
            }, { quoted: msg });
        }
    }
};

