import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestWaWebVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { messageHandler, loadCommands } from './handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REBOOT_FILE = path.join(__dirname, 'data/reboot.json');

// Setup basic Pino logger globally suppressing info logs for cleaner terminal
const logger = pino({ level: 'silent' });

export async function startConnection() {
    // Ensure commands are loaded before processing messages
    await loadCommands();

    // Initialize auth state saving mechanisms
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

    // Fetch latest WA Web version to avoid 405 Error
    const { version } = await fetchLatestWaWebVersion();
    console.log(`[Connection] Using WA v${version.join('.')}`);

    // Create Socket connection
    const sock = makeWASocket({
        version,
        auth: state,
        logger,
        printQRInTerminal: false, // We will handle QR via events
        browser: ['Ubuntu', 'Chrome', '20.0.04']
    });

    // Handle connection updates
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('[QR] Scan the QR Code below to authenticate:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log(`[Connection] Connection closed (Reason: ${statusCode}). Reconnecting:`, shouldReconnect);
            
            if (shouldReconnect) {
                setTimeout(() => startConnection(), 3000); // 3 second delay to avoid looping
            } else {
                console.log('[Connection] Logged out. Delete auth_info_baileys and restart to login again.');
            }
        } else if (connection === 'open') {
            console.log('[Connection] Connected successfully!');
            
            // Check for persistent reboot notification
            if (fs.existsSync(REBOOT_FILE)) {
                try {
                    const data = JSON.parse(fs.readFileSync(REBOOT_FILE, 'utf-8'));
                    if (data.jid) {
                        const type = data.type || 'restart';
                        const message = type === 'update' 
                            ? "Update berhasil, bot sudah aktif kembali dan siap digunakan." 
                            : "Restart berhasil, bot sudah online kembali.";
                        
                        setTimeout(async () => {
                            await sock.sendMessage(data.jid, { text: message });
                            fs.unlinkSync(REBOOT_FILE);
                        }, 2000); // Small delay to ensure session is fully ready
                    }
                } catch (e) {
                    console.error("[Reboot Detect] Error:", e);
                }
            }
        }
    });

    // Save auth state constantly
    sock.ev.on('creds.update', saveCreds);

    // Listen to incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
            // Processing incoming valid messages
            for (const msg of messages) {
                await messageHandler(sock, msg);
            }
        }
    });

    return sock;
}
