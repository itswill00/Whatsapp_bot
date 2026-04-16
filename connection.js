import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { messageHandler, loadCommands } from './handler.js';

// Setup basic Pino logger globally suppressing info logs for cleaner terminal
const logger = pino({ level: 'silent' });

export async function startConnection() {
    // Ensure commands are loaded before processing messages
    await loadCommands();

    // Initialize auth state saving mechanisms
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

    // Create Socket connection
    const sock = makeWASocket({
        auth: state,
        logger,
        printQRInTerminal: false // We will handle QR via events
    });

    // Handle connection updates
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('[QR] Scan the QR Code below to authenticate:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('[Connection] Connection closed. Reconnecting:', shouldReconnect);
            
            if (shouldReconnect) {
                startConnection();
            } else {
                console.log('[Connection] Logged out. Delete auth_info_baileys and restart to login again.');
            }
        } else if (connection === 'open') {
            console.log('[Connection] Connected successfully!');
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
