import { requestAutenticado } from './requestAutenticado';
import type { UsuarioCozinha } from '../types/UsuarioCozinha';

interface UsuarioCozinhaApi {
    id: string;
    login: string;
    nome?: string;
    restauranteId: string;
    createdAt?: string;
    updatedAt?: string;
}

function mapearUsuario(payload: UsuarioCozinhaApi): UsuarioCozinha {
    return {
        id: payload.id,
        login: payload.login,
        nome: payload.nome,
        restauranteId: payload.restauranteId,
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
    };
}

export const ServicoUsuariosCozinha = {
    async obter(): Promise<UsuarioCozinha | null> {
        const data = await requestAutenticado<UsuarioCozinhaApi | null>('/cozinha/usuario');
        if (!data) return null;
        return mapearUsuario(data);
    },

    async criar(): Promise<UsuarioCozinha> {
        const data = await requestAutenticado<UsuarioCozinhaApi>('/cozinha/usuario', {
            method: 'POST',
        });
        return mapearUsuario(data);
    },

    async alterarSenha(novaSenha: string): Promise<UsuarioCozinha> {
        const data = await requestAutenticado<UsuarioCozinhaApi>('/cozinha/usuario/senha', {
            method: 'PATCH',
            body: JSON.stringify({ novaSenha }),
        });
        return mapearUsuario(data);
    },
};
