import axios from 'axios';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';

/**
 * Upload buffer to Telegra.ph
 * @param {Buffer} buffer 
 * @returns {Promise<string>} URL of uploaded image
 */
export const uploadToTelegraph = async (buffer) => {
    try {
        const { ext } = await fileTypeFromBuffer(buffer) || { ext: 'jpg' };
        const form = new FormData();
        form.append('file', buffer, { filename: `media.${ext}` });

        const { data } = await axios.post('https://telegra.ph/upload', form, {
            headers: form.getHeaders()
        });

        if (data && data[0] && data[0].src) {
            return `https://telegra.ph${data[0].src}`;
        }
        throw new Error("Upload failed: Invalid response from Telegra.ph");
    } catch (error) {
        console.error("[Uploader Error]:", error.message);
        throw error;
    }
};
