export interface Produto {
    id: string;
    nome: string;
    descricao?: string;
    preco: number;
    idCategoria: string;
    disponivel: boolean;
    imagemUrl?: string;
    restauranteId: string;
    createdAt?: string;
    updatedAt?: string;
}
