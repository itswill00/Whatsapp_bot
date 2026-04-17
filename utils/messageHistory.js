/**
 * MessageHistory Class
 * Stores the last N messages for each group/chat in memory.
 */
class MessageHistory {
    constructor(limit = 100) {
        this.history = new Map(); 
        this.limit = limit;
    }

    push(jid, senderName, text) {
        if (!jid || !text) return;
        
        if (!this.history.has(jid)) {
            this.history.set(jid, []);
        }

        const groupHistory = this.history.get(jid);
        groupHistory.push({
            name: senderName || 'Unknown',
            text: text.trim(),
            timestamp: Date.now()
        });

        if (groupHistory.length > this.limit) {
            groupHistory.shift();
        }
    }

    get(jid) {
        return this.history.get(jid) || [];
    }

    clear(jid) {
        this.history.delete(jid);
    }
}

export const messageHistory = new MessageHistory(100);
