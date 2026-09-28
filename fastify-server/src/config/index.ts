export const config = {
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/chatbot',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  jwtSecret: process.env.JWT_SECRET || 'default-fastify-super-secret-jwt-key',
  openaiApiKey: process.env.OPENAI_API_KEY || 'mock-key',
};
