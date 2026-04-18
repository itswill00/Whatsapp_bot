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
 * Main message handler to be attached to connection updates
 */
export async function messageHandler(sock, msg) {
    const botId = decodeJid(sock.user?.id);
    const remoteJid = msg.key.remoteJid;
    const isGroup = remoteJid.endsWith('@g.us');
    const fromMe = msg.key.fromMe;

    // Correct sender identification
    const rawSender = isGroup ? (msg.key.participant || remoteJid) : (fromMe ? botId : remoteJid);
    const sender = decodeJid(rawSender);

    const messageText = extractMessageText(msg);
    const isCommand = messageText && messageText.startsWith(config.prefix);
    
    // Debugging logs for PMs
    if (!isGroup) {
        console.log(`[PM Handler] From: ${sender} | text: "${messageText || 'none'}" | fromMe: ${fromMe} | isCommand: ${isCommand}`);
    }

    if (fromMe && !isCommand) return;
    if (!messageText && !fromMe) {
        if (!isGroup) console.log(`[PM Handler] Ignored: Empty message from ${sender}`);
        return;
    }

    // AFK Detect Back
    if (!fromMe && afkUsers.has(sender)) {
        const data = afkUsers.get(sender);
        const mins = Math.round((Date.now() - data.time) / 60000);
        afkUsers.delete(sender);
        await sock.sendMessage(remoteJid, {
            text: `Selamat datang kembali — AFK ${mins > 0 ? mins + ' menit' : 'baru saja'}.`,
            mentions: [sender]
        });
    }

    const isOwner = Array.isArray(config.ownerNumber)
        ? config.ownerNumber.map(n => decodeJid(n)).includes(sender)
        : decodeJid(config.ownerNumber) === sender;

    if (isOwner && fromMe && afkUsers.has(botId)) {
        afkUsers.delete(botId);
        await sock.sendMessage(remoteJid, { text: "Bot kembali online." });
    }

    const mentionedJids = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []).map(jid => decodeJid(jid));
    const quotedJid = decodeJid(msg.message?.extendedTextMessage?.contextInfo?.participant);
    
    const targets = [...mentionedJids];
    if (quotedJid) targets.push(quotedJid);

    if (!isGroup) {
        if (!targets.includes(botId)) targets.push(botId);
        const pmPartner = decodeJid(remoteJid);
        if (!targets.includes(pmPartner)) targets.push(pmPartner);
    }

    for (const target of targets) {
        if (target && afkUsers.has(target) && target !== sender) {
            const data = afkUsers.get(target);
            await sock.sendMessage(remoteJid, {
                text: `@${target.split('@')[0]} sedang AFK — _${data.reason}_`,
                mentions: [target]
            }, { quoted: msg });
        }
    }

    // Anti View-Once
    let messageType = Object.keys(msg.message || {})[0];
    if (messageType === 'viewOnceMessage' || messageType === 'viewOnceMessageV2' || messageType === 'viewOnceMessageV2Extension') {
        try {
            const innerMsg = msg.message[messageType].message;
            const mediaType = Object.keys(innerMsg)[0];
            const mockMsg = { key: msg.key, message: innerMsg };
            
            const buffer = await downloadMediaMessage(mockMsg, 'buffer', {}, { logger: console });
            const caption = "Keamanan: Media View-Once telah didekode.";
            
            if (mediaType === 'imageMessage') {
                await sock.sendMessage(msg.key.remoteJid, { image: buffer, caption: caption }, { quoted: msg });
            } else if (mediaType === 'videoMessage') {
                await sock.sendMessage(msg.key.remoteJid, { video: buffer, caption: caption }, { quoted: msg });
            }
        } catch (e) {
            console.error("[System] VO extraction failed:", e.message);
        }
    }

    // History Logger
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
