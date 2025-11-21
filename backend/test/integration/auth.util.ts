import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export async function obterTokenAdmin(app: INestApplication): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'admin@teste.com', senha: 'senha123' });

  if (response.status !== 201) {
    throw new Error(`Falha no login do Admin (Status ${response.status}): ${JSON.stringify(response.body)}`);
  }

  return response.body.token;
}

export async function obterTokenCozinha(app: INestApplication): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/cozinha/login')
    .send({ email: 'cozinha@teste.com', senha: 'senha123' });

  if (response.status !== 201) {
    throw new Error(`Falha no login da Cozinha (Status ${response.status}): ${JSON.stringify(response.body)}`);
  }

  return response.body.token;
}