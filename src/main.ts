import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { Logger } from '@nestjs/common';
import { AdminServerModule } from './modules/admin-server/admin-server.module';

async function bootstrap() {
  // Configuration commune
  const corsConfig = {
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Environment'],
  };

  const validationPipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  // Serveur Proxy
  const proxyApp = await NestFactory.create(AppModule);
  const proxyLogger = new Logger('ProxyServer');
  proxyApp.useLogger(proxyLogger);
  proxyApp.use(json({ limit: '50mb' }));
  proxyApp.enableCors(corsConfig);
  proxyApp.useGlobalPipes(validationPipe);
  proxyApp.setGlobalPrefix('api');

  // Serveur Admin
  const adminApp = await NestFactory.create(AdminServerModule);
  const adminLogger = new Logger('AdminServer');
  adminApp.useLogger(adminLogger);
  adminApp.use(json({ limit: '50mb' }));
  adminApp.enableCors(corsConfig);
  adminApp.useGlobalPipes(validationPipe);
  adminApp.setGlobalPrefix('api');

  // Démarrer les deux serveurs
  const proxyPort = 3000;
  const adminPort = 3001;

  await Promise.all([
    proxyApp.listen(proxyPort),
    adminApp.listen(adminPort),
  ]);

  proxyLogger.log(`Proxy server is running on: http://localhost:${proxyPort}`);
  adminLogger.log(`Admin server is running on: http://localhost:${adminPort}`);
}
bootstrap(); 