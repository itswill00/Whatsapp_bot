import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import { extractMessageText, decodeJid } from './utils/helper.js';
import { messageHistory } from './utils/messageHistory.js';
import { afkUsers } from './utils/afkData.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store commands in a Map
const commands = new Map();

/**
 * Loads all command files from the /commands directory
 */
export async function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    
    // Check if commands directory exists, just in case
    if (!fs.existsSync(commandsPath)) {
        console.warn('[Handler] Commands directory not found, creating one...');
        fs.mkdirSync(commandsPath, { recursive: true });
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = `file://${path.join(commandsPath, file).replace(/\\/g, '/')}`;
        const module = await import(filePath);
        const command = module.default;
        
        if (command && command.name) {
            commands.set(command.name, command);
        }
    }
    console.log(`[Handler] Loaded ${commands.size} commands.`);
}

/**
 * Helper to normalize JIDs by removing Multi-Device suffixes (e.g., :1 or .0:1)
 */
function decodeJid(jid) {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
        const decode = jid.split(':');
        return `${decode[0]}@${decode[1].split('@')[1]}`;
    }
    return jid;
}

/**
 * Main message handler to be attached to connection updates
 */
export async function messageHandler(sock, msg) {
    const remoteJid = msg.key.remoteJid;
    const isGroup = remoteJid.endsWith('@g.us');
    const botId = decodeJid(sock.user?.id);
    const configOwner = decodeJid(config.ownerNumber);

    // --- AFK LOGIC LISTENER ---
    const rawSender = msg.key.participant || remoteJid;
    const sender = decodeJid(rawSender);

    if (afkUsers.has(sender)) {
        const data = afkUsers.get(sender);
        const duration = Math.round((Date.now() - data.time) / 1000); 
        afkUsers.delete(sender);
        await sock.sendMessage(remoteJid, { text: `Selamat datang kembali. Mode AFK dimatikan (Aktif selama ${duration} detik).`, mentions: [sender] });
    }

    if (sender === configOwner && afkUsers.has(botId)) {
        const data = afkUsers.get(botId);
        const duration = Math.round((Date.now() - data.time) / 1000);
        afkUsers.delete(botId);
        await sock.sendMessage(remoteJid, { text: `Mode AFK Global dimatikan. Bot sudah tidak dalam kondisi istirahat (Lama AFK: ${duration} detik).` });
    }

    if (msg.key.fromMe) return;

    const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedJid = msg.message?.extendedTextMessage?.contextInfo?.participant;
    
    // Build targets and normalize them all
    const targets = mentionedJids.map(jid => decodeJid(jid));
    if (quotedJid) targets.push(decodeJid(quotedJid));

    // In private chat, the bot itself is the implied target
    if (!isGroup) {
        if (!targets.includes(botId)) targets.push(botId);
        // Also check if the other person in the PM is AFK (in case the owner is chatting with them)
        const pmPartner = decodeJid(remoteJid);
        if (!targets.includes(pmPartner)) targets.push(pmPartner);
    }

    for (const target of targets) {
        if (afkUsers.has(target)) {
            const data = afkUsers.get(target);
            await sock.sendMessage(remoteJid, { text: `Maaf, orang yang kamu hubungi sedang AFK.\nAlasan: ${data.reason}`, mentions: [target] }, { quoted: msg });
        }
    }
    // --- END AFK LOGIC ---

    // --- ANTI VIEW-ONCE LOGIC ---
    let messageType = Object.keys(msg.message || {})[0];
    if (messageType === 'viewOnceMessage' || messageType === 'viewOnceMessageV2' || messageType === 'viewOnceMessageV2Extension') {
        try {
            const innerMsg = msg.message[messageType].message;
            const mediaType = Object.keys(innerMsg)[0]; // imageMessage or videoMessage
            
            // Mock the message envelope so Baileys can download it
            const mockMsg = {
                key: msg.key,
                message: innerMsg
            };
            
            const buffer = await downloadMediaMessage(mockMsg, 'buffer', {}, { logger: console });
            const caption = "Keamanan: Media View-Once berhasil dicegat dan didekode.";
            
            if (mediaType === 'imageMessage') {
                await sock.sendMessage(msg.key.remoteJid, { image: buffer, caption: caption }, { quoted: msg });
            } else if (mediaType === 'videoMessage') {
                await sock.sendMessage(msg.key.remoteJid, { video: buffer, caption: caption }, { quoted: msg });
            }
        } catch (e) {
            console.error("[Anti-ViewOnce] Failed to extract VO media:", e);
        }
    }
    // --- END ANTI VIEW-ONCE ---

    const messageText = extractMessageText(msg);
    if (!messageText) return;

    // --- LOG MESSAGE FOR SUMMARIZER ---
    // Only log if it's a group and NOT a command
    if (isGroup && !messageText.startsWith(config.prefix)) {
        const senderName = msg.pushName || sender.split('@')[0];
        messageHistory.push(remoteJid, senderName, messageText);
    }
    // ----------------------------------

    if (!messageText.startsWith(config.prefix)) return;

    // Parse the command and arguments
    const args = messageText.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Check if the command exists
    const command = commands.get(commandName);
    if (!command) return;

    try {
        // We pass the full commands Map to be used by 'help.js'
        await command.execute(sock, msg, args, commands);
    } catch (error) {
        console.error(`[Error] Executing command ${commandName}:`, error);
        await sock.sendMessage(msg.key.remoteJid, { text: "There was an error executing that command." }, { quoted: msg });
    }
}
