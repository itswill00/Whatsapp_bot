import axios from 'axios';

const image = "https://telegra.ph/file/0a0a0a0a0a0a0a0a.jpg"; // dummy but valid format
const engines = [
    { name: "Siputzx", url: `https://api.siputzx.my.id/api/ai/remini?url=${image}` },
    { name: "Widipe",  url: `https://widipe.com/remini?url=${image}` },
    { name: "Alya",    url: `https://api.alyaserver.my.id/api/remini?url=${image}` },
    { name: "Vreden",  url: `https://api.vreden.my.id/api/remini?url=${image}` }
];

async function test() {
    for (const engine of engines) {
        try {
            console.log(`Testing ${engine.name}...`);
            const res = await axios.get(engine.url, { timeout: 10000 });
            console.log(`[${engine.name}] Status: ${res.status}`);
            console.log(`[${engine.name}] Content-Type: ${res.headers['content-type']}`);
            console.log(`[${engine.name}] Data Preview:`, typeof res.data === 'string' ? res.data.slice(0, 100) : 'Buffer/Object');
        } catch (e) {
            console.log(`[${engine.name}] Failed: ${e.message}`);
        }
        console.log("-------------------");
    }
}

test();
