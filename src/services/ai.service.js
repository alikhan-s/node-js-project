const { GoogleGenerativeAI } = require("@google/generative-ai");
const userService = require("./user.service");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Системный промпт, задающий роль бота
const SYSTEM_INSTRUCTION = `
Ты — опытный Senior Java Developer и ментор. Твоя задача — помогать изучать Java.
Твой стек: Java 17/21, Spring Boot 3, Hibernate, PostgreSQL, Docker, Microservices.
Правила:
1. Отвечай кратко и по делу, если не просят подробную лекцию.
2. Всегда приводи примеры кода на Java, следуя Best Practices (Clean Code).
3. Если пользователь присылает код, проанализируй его на ошибки и сложность (Big O).
4. Будь вежлив, но требователен к качеству кода, как на Code Review.
`;

class AiService {
  constructor() {
    this.model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // Быстрая и дешевая модель, идеально для чата
      systemInstruction: SYSTEM_INSTRUCTION
    });
  }

  async getResponse(telegramId, userMessage) {
    try {
      // 1. Получаем историю переписки из БД
      const history = await userService.getChatHistory(telegramId);

      // 2. Запускаем чат с историей
      const chat = this.model.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      // 3. Отправляем сообщение
      const result = await chat.sendMessage(userMessage);
      const response = result.response.text();

      // 4. Сохраняем это (асинхронно, не блокируем ответ)
      await userService.saveMessage(telegramId, userMessage, 'USER');
      await userService.saveMessage(telegramId, response, 'MODEL');

      return response;
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Извини, у меня возникла ошибка при генерации ответа. Попробуй позже.";
    }
  }
}

module.exports = new AiService();