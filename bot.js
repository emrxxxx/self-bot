const { Client } = require('discord.js-selfbot-v13');

const client = new Client({
  checkUpdate: false,
});

// ---------- SABİTLER ----------
const OWO_ID      = '408785106942164992';
const REACTION_ID = '519287796549156864';

// ---------- ORTAM ----------
const { DISCORD_TOKEN, CHANNEL_ID, SOCIAL_USER_ID } = process.env;

// ---------- BAYRAKLAR ----------
let captchaDetected = false;   // captcha gelirse true
let botPaused       = true;   // !duraklat / !devam ile kontrol
let curseInterval   = null;    // setInterval referansı
let lastCurseTime   = 0;      // son curse zamanı (ms)
let nextIntervalMS  = 0;      // bir sonraki aralık (ms)

// ---------- TETİKLEYİCİ ----------
const TRIGGER_MESSAGE = [
    'captcha', 'verify', 'real', 'human?', 'ban', 'banned', 'suspend', 'complete verification'
];

// ---------- YARDIMCI ----------
const normalizeText = t => t.replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase();

// ---------- RASTGELE 5-6 DAKİKADA OWL CURSE ----------
function startCurseLoop() {
    if (curseInterval) clearInterval(curseInterval);
    
    const setNextInterval = () => {
        nextIntervalMS = (300 + Math.floor(Math.random() * 61)) * 1000;
        return nextIntervalMS;
    };

    if (!botPaused && !captchaDetected) {
        curseInterval = setInterval(async () => {
            if (botPaused || captchaDetected) return;
            try {
                const ch = await client.channels.fetch(CHANNEL_ID);
                await ch.send(`Owo curse ${SOCIAL_USER_ID}`);
                lastCurseTime = Date.now();
                console.log(`[${new Date().toISOString()}] Owo curse gönderildi.`);
            } catch (e) {
                console.error('Curse mesaj hatası:', e);
            }
        }, setNextInterval());
    }
}

// ---------- BOT HAZIR ----------
client.once('ready', async () => {
    console.log(`[${new Date().toISOString()}] Bot hazır: *****`);

    try {
        const ch = await client.channels.fetch(CHANNEL_ID);
        if (!botPaused && !captchaDetected) {
            await ch.send(`Owo curse ${SOCIAL_USER_ID}`);
            lastCurseTime = Date.now();
            console.log(`[${new Date().toISOString()}] İlk curse gönderildi.`);
        }
    } catch (e) {
        console.error('İlk mesaj hatası:', e);
    }

    // Curse loop is not started here; it will start only with !devam
});

// ---------- OWODAN GELEN CAPTCHA TARAMASI ----------
client.on('messageCreate', async msg => {
    if (msg.author.id !== OWO_ID) return;
    if (!msg.content.includes(`<@${client.user.id}>`)) return;

    const hasTrigger = TRIGGER_MESSAGE.some(t =>
        normalizeText(msg.content).includes(t.toLowerCase())
    );
    if (!hasTrigger) return;

    captchaDetected = true;
    console.log(`[${new Date().toISOString()}] Captcha algılandı, mesajlar durduruldu.`);

    if (botPaused) return;

    try {
        const user = await client.users.fetch(REACTION_ID);
        const dm = await user.createDM();
        const m = await dm.send('!r cat');
        await dm.send('## ** Captcha **\n> -# [**Çözmek için tıkla**](https://owobot.com/captcha )');
        await m.delete();
        console.log(`[${new Date().toISOString()}] Captcha DM gönderildi.`);
    } catch (err) {
        console.error('Captcha DM hatası:', err.message);
    }
});

// ---------- DURAKLATMA / DEVAM (DM ÜZERİNDEN) ----------
client.on('messageCreate', async msg => {
    if (msg.channel.type !== 'DM') return;

    const komut = msg.content.trim().toLowerCase();
    if (komut === '!duraklat') {
        if (botPaused) {
            await msg.channel.send('Bot zaten duraklatılmış.');
            return;
        }
        botPaused = true;
        await msg.react('⏸️');
        console.log(`[${new Date().toISOString()}] Bot duraklatıldı.`);
    } else if (komut === '!devam') {
        if (!botPaused && !captchaDetected) {
            await msg.channel.send('Bot zaten çalışıyor.');
            return;
        }
        botPaused = false;
        captchaDetected = false;
        await msg.react('▶️');
        console.log(`[${new Date().toISOString()}] Bot devam ediyor.`);

        // Check if timer is reset or interval has elapsed
        const timeSinceLast = Date.now() - lastCurseTime;
        if (lastCurseTime === 0 || timeSinceLast >= nextIntervalMS) {
            try {
                const ch = await client.channels.fetch(CHANNEL_ID);
                await ch.send(`Owo curse ${SOCIAL_USER_ID}`);
                lastCurseTime = Date.now();
                console.log(`[${new Date().toISOString()}] Devam ile curse gönderildi.`);
            } catch (e) {
                console.error('Devam curse hatası:', e);
            }
        }

        startCurseLoop();
    }
});

// ---------- GİRİŞ ----------
client.login(DISCORD_TOKEN);
