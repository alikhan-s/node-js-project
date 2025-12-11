const prisma = require('../config/db');

class UserService {
  // Найти или создать пользователя при старте
  async getOrCreateUser(telegramId, userInfo) {
    // BigInt требует особого обращения в JS, конвертируем в строку для логов если нужно
    let user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: BigInt(telegramId),
          username: userInfo.username,
          firstName: userInfo.first_name,
        }
      });
      console.log(`New user created: ${userInfo.username}`);
    }
    return user;
  }

  // Сохранить сообщение в историю
  async saveMessage(telegramId, content, role) {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) }
    });

    if (user) {
      await prisma.message.create({
        data: {
          userId: user.id,
          content: content,
          role: role // 'USER' или 'MODEL'
        }
      });
    }
  }

  // Получить историю диалога для контекста (последние 10 сообщений)
  async getChatHistory(telegramId) {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: {
        messages: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user || !user.messages) return [];

    // Prisma возвращает от новых к старым, нам нужно наоборот для Gemini
    return user.messages.reverse().map(msg => ({
      role: msg.role === 'USER' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));
  }
}

module.exports = new UserService();