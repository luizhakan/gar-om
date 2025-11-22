import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ContextoAdmin, type DadosContextoAdmin } from '../../contexts/admin-context';
import type { UsuarioCozinha } from '../../types/UsuarioCozinha';
import { CozinhaAdmin } from './Cozinha';

const noopAsync = async () => { /* noop */ };
const noopSync = () => { /* noop */ };

function criarContextoBase(overrides?: Partial<DadosContextoAdmin>): DadosContextoAdmin {
    return {
        autenticado: true,
        login: noopAsync,
        logout: noopSync,
        categorias: [],
        criarCategoria: noopAsync,
        produtos: [],
        criarProduto: noopAsync,
        atualizarProduto: noopAsync,
        removerProduto: noopAsync,
        alternarDisponibilidade: noopAsync,
        mesas: [],
        adicionarMesa: noopAsync,
        excluirMesa: noopAsync,
        definirNumeroMesas: noopAsync,
        fecharMesa: noopAsync,
        gerarLinkMesa: () => '',
        restauranteId: 'rest-1',
        adminEmail: 'admin@teste.com',
        usuarioCozinha: null,
        carregandoUsuarioCozinha: false,
        criarUsuarioCozinha: async () => ({
            id: 'usuario-teste',
            login: 'restaurante-legal',
            restauranteId: 'rest-1',
        }),
        recarregarUsuarioCozinha: noopAsync,
        alterarSenhaUsuarioCozinha: async () => ({
            id: 'usuario-teste',
            login: 'restaurante-legal',
            restauranteId: 'rest-1',
        }),
        ...overrides,
    };
}

function ProviderTeste({ children, value }: { children: ReactNode; value: DadosContextoAdmin }) {
    return (
        <ContextoAdmin.Provider value={value}>
            {children}
        </ContextoAdmin.Provider>
    );
}

describe('CozinhaAdmin', () => {
    it('mostra login existente e bloqueia nova criação', () => {
        const usuarioCozinha: UsuarioCozinha = {
            id: 'cook-1',
            login: 'restaurante-demo',
            nome: 'Cozinha',
            restauranteId: 'rest-1',
            createdAt: '2024-05-01T12:00:00.000Z',
            updatedAt: '2024-05-01T12:00:00.000Z',
        };

        render(
            <ProviderTeste value={criarContextoBase({ usuarioCozinha })}>
                <CozinhaAdmin />
            </ProviderTeste>,
        );

        expect(screen.getByDisplayValue(usuarioCozinha.login)).toBeDisabled();
        expect(screen.getByRole('button', { name: /já existe um acesso criado/i })).toBeDisabled();
        expect(screen.getByText(/acesso ativo/i)).toBeInTheDocument();
    });

    it('cria usuário com senha padrão informada', async () => {
        const user = userEvent.setup();

        function Wrapper() {
            const [usuarioCozinha, setUsuarioCozinha] = useState<UsuarioCozinha | null>(null);
            const criarUsuarioCozinha = vi.fn(async () => {
                const novo: UsuarioCozinha = {
                    id: 'cook-123',
                    login: 'restaurante-legal',
                    restauranteId: 'rest-1',
                };
                setUsuarioCozinha(novo);
                return novo;
            });

            return (
                <ProviderTeste
                    value={criarContextoBase({
                        usuarioCozinha,
                        criarUsuarioCozinha,
                    })}
                >
                    <CozinhaAdmin />
                </ProviderTeste>
            );
        }

        render(<Wrapper />);

        await user.click(screen.getByRole('button', { name: /criar acesso da cozinha/i }));

        await waitFor(() => {
            expect(screen.getByText(/login restaurante-legal criado\. senha padrão: cozinha123\./i)).toBeInTheDocument();
        });
        expect(screen.getByRole('button', { name: /já existe um acesso criado/i })).toBeDisabled();
    });

    it('atualiza senha quando já existe login', async () => {
        const user = userEvent.setup();
        const alterarSenhaUsuarioCozinha = vi.fn().mockResolvedValue({
            id: 'cook-1',
            login: 'restaurante-demo',
            restauranteId: 'rest-1',
        });

        render(
            <ProviderTeste
                value={criarContextoBase({
                    usuarioCozinha: { id: 'cook-1', login: 'restaurante-demo', nome: 'Cozinha', restauranteId: 'rest-1' },
                    alterarSenhaUsuarioCozinha,
                })}
            >
                <CozinhaAdmin />
            </ProviderTeste>,
        );

        await user.type(screen.getByLabelText(/nova senha/i), 'novasenha');
        await user.click(screen.getByRole('button', { name: /atualizar senha/i }));

        await waitFor(() => {
            expect(alterarSenhaUsuarioCozinha).toHaveBeenCalledWith('novasenha');
        });
    });

    it('mostra mensagem de erro se a criação falhar', async () => {
        const user = userEvent.setup();
        const erroCriacao = new Error('Falha ao criar usuário');

        render(
            <ProviderTeste
                value={criarContextoBase({
                    criarUsuarioCozinha: vi.fn().mockRejectedValue(erroCriacao),
                })}
            >
                <CozinhaAdmin />
            </ProviderTeste>,
        );

        await user.click(screen.getByRole('button', { name: /criar acesso da cozinha/i }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao criar usuário');
    });
});
