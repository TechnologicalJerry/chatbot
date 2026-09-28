import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';

import mongoosePlugin from './plugins/mongoose.plugin';
import redisPlugin from './plugins/redis.plugin';
import authPlugin from './plugins/auth.plugin';
import swaggerPlugin from './plugins/swagger.plugin';
import metricsPlugin from './plugins/metrics.plugin';

import { usersRoutes } from './routes/users.routes';
import { authRoutes } from './routes/auth.routes';
import { productsRoutes } from './routes/products.routes';
import { conversationsRoutes } from './routes/conversations.routes';
import { messagesRoutes } from './routes/messages.routes';
import { knowledgeRoutes } from './routes/knowledge.routes';
import { memoryRoutes } from './routes/memory.routes';
import { chatRoutes } from './routes/chat.routes';
import { healthRoutes } from './routes/health.routes';

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // Global Core Plugins
  app.register(cors, { origin: true });
  app.register(helmet, { contentSecurityPolicy: false });
  app.register(sensible);

  // Infrastructure Plugins
  app.register(mongoosePlugin);
  app.register(redisPlugin);
  app.register(authPlugin);
  app.register(swaggerPlugin);
  app.register(metricsPlugin);

  // Domain Feature Routes
  app.register(usersRoutes, { prefix: '/api/v1/users' });
  app.register(authRoutes, { prefix: '/api/v1/sessions' });
  app.register(productsRoutes, { prefix: '/api/v1/products' });
  app.register(conversationsRoutes, { prefix: '/api/v1/conversations' });
  app.register(messagesRoutes, { prefix: '/api/v1' });
  app.register(knowledgeRoutes, { prefix: '/api/v1/knowledge' });
  app.register(memoryRoutes, { prefix: '/api/v1/memory' });
  app.register(chatRoutes, { prefix: '/api/v1/chat' });
  app.register(healthRoutes, { prefix: '/health' });

  return app;
}
