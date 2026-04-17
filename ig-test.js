import igdl from 'instagram-url-direct';

async function test() {
    try {
        const res = await igdl.default ? await igdl.default('https://www.instagram.com/reel/DUpeRuxEfxb/') : await igdl('https://www.instagram.com/reel/DUpeRuxEfxb/');
        console.log(JSON.stringify(res, null, 2));
    } catch (e) {
        try {
            // commonjs module support
            const igdlObj = (await import('instagram-url-direct')).default;
            const res = await (igdlObj.default ? igdlObj.default('https://www.instagram.com/reel/DUpeRuxEfxb/') : igdlObj('https://www.instagram.com/reel/DUpeRuxEfxb/'));
            console.log(JSON.stringify(res, null, 2));
        } catch(e2) {
            console.error("Error:", e2.message);
        }
    }
}

test();
