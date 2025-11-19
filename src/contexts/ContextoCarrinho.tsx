import { createContext, useContext, useState, ReactNode } from 'react';
import type { Produto } from '../types/Produto';
import type { ItemPedido } from '../types/Pedido';

interface ItemCarrinho extends ItemPedido {
    produto: Produto;
}

interface DadosContextoCarrinho {
    itens: ItemCarrinho[];
    adicionarItem: (produto: Produto, observacao?: string) => void;
    removerItem: (idProduto: string) => void;
    atualizarQuantidade: (idProduto: string, quantidade: number) => void;
    atualizarObservacao: (idProduto: string, observacao: string) => void;
    limparCarrinho: () => void;
    total: number;
    quantidadeTotal: number;
}

const ContextoCarrinho = createContext<DadosContextoCarrinho>({} as DadosContextoCarrinho);

interface ProvedorCarrinhoProps {
    children: ReactNode;
}

export function ProvedorCarrinho({ children }: ProvedorCarrinhoProps) {
    const [itens, setItens] = useState<ItemCarrinho[]>([]);

    function adicionarItem(produto: Produto, observacao?: string) {
        setItens((itensAtuais) => {
            const itemExistente = itensAtuais.find(item => item.idProduto === produto.id);

            if (itemExistente) {
                // Se já existe, incrementa quantidade
                return itensAtuais.map(item =>
                    item.idProduto === produto.id
                        ? { ...item, quantidade: item.quantidade + 1 }
                        : item
                );
            }

            // Se não existe, adiciona novo item
            return [...itensAtuais, {
                idProduto: produto.id,
                produto,
                quantidade: 1,
                observacao
            }];
        });
    }

    function removerItem(idProduto: string) {
        setItens(itensAtuais => itensAtuais.filter(item => item.idProduto !== idProduto));
    }

    function atualizarQuantidade(idProduto: string, quantidade: number) {
        if (quantidade <= 0) {
            removerItem(idProduto);
            return;
        }

        setItens(itensAtuais =>
            itensAtuais.map(item =>
                item.idProduto === idProduto
                    ? { ...item, quantidade }
                    : item
            )
        );
    }

    function atualizarObservacao(idProduto: string, observacao: string) {
        setItens(itensAtuais =>
            itensAtuais.map(item =>
                item.idProduto === idProduto
                    ? { ...item, observacao }
                    : item
            )
        );
    }

    function limparCarrinho() {
        setItens([]);
    }

    // Cálculos derivados
    const total = itens.reduce((acc, item) => {
        return acc + (item.produto.preco * item.quantidade);
    }, 0);

    const quantidadeTotal = itens.reduce((acc, item) => {
        return acc + item.quantidade;
    }, 0);

    return (
        <ContextoCarrinho.Provider value={{
            itens,
            adicionarItem,
            removerItem,
            atualizarQuantidade,
            atualizarObservacao,
            limparCarrinho,
            total,
            quantidadeTotal
        }}>
            {children}
        </ContextoCarrinho.Provider>
    );
}

/**
 * Hook para acessar o contexto do carrinho.
 * Deve ser usado dentro de um ProvedorCarrinho.
 */
export function useCarrinho() {
    const contexto = useContext(ContextoCarrinho);

    if (!contexto) {
        throw new Error('useCarrinho deve ser usado dentro de um ProvedorCarrinho');
    }

    return contexto;
}
