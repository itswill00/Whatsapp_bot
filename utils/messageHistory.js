/**
 * MessageHistory Class
 * Stores the last N messages for each group/chat in memory.
 */
class MessageHistory {
    constructor(limit = 100) {
        this.history = new Map(); // Key: JID, Value: Array of message objects
        this.limit = limit;
    }

    /**
     * Pushes a new message to the history for a specific JID.
     * @param {string} jid 
     * @param {string} senderName 
     * @param {string} text 
     */
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

        // Ensure we don't exceed the limit (Rolling Buffer)
        if (groupHistory.length > this.limit) {
            groupHistory.shift();
        }
    }

    /**
     * Retrieves the history for a specific JID.
     * @param {string} jid 
     * @returns {Array} Array of message objects
     */
    get(jid) {
        return this.history.get(jid) || [];
    }

    /**
     * Clears the history for a specific JID.
     * @param {string} jid 
     */
    clear(jid) {
        this.history.delete(jid);
    }
}

export const messageHistory = new MessageHistory(100);
