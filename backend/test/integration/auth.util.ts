import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export async function obterTokenAdmin(app: INestApplication): Promise<string> {
  const { body } = await request(app.getHttpServer())
    .post('/auth/admin/login')
    .send({ email: 'admin@teste.com', senha: 'senha123' });
  return body.token;
}

export async function obterTokenCozinha(app: INestApplication): Promise<string> {
  const { body } = await request(app.getHttpServer())
    .post('/auth/cozinha/login')
    .send({ email: 'cozinha@teste.com', senha: 'senha123' });
  return body.token;
}
