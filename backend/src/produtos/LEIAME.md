# Produtos

CRUD de produtos do cardápio e toggle de disponibilidade. O restaurante é identificado pelo header `x-restaurante-id`; se não vier, usamos o primeiro restaurante cadastrado ou criamos um default na criação.

## Endpoints
- `GET /produtos` – lista ordenada por nome.
- `POST /produtos` – cria novo produto e vincula ao restaurante.
- `PATCH /produtos/:id` – atualiza campos parciais.
- `DELETE /produtos/:id` – remove produto.
- `PATCH /produtos/:id/disponibilidade` – inverte o booleano `disponivel`.

## Dicas
- Antes de atualizar/remover, verificamos a existência do produto e lançamos `NotFoundException` se não existir.
- `ProdudosService` é o único ponto que conversa com Prisma; controllers só orquestram.

## Exemplo de uso no service
```typescript
async alternarDisponibilidade(id: string) {
  const produto = await this.prisma.produto.findUnique({ where: { id } });
  if (!produto) throw new NotFoundException('Produto não encontrado');

  return this.prisma.produto.update({
    where: { id },
    data: { disponivel: !produto.disponivel },
  });
}
```
