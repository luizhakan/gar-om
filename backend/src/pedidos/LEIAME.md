# Pedidos

Fluxo de criação, listagem e atualização de status de pedidos. Os pedidos sempre retornam itens com dados do produto embutidos para facilitar a UI.

## Endpoints
- `GET /pedidos` – lista pedidos do restaurante (ordem: mais recentes primeiro).
- `POST /pedidos` – cria pedido para uma mesa, calculando preço unitário a partir do produto.
- `PATCH /pedidos/:id/status` – atualiza `status` (`pendente` | `preparando` | `pronto`) e registra `dataAtualizacao`.

## Regras
- Ao criar, cada item é validado: se o produto não existir, lançamos `NotFoundException`.
- `PedidosService` garante que a mesa exista; se não existir, cria uma nova mesa para o restaurante informado (ou default).
- `formatarPedido` transforma o retorno do Prisma para o shape esperado pelo frontend (idMesa vira número da mesa quando disponível).

## Exemplo
```typescript
async atualizarStatus(id: string, dto: AtualizarStatusDto) {
  const pedido = await this.prisma.pedido.findUnique({ where: { id } });
  if (!pedido) throw new NotFoundException('Pedido não encontrado');

  const atualizado = await this.prisma.pedido.update({
    where: { id },
    data: { status: dto.status, dataAtualizacao: new Date() },
    include: { mesa: true, itens: { include: { produto: true } } },
  });

  return this.formatarPedido(atualizado);
}
```
