import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { criarApp, limparBancoDeDados, popularBancoDeDados } from './setup';
import { obterTokenAdmin, obterTokenCozinha } from './auth.util';

describe('MesasController (integration)', () => {
  let app: INestApplication;
  let tokenAdmin: string;
  let tokenCozinha: string;

  beforeAll(async () => {
    app = await criarApp();
    await app.init();
    await limparBancoDeDados(app);
    await popularBancoDeDados(app);
    tokenAdmin = await obterTokenAdmin(app);
    tokenCozinha = await obterTokenCozinha(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /mesas', () => {
    it('deve listar as mesas para o admin', async () => {
      const { status, body } = await request(app.getHttpServer())
        .get('/mesas')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(status).toBe(200);
      expect(body).toBeInstanceOf(Array);
    });

    it('deve listar as mesas para a cozinha', async () => {
      const { status, body } = await request(app.getHttpServer())
        .get('/mesas')
        .set('Authorization', `Bearer ${tokenCozinha}`);

      expect(status).toBe(200);
      expect(body).toBeInstanceOf(Array);
    });

    it('deve retornar erro para token inválido', async () => {
      const { status } = await request(app.getHttpServer())
        .get('/mesas')
        .set('Authorization', 'Bearer tokeninvalido');

      expect(status).toBe(401);
    });
  });

  describe('POST /mesas', () => {
    it('deve adicionar uma nova mesa', async () => {
      const numeroMesa = 999;
      const { status, body } = await request(app.getHttpServer())
        .post('/mesas')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ numero: numeroMesa });

      expect(status).toBe(201);
      expect(body.numero).toBe(numeroMesa);
    });

    it('não deve adicionar mesa com número duplicado', async () => {
      const numeroMesa = 1; // Mesa já existe
      const { status } = await request(app.getHttpServer())
        .post('/mesas')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ numero: numeroMesa });

      expect(status).toBe(400);
    });

    it('deve retornar erro para usuário não admin', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/mesas')
        .set('Authorization', `Bearer ${tokenCozinha}`)
        .send({ numero: 123 });

      expect(status).toBe(403);
    });
  });

  describe('DELETE /mesas/:id', () => {
    it('deve excluir uma mesa', async () => {
      // 1. Criar mesa para excluir
      const numeroMesa = 888;
      const res = await request(app.getHttpServer())
        .post('/mesas')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ numero: numeroMesa });
      
      const mesaId = res.body.id;

      // 2. Excluir a mesa
      const { status } = await request(app.getHttpServer())
        .delete(`/mesas/${mesaId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(status).toBe(200);

      // 3. Verificar se foi excluída
      const { body: mesas } = await request(app.getHttpServer())
        .get('/mesas')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      
      const mesaExcluida = mesas.find((m: { id: string }) => m.id === mesaId);
      expect(mesaExcluida).toBeUndefined();
    });

    it('deve retornar erro ao excluir mesa inexistente', async () => {
      const idInexistente = 'id-fake-123';
      const { status } = await request(app.getHttpServer())
        .delete(`/mesas/${idInexistente}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(status).toBe(404);
    });

    it('deve retornar erro para usuário não admin', async () => {
        const numeroMesa = 777;
        const res = await request(app.getHttpServer())
            .post('/mesas')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ numero: numeroMesa });
        
        const mesaId = res.body.id;

        const { status } = await request(app.getHttpServer())
            .delete(`/mesas/${mesaId}`)
            .set('Authorization', `Bearer ${tokenCozinha}`);

      expect(status).toBe(403);
    });
  });
});