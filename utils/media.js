import { downloadMediaMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Downloads a media buffer from either the direct message or a quoted message
 */
export async function getMediaBuffer(msg) {
    let m = msg;
    const type = Object.keys(msg.message || {})[0];
    
    if (type === 'extendedTextMessage' && msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
        m = { message: msg.message.extendedTextMessage.contextInfo.quotedMessage };
    }

    // Ensure it contains a viewable media type
    const mediaObj = m.message?.imageMessage || m.message?.videoMessage || m.message?.documentMessage;
    if (!mediaObj) return null;

    try {
        const buffer = await downloadMediaMessage(
            m,
            'buffer',
            { },
            { 
                logger: console 
            }
        );
        return buffer;
    } catch (err) {
        console.error("[Media Downloader Error]:", err);
        return null;
    }
}

/**
 * Saves buffer to a temporary file
 */
export function saveTempFile(buffer, extension) {
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const filename = `temp_${Date.now()}.${extension}`;
    const filepath = path.join(tempDir, filename);
    fs.writeFileSync(filepath, buffer);
    return filepath;
}
