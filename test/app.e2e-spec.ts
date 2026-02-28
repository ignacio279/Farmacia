import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Webhook (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('GET /webhook/whatsapp - verification', () => {
    const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN ?? 'farmacia_verify';
    return request(app.getHttpServer())
      .get('/webhook/whatsapp')
      .query({ 'hub.mode': 'subscribe', 'hub.verify_token': verifyToken, 'hub.challenge': 'test_challenge' })
      .expect(200)
      .expect('test_challenge');
  });

  it('GET /webhook/whatsapp - verification fails on wrong token', () => {
    return request(app.getHttpServer())
      .get('/webhook/whatsapp')
      .query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong', 'hub.challenge': 'x' })
      .expect(403);
  });
});
