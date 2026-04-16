export default {
    name: "remindme",
    description: "Buat alarm/pengingat pribadi otomatis (contoh: !remindme 10m Matikan air)",
    execute: async (sock, msg, args) => {
        if (args.length < 2) return sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Format salah! Gunakan format:\n!remindme <waktu> <pesan>\n\nContoh: *!remindme 30m Makan siang*\n(s = detik, m = menit, h = jam)" }, { quoted: msg });
        
        const timeStr = args[0].toLowerCase();
        const reminderText = args.slice(1).join(' ');
        
        const regex = /^(\d+)([smh])$/;
        const match = timeStr.match(regex);
        
        if (!match) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Format waktu tidak valid! Angka harus segera diikuti oleh unit 's' (detik), 'm' (menit), atau 'h' (jam). Contoh yang benar: 15m" }, { quoted: msg });
        
        const amount = parseInt(match[1]);
        const unit = match[2];
        let ms = amount * 1000;
        
        if (unit === 'm') ms *= 60;
        if (unit === 'h') ms *= 3600;

        if (ms > 86400000) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Memori bot tidak dapat menampung timer lebih dari 24 Jam." }, { quoted: msg });

        const sender = msg.key.participant || msg.key.remoteJid;
        
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `✅ *REMINDER DISIMPAN!*\n\nSaya akan secara paksa nge-tag dan mengingatkan kamu dalam waktu *${amount}${unit}* ke depan!` 
        }, { quoted: msg });

        // Spin up the background timer event
        setTimeout(async () => {
            const announce = `⏰ *TENG TENG TENG!* ⏰\n\nHalo @${sender.split('@')[0]}!\nWaktu *${amount}${unit}*-mu sudah habis. Kamu menyuruh saya mengingatkan hal ini:\n\n👉 *${reminderText}*`;
            await sock.sendMessage(msg.key.remoteJid, { text: announce, mentions: [sender] });
        }, ms);
    }
};
