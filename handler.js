import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import { extractMessageText } from './utils/helper.js';

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
