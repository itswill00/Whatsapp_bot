import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AFK_FILE = path.join(__dirname, '../data/afk.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, '../data'))) {
    fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
}

/**
 * Robust AFK Persistent Storage
 * Saves to JSON so status remains even after VPS/Bot restarts.
 */
class AfkManager {
    constructor() {
        this.users = new Map();
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(AFK_FILE)) {
                const data = JSON.parse(fs.readFileSync(AFK_FILE, 'utf-8'));
                this.users = new Map(Object.entries(data));
            }
        } catch (e) {
            console.error("[AfkManager] Failed to load afk.json:", e);
        }
    }

    save() {
        try {
            const data = Object.fromEntries(this.users);
            fs.writeFileSync(AFK_FILE, JSON.stringify(data, null, 2));
        } catch (e) {
            console.error("[AfkManager] Failed to save afk.json:", e);
        }
    }

    set(jid, data) {
        this.users.set(jid, data);
        this.save();
    }

    get(jid) {
        return this.users.get(jid);
    }

    has(jid) {
        return this.users.has(jid);
    }

    delete(jid) {
        const deleted = this.users.delete(jid);
        if (deleted) this.save();
        return deleted;
    }
}

export const afkUsers = new AfkManager();
