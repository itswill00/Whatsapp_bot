import axios from 'axios';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';

/**
 * High-Reliability File Uploader with Multi-Stage Fallback
 * @param {Buffer} buffer 
 */
export const uploadFile = async (buffer) => {
    const type = await fileTypeFromBuffer(buffer) || { mime: 'image/jpeg', ext: 'jpg' };
    
    // --- STAGE 1: TELEGRA.PH ---
    try {
        const form = new FormData();
        form.append('file', buffer, { 
            filename: `media.${type.ext}`,
            contentType: type.mime
        });

        const { data } = await axios.post('https://telegra.ph/upload', form, {
            headers: form.getHeaders(),
            timeout: 15000,
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        if (data && data[0] && data[0].src) {
            return `https://telegra.ph${data[0].src}`;
        }
    } catch (e) {
        console.log(`[Uploader] Stage 1 (Telegraph) failed: ${e.message}`);
    }

    // --- STAGE 2: CATBOX.MOE ---
    try {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', buffer, { 
            filename: `media.${type.ext}`,
            contentType: type.mime
        });

        const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders(),
            timeout: 20000,
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        if (typeof data === 'string' && data.startsWith('http')) {
            return data;
        }
    } catch (e) {
        console.log(`[Uploader] Stage 2 (Catbox) failed: ${e.message}`);
    }

    // --- STAGE 3: QU.AX ---
    try {
        const form = new FormData();
        form.append('files[]', buffer, { 
            filename: `media.${type.ext}`,
            contentType: type.mime
        });

        const { data } = await axios.post('https://qu.ax/upload.php', form, {
            headers: form.getHeaders(),
            timeout: 15000,
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        if (data && data.success && data.files && data.files[0]) {
            return data.files[0].url;
        }
    } catch (e) {
        console.error(`[Uploader] Stage 3 (Quax) failed: ${e.message}`);
    }

    throw new Error("Critical: All uploader services (Telegraph, Catbox, Quax) are unreachable or rejecting the request.");
};

export const uploadToTelegraph = uploadFile;
