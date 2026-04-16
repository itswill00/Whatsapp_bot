import { startConnection } from './connection.js';

console.log('Starting WhatsApp Bot...');

// Initiate the connection 
startConnection().catch((err) => {
    console.error('Failed to start WhatsApp bot:', err);
});
