# Mesas

Gerencia as mesas do restaurante (número, QR Code e ocupação). O restaurante pode ser informado via header `x-restaurante-id`; se não vier, usamos/criamos um restaurante padrão.

- Para montar o QR Code é utilizada, em ordem, a variável de ambiente `FRONTEND_URL`, o host da requisição (para ambientes atrás de proxy) ou, por último, `http://localhost:5173`.
- O path enviado no payload não é considerado; apenas protocolo + host são usados.

## Endpoints
- `GET /mesas`: lista mesas do restaurante, ordenadas por número.
- `PUT /mesas/configurar`: recria todas as mesas de 1..`total` com QR code baseado na URL segura calculada (`FRONTEND_URL` > host da requisição > `http://localhost:5173`).

## Regras
- `configurar` sempre zera as mesas do restaurante antes de recriar (`deleteMany` + `createMany`).
- `configurar` usa `upsert` quando um `restauranteId` explícito é enviado; sem id, cria um default se ainda não existir.

## Exemplo
```typescript
async configurar(total: number, baseUrl: string, restauranteId?: string) {
  // ... resolve restaurante ...
  await this.prisma.mesa.deleteMany({ where: { restauranteId: restaurante.id } });

  const payload = Array.from({ length: total }, (_, i) => ({
    id: `mesa-${i + 1}`,
    numero: i + 1,
    codigoQr: `${baseUrl}/mesa/${i + 1}`,
    ocupada: false,
    restauranteId: restaurante.id,
  }));

  await this.prisma.mesa.createMany({ data: payload });
  return this.listar(restauranteId);
}
```
