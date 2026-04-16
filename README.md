# Simple Modular WhatsApp Bot 🤖

A lightweight, efficient, and highly maintainable WhatsApp bot built using [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys). This bot utilizes a robust **Command Handler Architecture**, allowing you to easily add new commands without creating spaghetti code. Session storage uses local flat-files, completely eliminating the need for complex external databases.

## 🚀 Features & Built-in Modules
- **🤖 Groq AI Assistant (`!ai`)**: Integrated Chatbot using LLaMA3 (via `groq-sdk`).
- **✂️ Auto Sticker Maker (`!sticker`)**: Convert images/videos into WebP stickers using dynamically pulled FFMPEG.
- **📥 TikTok Downloader (`!tiktok`)**: Download videos without watermark.
- **👮 Group Admin Toolkit**: Includes `!kick`, `!promote`, `!demote`, and `!hidetag`.
- **ES6 Module syntax** for modern Node.js standard practices.
- **Zero Database Setup**: Uses Baileys `useMultiFileAuthState` for local session caching.
- **Dynamic Command Loading**: Add a `.js` file into the `commands` folder, and it automatically registers.

## 📋 Prerequisites
- Node.js (v16+)
- NPM (Node Package Manager)
- Git

## 💻 Local Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/itswill00/Whatsapp_bot.git
   cd Whatsapp_bot
   ```
2. Install dependencies (This might take a minute as it downloads FFMPEG binaries automatically):
   ```bash
   npm install
   ```
3. **Configure APIs**: Open `config.js` and insert your Groq API Key (`groqApiKey: '...'`). You can get one for free at [console.groq.com](https://console.groq.com).
4. Start the bot:
   ```bash
   npm start
   ```
5. **Scan the QR Code**: The terminal will display a QR code. Open WhatsApp > Linked Devices > Link a Device, and scan the QR code to authenticate. Your session will automatically be saved in the `auth_info_baileys` folder so you don't need to re-scan on restart.

---

## ☁️ Deploying to a Linux VPS (Ubuntu/Debian)

To keep your bot running 24/7 without keeping your computer on, deploy it to a Virtual Private Server (VPS) and run it using `pm2` (a production process manager for Node.js).

### Step 1: Install Node.js & Git
Login to your VPS using SSH, then run the following to install the requirements:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl git -y

# Setup Node.js 18.x repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 2: Clone the Repo & Install Dependencies
```bash
git clone https://github.com/itswill00/Whatsapp_bot.git
cd Whatsapp_bot

# Install local project packages
npm install

# Install PM2 globally
sudo npm install -g pm2
```

### Step 3: Initial Authentication
Because you need to scan the QR code the very first time you link the device, you must start the bot normally in the foreground:
```bash
npm start
```
*Wait for the QR code to load, scan it quickly with your WhatsApp app, and wait until the terminal says "Connected successfully!". Once successfully logged in, stop the bot by pressing `CTRL + C`.*

### Step 4: Keep the Bot Running 24/7
Now that the `auth_info_baileys` folder is generated containing your login tokens, run the bot in the background using PM2:
```bash
pm2 start index.js --name "wa-bot"
```

To configure PM2 to automatically startup if the VPS reboots:
```bash
pm2 save
pm2 startup
```
*(Run the command that PM2 outputs on your screen after executing `pm2 startup`)*

### 🔍 Useful PM2 Commands:
- `pm2 logs wa-bot` — Monitor real-time bot outputs and QR codes
- `pm2 restart wa-bot` — Restart the bot after modifying code
- `pm2 stop wa-bot` — Stop the bot

---

## 🛠️ Adding Custom Commands
1. Navigate to the `commands/` directory.
2. Create a new file (e.g., `hello.js`).
3. Export the required structured object:
```javascript
export default {
    name: "hello",
    description: "Says hello to the user",
    execute: async (sock, msg, args) => {
        await sock.sendMessage(msg.key.remoteJid, { text: "Hello World!" }, { quoted: msg });
    }
};
```
4. Restart your bot. The command will instantly be valid whenever a user sends `!hello` (or whichever prefix you set in `config.js`).
