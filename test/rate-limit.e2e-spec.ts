import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';

describe('RateLimit (e2e)', () => {
  let app: INestApplication;
  let backendServer: express.Application;
  let server: any;

  beforeAll(async () => {
    // Mock backend
    backendServer = express();
    backendServer.use(express.json());
    backendServer.use((req, res) => {
      res.json({ ok: true });
    });

    server = backendServer.listen(9002);

    // Patch routes.yaml pour inclure rate limit
    const routesPath = path.join(process.cwd(), 'routes.rate-limit.yaml');
    fs.writeFileSync(
      routesPath,
      `routes:
  - path: /api/test
    method: GET
    backend_url: http://localhost:9002/api/test
    rate_limit:
      points: 2
      duration: 1
`
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    server.close();
    const routesPath = path.join(process.cwd(), 'routes.rate-limit.yaml');
    if (fs.existsSync(routesPath)) {
      fs.unlinkSync(routesPath);
    }
  });

  it('should allow requests within rate limit', async () => {
    // First request
    await request(app.getHttpServer())
      .get('/api/test')
      .expect(200);

    // Second request
    await request(app.getHttpServer())
      .get('/api/test')
      .expect(200);
  });

  it('should reject requests over rate limit', async () => {
    // First request
    await request(app.getHttpServer())
      .get('/api/test')
      .expect(200);

    // Second request
    await request(app.getHttpServer())
      .get('/api/test')
      .expect(200);

    // Third request should be rejected
    await request(app.getHttpServer())
      .get('/api/test')
      .expect(429);
  });

  it('should reset limit after duration', async () => {
    // First request
    await request(app.getHttpServer())
      .get('/api/test')
      .expect(200);

    // Second request
    await request(app.getHttpServer())
      .get('/api/test')
      .expect(200);

    // Third request should be rejected
    await request(app.getHttpServer())
      .get('/api/test')
      .expect(429);

    // Wait for duration to expire
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Should work again
    await request(app.getHttpServer())
      .get('/api/test')
      .expect(200);
  });
}); 