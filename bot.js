const { Client } = require('discord.js-selfbot-v13');

const client = new Client({
  checkUpdate: false,
});

const formatDateTime = (date) => {
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Istanbul'
  };

  return date.toLocaleString('tr-TR', options);
};

const OWO_ID = '408785106942164992';
const REACTION_ID = '519287796549156864';

const { DISCORD_TOKEN, CHANNEL_ID, SOCIAL_USER_ID } = process.env;

const state = {
  captchaDetected: false,
  botPaused: true,
  curseTimeoutId: null,
  lastCurseTime: 0,
  nextCurseScheduledTime: 0
};

const TRIGGER_MESSAGE = [
  'captcha', 'verify', 'real', 'human?', 'ban', 'banned', 'suspend', 'complete verification'
];

const normalizeText = t => t.replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase();

function startCurseLoop(sendImmediately = false) {
  if (state.curseTimeoutId) {
    clearTimeout(state.curseTimeoutId);
    state.curseTimeoutId = null;
  }

  if (state.botPaused || state.captchaDetected) {
    return;
  }

  const getRandomInterval = () => (300 + Math.floor(Math.random() * 61)) * 1000;

  const sendCurse = async () => {
    try {
      const ch = await client.channels.fetch(CHANNEL_ID);
      await ch.send(`Owo curse ${SOCIAL_USER_ID}`);
      state.lastCurseTime = Date.now();
      console.log(`[${formatDateTime(new Date())}] Owo curse gönderildi.`);
      
      const interval = getRandomInterval();
      state.nextCurseScheduledTime = Date.now() + interval;
      state.curseTimeoutId = setTimeout(sendCurse, interval);
    } catch (e) {
      console.error('Curse mesaj hatası:', e);
      const interval = getRandomInterval();
      state.nextCurseScheduledTime = Date.now() + interval;
      state.curseTimeoutId = setTimeout(sendCurse, interval);
    }
  };

  if (sendImmediately) {
     sendCurse();
  } else {
      const now = Date.now();
      if (state.nextCurseScheduledTime <= now) {
          sendCurse();
      } else {
          const remainingTime = state.nextCurseScheduledTime - now;
          state.curseTimeoutId = setTimeout(sendCurse, remainingTime);
      }
  }
}

client.once('ready', async () => {
  console.log(`[${formatDateTime(new Date())}] Bot hazır.`);

  if (!state.botPaused && !state.captchaDetected) {
    startCurseLoop(true);
  }
});

client.on('messageCreate', async msg => {
  if (msg.author.id !== OWO_ID || !msg.content.includes(`<@${client.user.id}>`)) return;

  const normalizedContent = normalizeText(msg.content);
  const hasTrigger = TRIGGER_MESSAGE.some(trigger => normalizedContent.includes(trigger.toLowerCase()));

  if (hasTrigger) {
    state.captchaDetected = true;
    console.log(`[${formatDateTime(new Date())}] Captcha algılandı, mesajlar durduruldu.`);

    if (!state.botPaused) {
      try {
        const user = await client.users.fetch(REACTION_ID);
        const dm = await user.createDM();
        const m = await dm.send('!r cat');
        await dm.send('## ** Captcha **\n> -# [**Çözmek için tıkla**](https://owobot.com/captcha)');
        await m.delete();
        console.log(`[${formatDateTime(new Date())}] Captcha DM gönderildi.`);
      } catch (err) {
        console.error('Captcha DM hatası:', err.message);
      }
    }
  }
});

client.on('messageCreate', async msg => {
  if (msg.channel.type !== 'DM') return;

  const command = msg.content.trim().toLowerCase();

  if (command === '!duraklat') {
    if (state.botPaused) {
      await msg.channel.send('Bot zaten duraklatılmış.');
      return;
    }
    state.botPaused = true;
    if (state.curseTimeoutId) {
      clearTimeout(state.curseTimeoutId);
      state.curseTimeoutId = null;
    }
    await msg.react('⏸️');
    console.log(`[${formatDateTime(new Date())}] Bot duraklatıldı.`);
  } else if (command === '!devam') {
    if (!state.botPaused && !state.captchaDetected) {
      await msg.channel.send('Bot zaten çalışıyor.');
      return;
    }
    state.botPaused = false;
    state.captchaDetected = false;
    await msg.react('▶️');
    console.log(`[${formatDateTime(new Date())}] Bot devam ediyor.`);

    startCurseLoop();
  }
});

client.login(DISCORD_TOKEN);
