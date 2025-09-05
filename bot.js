require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');

const client = new Client();

// Constants
const OWO_ID = '408785106942164992';
const REACTION_ID = '519287796549156864';

// Secrets
const { DISCORD_TOKEN, CHANNEL_ID, SOCIAL_USER_ID } = process.env;

const TRIGGER_MESSAGE = [
    'captcha', 'verify', 'real', 'human?', 'ban', 'banned', 'suspend', 'complete verification'
];

const normalizeText = text => text.replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase();

client.once('ready', async () => {
    console.log(`[${new Date().toISOString()}] Bot ready: *****`); // ${client.user.tag} //

    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        await channel.send(`Owo curse ${SOCIAL_USER_ID}`);
        console.log(`[${new Date().toISOString()}] Startup message sent. Listening for triggers...`);
    } catch (e) {
        console.error('Channel/Message error:', e);
    }

    client.on('messageCreate', async msg => {
        if (msg.author.id !== OWO_ID) return;
        if (!msg.content.includes(`<@${client.user.id}>`)) return;
        const hasTrigger = TRIGGER_MESSAGE.some(trigger =>
            normalizeText(msg.content).includes(trigger.toLowerCase())
        );
        if (!hasTrigger) return;

        try {
            const user = await client.users.fetch(REACTION_ID);
            const dm = await user.createDM();
            const m = await dm.send('!r cat');
            await dm.send('## ** Captcha **\n> -# [**Çözmek için tıkla**](https://owobot.com/captcha)');
            await m.delete();
            console.log(`[${new Date().toISOString()}] Captcha DM sent and deleted`);
        } catch (e) {
            console.error('DM error:', e.message);
        }
    });
});

client.login(DISCORD_TOKEN);
