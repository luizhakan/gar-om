# Categorias

CRUD simples de categorias para organizar o cardápio. A ordenação é controlada pelo campo `ordem` (int), usado no `ORDER BY` padrão.

## Endpoints
- `GET /categorias` – retorna todas ordenadas.
- `POST /categorias` – cria nova categoria (id opcional para sincronizar com seed/import).

## Regras
- Sem lógica extra no controller: toda a persistência está em `CategoriasService`.
- Ordenação sempre por `ordem asc`.

## Exemplo
```typescript
async criar(dados: Prisma.CategoriaCreateInput) {
  return this.prisma.categoria.create({ data: dados });
}
```
