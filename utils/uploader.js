import axios from 'axios';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';

/**
 * Upload buffer to hosting with fallback
 * @param {Buffer} buffer 
 */
export const uploadFile = async (buffer) => {
    // Try Telegra.ph first (Fastest)
    try {
        const { ext } = await fileTypeFromBuffer(buffer) || { ext: 'jpg' };
        const form = new FormData();
        form.append('file', buffer, { filename: `media.${ext}` });

        const { data } = await axios.post('https://telegra.ph/upload', form, {
            headers: form.getHeaders(),
            timeout: 10000
        });

        if (data && data[0] && data[0].src) {
            return `https://telegra.ph${data[0].src}`;
        }
    } catch (e) {
        console.log("[Uploader] Telegra.ph failed, trying Catbox...");
    }

    // Fallback: Catbox.moe (More stable)
    try {
        const { ext } = await fileTypeFromBuffer(buffer) || { ext: 'jpg' };
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', buffer, { filename: `media.${ext}` });

        const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders(),
            timeout: 15000
        });

        if (typeof data === 'string' && data.startsWith('http')) {
            return data;
        }
    } catch (e) {
        console.error("[Uploader] Catbox failed:", e.message);
    }

    throw new Error("Semua layanan uploader gagal. Silakan coba lagi nanti.");
};

// Keep old names for compatibility if needed, but point to new logic
export const uploadToTelegraph = uploadFile;
