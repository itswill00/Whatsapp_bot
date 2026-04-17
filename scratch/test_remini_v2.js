import axios from 'axios';

const image = "https://telegra.ph/file/0a0a0a0a0a0a0a0a.jpg";
const engines = [
    { name: "Krizzy", url: `https://api.krizzy.my.id/api/remini?url=${image}` },
    { name: "Agatz",  url: `https://api.agatz.xyz/api/remini?url=${image}` },
    { name: "Betabotz", url: `https://api.betabotz.eu.org/api/tools/remini?url=${image}&apikey=beta-free` },
    { name: "Skizo",  url: `https://skizo.tech/api/remini?url=${image}&apikey=beta` }
];

async function test() {
    for (const engine of engines) {
        try {
            console.log(`Testing ${engine.name}...`);
            const res = await axios.get(engine.url, { timeout: 15000 });
            console.log(`[${engine.name}] Status: ${res.status}`);
            console.log(`[${engine.name}] Content-Type: ${res.headers['content-type']}`);
        } catch (e) {
            console.log(`[${engine.name}] Failed: ${e.message}`);
        }
        console.log("-------------------");
    }
}

test();
