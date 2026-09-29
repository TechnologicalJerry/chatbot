export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/chatbot',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  jwt: {
    secret: process.env.JWT_SECRET || 'default-super-secret-jwt-key-production-ready',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  openaiApiKey: process.env.OPENAI_API_KEY || 'mock-key',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
});
