import axios from 'axios';
import { ApifyClient } from 'apify-client';
import config from '../config.js';

const APIFY_ACTOR_ID = 'OWBUCWZK5MEeO5XiC'; 

/**
 * Detect media type from URL extension
 */
const getMediaType = (url) => {
    const cleanUrl = url.split('?')[0].toLowerCase();
    if (/\.(jpg|jpeg|png|webp)/.test(cleanUrl)) return 'image';
    if (/\.(mp4|mov|m4v)/.test(cleanUrl)) return 'video';
    return 'video'; // Default to video for safety
};

export default {
    name: "ig",
    description: "Download video/foto/gallery dari Instagram",
    execute: async (sock, msg, args) => {
        const remoteJid = msg.key.remoteJid;
        const apifyToken = config.apifyToken;

        if (!args.length || !args[0].includes('instagram.com')) {
            return sock.sendMessage(remoteJid, {
                text: `Kirim link setelah perintah.\n_Contoh: !ig https://instagram.com/p/xxx_`
            }, { quoted: msg });
        }

        const url = args[0];
        await sock.sendMessage(remoteJid, { text: `_Mengunduh media dari Instagram..._` }, { quoted: msg });

        let mediaItems = []; // Array of { url, type }
        let metadata = { username: null, title: null };

        try {
            // --- STAGE 1: FREE API CLOUD providers ---
            const providers = [
                { 
                    name: "SonzaiX", 
                    url: `https://api.sonzaix.indevs.in/sosmed/instagram?url=${encodeURIComponent(url)}`, 
                    parser: (res) => {
                        const d = res?.data;
                        if (!d) return null;
                        
                        metadata.username = d.username || d.nickname;
                        metadata.title = d.description;

                        let items = [];
                        if (d.video_url) items.push({ url: d.video_url, type: 'video' });
                        if (d.image_url) items.push({ url: d.image_url, type: 'image' });
                        
                        return items.length > 0 ? items : null;
                    }
                },
                { 
                    name: "Widipe",  
                    url: `https://widipe.com/download/igdl?url=${encodeURIComponent(url)}`, 
                    parser: (res) => {
                        const results = res?.data?.result;
                        if (!Array.isArray(results)) return null;
                        return results.map(i => ({ 
                            url: typeof i === 'string' ? i : i.url, 
                            type: getMediaType(typeof i === 'string' ? i : i.url) 
                        }));
                    }
                },
                { 
                    name: "Alya",    
                    url: `https://api.alyaserver.my.id/api/download/igdl?url=${encodeURIComponent(url)}`, 
                    parser: (res) => {
                        const data = res?.data?.data;
                        if (!Array.isArray(data)) return null;
                        return data.map(i => ({ 
                            url: i.url, 
                            type: getMediaType(i.url) 
                        }));
                    }
                }
            ];

            for (const provider of providers) {
                try {
                    const response = await axios.get(provider.url, { timeout: 15000 });
                    const result = provider.parser(response);
                    if (Array.isArray(result) && result.length > 0) {
                        mediaItems = result;
                        break;
                    }
                } catch { /* continue */ }
            }

            // --- STAGE 2: APIFY ENGINE (Fallback) ---
            if (mediaItems.length === 0 && apifyToken) {
                try {
                    const client = new ApifyClient({ token: apifyToken });
                    const input = {
                        "startUrls": [url],
                        "quality": "highest",
                        "proxy": { "useApifyProxy": true }
                    };

                    const run = await client.actor(APIFY_ACTOR_ID).call(input, { timeout: 60 });
                    const { items } = await client.dataset(run.defaultDatasetId).listItems();
                    
                    if (items && items.length > 0) {
                        metadata.username = items[0].ownerUsername || items[0].ownerFullName;
                        metadata.title = items[0].caption;
                        
                        // Handle sidecar (gallery)
                        if (items[0].childPosts && items[0].childPosts.length > 0) {
                            mediaItems = items[0].childPosts.map(post => ({
                                url: post.videoUrl || post.displayUrl,
                                type: post.type === 'Video' || post.videoUrl ? 'video' : 'image'
                            }));
                        } else {
                            mediaItems = [{
                                url: items[0].videoUrl || items[0].url || items[0].displayUrl,
                                type: items[0].videoUrl ? 'video' : 'image'
                            }];
                        }
                    }
                } catch (e) {
                    console.error("[IG] Apify Fallback failed:", e.message);
                }
            }

            if (mediaItems.length === 0) throw new Error("Gagal mengambil data dari link ini.");

            // Filter out invalid items
            mediaItems = mediaItems.filter(i => i.url && i.url.startsWith('http'));

            // Compact Caption (DS 3.0)
            const postAuthor = metadata.username ? ` · @${metadata.username}` : '';
            const postDesc = metadata.title ? `\n_${metadata.title.slice(0, 80)}${metadata.title.length > 80 ? '…' : ''}_` : '';
            const caption = `*Instagram*${postAuthor}${postDesc}`;

            // Send all media items (Loop for carousel)
            for (let i = 0; i < mediaItems.length; i++) {
                const item = mediaItems[i];
                const msgPayload = {};
                
                if (item.type === 'image') {
                    msgPayload.image = { url: item.url };
                } else {
                    msgPayload.video = { url: item.url };
                    msgPayload.mimetype = 'video/mp4';
                }

                // Only send caption on the first item to avoid spamming
                if (i === 0) msgPayload.caption = caption;

                await sock.sendMessage(remoteJid, msgPayload, { quoted: msg });
                
                // Small delay between items in gallery to avoid rate limit/overlap
                if (mediaItems.length > 1) await new Promise(resolve => setTimeout(resolve, 500));
            }

        } catch (err) {
            console.error(`[IG Error]:`, err.message);
            sock.sendMessage(remoteJid, {
                text: `❌ Gagal diproses.\n_Details: ${err.message}_`
            }, { quoted: msg });
        }
    }
};
