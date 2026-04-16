// Simple in-memory storage for AFK statuses
// Since it's in-memory, it will reset if PM2 restarts the bot.

export const afkUsers = new Map();
