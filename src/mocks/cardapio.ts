import type { Categoria } from '../types/Categoria';
import type { Produto } from '../types/Produto';

export const categoriasMock: Categoria[] = [
    { id: '1', nome: 'Bebidas', ordem: 1 },
    { id: '2', nome: 'Lanches', ordem: 2 },
    { id: '3', nome: 'Porções', ordem: 3 },
    { id: '4', nome: 'Sobremesas', ordem: 4 },
];

export const produtosMock: Produto[] = [
    // Bebidas
    {
        id: '1',
        nome: 'Coca-Cola Lata',
        descricao: 'Refrigerante 350ml gelado',
        preco: 5.00,
        idCategoria: '1',
        disponivel: true,
    },
    {
        id: '2',
        nome: 'Suco de Laranja Natural',
        descricao: 'Suco fresco 500ml',
        preco: 8.00,
        idCategoria: '1',
        disponivel: true,
    },
    {
        id: '3',
        nome: 'Cerveja Heineken Long Neck',
        descricao: 'Cerveja importada 330ml',
        preco: 12.00,
        idCategoria: '1',
        disponivel: true,
    },

    // Lanches
    {
        id: '4',
        nome: 'X-Burger Clássico',
        descricao: 'Hambúrguer artesanal 180g, queijo, alface, tomate e molho especial',
        preco: 25.00,
        idCategoria: '2',
        disponivel: true,
    },
    {
        id: '5',
        nome: 'X-Bacon',
        descricao: 'Hambúrguer 180g, bacon crocante, queijo cheddar e cebola caramelizada',
        preco: 28.00,
        idCategoria: '2',
        disponivel: true,
    },
    {
        id: '6',
        nome: 'X-Salada',
        descricao: 'Hambúrguer 180g, queijo, alface, tomate, milho e batata palha',
        preco: 22.00,
        idCategoria: '2',
        disponivel: true,
    },

    // Porções
    {
        id: '7',
        nome: 'Batata Frita Grande',
        descricao: 'Porção de batata frita crocante (500g)',
        preco: 18.00,
        idCategoria: '3',
        disponivel: true,
    },
    {
        id: '8',
        nome: 'Onion Rings',
        descricao: 'Anéis de cebola empanados (300g)',
        preco: 20.00,
        idCategoria: '3',
        disponivel: true,
    },
    {
        id: '9',
        nome: 'Frango à Passarinho',
        descricao: 'Frango frito temperado com alho (400g)',
        preco: 32.00,
        idCategoria: '3',
        disponivel: true,
    },

    // Sobremesas
    {
        id: '10',
        nome: 'Petit Gateau',
        descricao: 'Bolo de chocolate quente com sorvete de baunilha',
        preco: 15.00,
        idCategoria: '4',
        disponivel: true,
    },
    {
        id: '11',
        nome: 'Brownie com Sorvete',
        descricao: 'Brownie caseiro com sorvete e calda de chocolate',
        preco: 14.00,
        idCategoria: '4',
        disponivel: true,
    },
];
