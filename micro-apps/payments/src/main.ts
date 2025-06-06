import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { json } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  
  // Configure body parser
  app.use(json({
    limit: '10mb',
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));

  // Enable CORS with more permissive settings
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 3600,
  });

  // Set global prefix
  app.setGlobalPrefix('api');

  // Set global timeout
  app.use((req, res, next) => {
    res.setTimeout(30000, () => {
      logger.error('Request timeout');
      res.status(408).send('Request timeout');
    });
    next();
  });

  await app.listen(8080);
  logger.log('Payments micro-app is running on port 8080');
}
bootstrap(); 