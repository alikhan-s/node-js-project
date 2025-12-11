const { Telegraf } = require('telegraf');
const userService = require('./services/user.service');
const aiService = require('./services/ai.service');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Middleware для обработки ошибок
bot.catch((err, ctx) => {
  console.error(`Ooops, encountered an error for ${ctx.updateType}`, err);
  ctx.reply("Произошла критическая ошибка. Я уже сообщил разработчику.");
});

// Команда /start
bot.start(async (ctx) => {
  const { id, first_name, username } = ctx.from;

  await userService.getOrCreateUser(id, { first_name, username });

  ctx.reply(
    `Привет, ${first_name}! 👋\n` +
    `Я твой AI-ментор по Java.\n\n` +
    `Я могу:\n` +
    `🔹 Объяснить любую тему (Collections, Stream API, Concurrency)\n` +
    `🔹 Провести Code Review (просто скинь код)\n` +
    `🔹 Подготовить к собеседованию\n\n` +
    `Задай мне свой первый вопрос!`
  );
});

// Обработка текстовых сообщений
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const userMessage = ctx.message.text;

  // Показываем пользователю, что бот "печатает"
  ctx.sendChatAction('typing');

  // Получаем ответ от AI
  const response = await aiService.getResponse(userId, userMessage);

  // Markdown парсинг иногда ломается, если AI выдает странные символы,
  // поэтому пока отправляем как текст, либо можно добавить экранирование.
  // Для кода используем try-catch блок отправки
  try {
    await ctx.reply(response, { parse_mode: 'Markdown' });
  } catch (e) {
    // Если Markdown сломался (бывает с символами _ или *), шлем просто текст
    await ctx.reply(response);
  }
});

module.exports = bot;