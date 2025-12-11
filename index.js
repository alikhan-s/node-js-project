const bot = require('./src/bot');
const prisma = require('./src/config/db');

async function start() {
  try {
    // Проверка подключения к БД
    await prisma.$connect();
    console.log('✅ Connected to Database');

    // Запуск бота
    bot.launch(() => {
      console.log('🚀 Java Mentor Bot is running...');
    });

    // Graceful Stop (корректная остановка)
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (e) {
    console.error('Failed to start:', e);
    process.exit(1);
  }
}

start();