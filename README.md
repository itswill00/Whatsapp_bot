# Wil-AI: Modular WhatsApp Assistant

A project focused on high-performance, modular WhatsApp automation built on top of `@whiskeysockets/baileys`. Designed for technical users who prioritize stability, efficiency, and a "Zero Gimmick" aesthetic.

## Core Architecture
- **Command Dispatcher**: Dynamic loading system for seamless extensibility.
- **Stateless Operation**: Uses `useMultiFileAuthState` for local session persistence. No external database required.
- **Provider Fallback**: High-reliability media downloader with multi-stage API fallback logic.
- **AI Integration**: Native support for Groq Llama-3 (Text & Vision).

## Prerequisites
- Node.js (v18.x or later)
- Git
- FFMPEG (Installed automatically via project dependencies)

## Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/itswill00/Whatsapp_bot.git
   cd Whatsapp_bot
   npm install
   ```

2. **Configuration**
   Copy `config.example.js` to `config.js` and populate your API keys:
   ```javascript
   export default {
       prefix: "!",
       ownerNumber: "628xxx@s.whatsapp.net",
       groqApiKey: "gsk_...",
       apifyToken: "apify_api_..."
   };
   ```

3. **Deployment**
   Start the process to authenticate (first time only):
   ```bash
   npm start
   ```
   For 24/7 operation on a VPS, use PM2:
   ```bash
   pm2 start index.js --name "wa-bot"
   ```

## Development
To add a new feature, create a `.js` module in `commands/`. Each module must export a standard structure:
```javascript
export default {
    name: "cmd_name",
    description: "Technical description",
    execute: async (sock, msg, args, commands) => {
        // Implementation
    }
};
```

---
*Built for the Modern System Architect.*
