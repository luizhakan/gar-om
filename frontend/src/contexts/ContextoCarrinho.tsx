import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Produto } from '../types/Produto';
import { ContextoCarrinho, type ItemCarrinho } from './carrinho-context';

interface ProvedorCarrinhoProps {
    children: ReactNode;
}

const CHAVE_CARRINHO = 'garcom_carrinho_itens';

export function ProvedorCarrinho({ children }: ProvedorCarrinhoProps) {
    // 1. Inicializa lendo do LocalStorage para não perder dados no F5
    const [itens, setItens] = useState<ItemCarrinho[]>(() => {
        if (typeof window === 'undefined') return [];
        const salvos = window.localStorage.getItem(CHAVE_CARRINHO);
        return salvos ? (JSON.parse(salvos) as ItemCarrinho[]) : [];
    });

    // 2. Salva no LocalStorage sempre que mudar
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens));
        }
    }, [itens]);

    function adicionarItem(produto: Produto, observacao?: string) {
        setItens((itensAtuais) => {
            const itemExistente = itensAtuais.find(item => item.idProduto === produto.id);

            if (itemExistente) {
                return itensAtuais.map(item =>
                    item.idProduto === produto.id
                        ? { ...item, quantidade: item.quantidade + 1 }
                        : item
                );
            }

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