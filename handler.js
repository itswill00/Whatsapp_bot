import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import { extractMessageText } from './utils/helper.js';
import { afkUsers } from './utils/afkData.js';

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
 * Main message handler to be attached to connection updates
 */
export async function messageHandler(sock, msg) {
    // Prevent processing messages from the bot itself
    if (msg.key.fromMe) return;

    // --- AFK LOGIC LISTENER ---
    const sender = msg.key.participant || msg.key.remoteJid;
    
    // 1. If sender was AFK and sends a message, remove their AFK status
    if (afkUsers.has(sender)) {
        const data = afkUsers.get(sender);
        const duration = Math.round((Date.now() - data.time) / 1000); // in seconds
        afkUsers.delete(sender);
        await sock.sendMessage(msg.key.remoteJid, { text: `👋 Selamat datang kembali! Mode AFK dimatikan.\n(AFK selama ${duration} detik).` }, { quoted: msg });
    }

    // 1b. If the Owner sends a message to the bot, remove the BOT's AFK status as well
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    if (sender === config.ownerNumber && afkUsers.has(botId)) {
        const data = afkUsers.get(botId);
        const duration = Math.round((Date.now() - data.time) / 1000);
        afkUsers.delete(botId);
        await sock.sendMessage(msg.key.remoteJid, { text: `👋 Welcome back Bos! AFK Global Bot telah dimatikan.\n(Lama AFK: ${duration} detik).` }, { quoted: msg });
    }

    // 2. Check if sender mentioned or replied to an AFK user
    const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedJid = msg.message?.extendedTextMessage?.contextInfo?.participant;
    const targets = [...mentionedJids];
    if (quotedJid) targets.push(quotedJid);

    // If it's a private chat, the message is implicitly directed at the bot/owner
    const isGroup = msg.key.remoteJid.endsWith('@g.us');
    if (!isGroup) {
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (!targets.includes(botId)) targets.push(botId);
    }

    for (const target of targets) {
        if (afkUsers.has(target)) {
            const data = afkUsers.get(target);
            await sock.sendMessage(msg.key.remoteJid, { text: `💤 Ssst, orang yang kamu hubungi sedang AFK!\n\n*Alasan:* ${data.reason}` }, { quoted: msg });
        }
    }
    // --- END AFK LOGIC ---

    const messageText = extractMessageText(msg);
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
