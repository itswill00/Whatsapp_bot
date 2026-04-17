import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getTempDir() {
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    return tempDir;
}

function parseDuration(seconds) {
    if (!seconds || isNaN(seconds)) return null;
    const s = parseInt(seconds);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
}

/**
 * Modular yt-dlp wrapper.
 * @param {string} url
 * @param {string} platform ('instagram', 'youtube', 'twitter')
 * @returns {Promise<{ filePath: string, ext: string, meta: object|null }>}
 */
export function downloadMedia(url, platform) {
    return new Promise((resolve, reject) => {
        const tempDir = getTempDir();
        const ts = Date.now();
        const outTemplate = path.join(tempDir, `dl_${platform}_${ts}.%(ext)s`);

        let formatFlag;
        if (platform === 'youtube') {
            formatFlag = `-f "bestvideo[height<=720]+bestaudio/best[height<=720]" --merge-output-format mp4 --max-filesize 50m`;
        } else {
            // Instagram / Twitter
            formatFlag = `-f "best[ext=mp4]/best"`;
        }

        // Deep Bypass for VPS IP blocks (Useful for IG)
        const userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
        const cookiesPath = path.join(__dirname, '../data/cookies.txt');
        const cookieFlag = fs.existsSync(cookiesPath) ? `--cookies "${cookiesPath}"` : '';

        const cmd = [
            'yt-dlp',
            formatFlag,
            '--no-playlist',
            '--no-check-certificates',
            '--force-ipv4',
            '--geo-bypass',
            `--user-agent "${userAgent}"`,
            cookieFlag,
            '--no-warnings',
            `--print "%(uploader|)s|||%(title|)s|||%(duration|)s"`,
            `"${url}"`,
            `-o "${outTemplate}"`
        ].filter(Boolean).join(' ');

        exec(cmd, { timeout: 120000 }, (err, stdout, stderr) => {
            if (err) {
                return reject(new Error(stderr?.slice(-400) || err.message));
            }

            // Temukan file yang berhasil diunduh (karena yt-dlp menentukan ekstensi asli)
            const files = fs.readdirSync(tempDir)
                .filter(f => f.startsWith(`dl_${platform}_${ts}`) && !f.endsWith('.part'))
                .map(f => path.join(tempDir, f));

            if (!files.length) {
                return reject(new Error('file_missing_after_download'));
            }

            files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
            const filePath = files[0];
            const ext = path.extname(filePath).slice(1);

            // Parsing teks output dari --print menjadi objek metadata
            let meta = null;
            try {
                const metaLine = (stdout || '').trim().split('\n')
                    .find(l => l.includes('|||'));
                if (metaLine) {
                    const [uploader, title, duration] = metaLine.split('|||').map(s => s.trim());
                    meta = {
                        uploader: uploader || null,
                        title:    title || null,
                        duration: parseDuration(duration)
                    };
                }
            } catch { /* metadata opsional */ }

            resolve({ filePath, ext, meta });
        });
    });
}
