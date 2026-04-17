import axios from 'axios';
import { ApifyClient } from 'apify-client';
import config from '../config.js';

const APIFY_ACTOR_ID = 'OWBUCWZK5MEeO5XiC'; // epctex/instagram-video-downloader

export default {
    name: "ig",
    description: "Download video/foto Instagram Reels atau Post",
    execute: async (sock, msg, args) => {
        const remoteJid = msg.key.remoteJid;
        const apifyToken = config.apifyToken;

        if (!apifyToken) {
            return sock.sendMessage(remoteJid, {
                text: `⚠️ Apify Token belum terkonfigurasi di server.`
            }, { quoted: msg });
        }

        if (!args.length || !args[0].includes('instagram.com')) {
            return sock.sendMessage(remoteJid, {
                text: `Kirim link setelah perintah.\n_Contoh: !ig https://instagram.com/reel/xxx_`
            }, { quoted: msg });
        }

        const url = args[0];
        await sock.sendMessage(remoteJid, { text: `_Mengunduh dari Instagram (Apify Engine)..._` }, { quoted: msg });

        let videoUrl = null;

        try {
            // --- ENGINE 1: APIFY (Primary) ---
            const client = new ApifyClient({ token: apifyToken });
            const input = {
                "startUrls": [url],
                "quality": "highest",
                "compression": "none",
                "proxy": { "useApifyProxy": true }
            };

            const run = await client.actor(APIFY_ACTOR_ID).call(input, { timeout: 60 });
            const { items } = await client.dataset(run.defaultDatasetId).listItems();
            
            if (items && items.length > 0) {
                videoUrl = items[0].videoUrl || items[0].url || items[0].displayUrl;
            }

            // --- ENGINE 2: MULTI-PROVIDER FALLBACK (Secondary) ---
            if (!videoUrl) {
                console.log("[IG] Apify failed or returned no items, trying fallbacks...");
                const providers = [
                    { name: "Widipe", url: `https://widipe.com/download/igdl?url=${encodeURIComponent(url)}`, parser: (res) => res?.data?.result?.[0]?.url || res?.data?.result?.[0] },
                    { name: "Alya",   url: `https://api.alyaserver.my.id/api/download/igdl?url=${encodeURIComponent(url)}`, parser: (res) => res?.data?.data?.[0]?.url || res?.data?.data?.[0] },
                    { name: "Siputzx", url: `https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(url)}`, parser: (res) => res?.data?.data?.[0]?.url || res?.data?.data?.[0] }
                ];

                for (const provider of providers) {
                    try {
                        const response = await axios.get(provider.url, { timeout: 7000 });
                        const result = provider.parser(response);
                        if (result && typeof result === 'string' && result.startsWith('http')) {
                            videoUrl = result;
                            break;
                        }
                    } catch { /* continue */ }
                }
            }

            if (!videoUrl) throw new Error("Semua pengunduh gagal memproses link ini.");

            await sock.sendMessage(remoteJid, { 
                video: { url: videoUrl }, 
                caption: `*Instagram*\n_Berhasil diunduh via Apify Professional Engine_`,
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

