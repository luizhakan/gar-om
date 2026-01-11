import type { ComandaResumo, DispositivoComanda } from '../types/Comanda';
import type { Pedido } from '../types/Pedido';
import { obterComandaId, obterTokenComanda } from '../utils/sessao';
import { requestAutenticado } from './requestAutenticado';

function obterTokenComandaObrigatorio(): string {
    const token = obterTokenComanda();
    if (!token) {
        throw new Error('Token da comanda não encontrado');
    }
    return token;
}

function obterComandaIdObrigatorio(): string {
    const comandaId = obterComandaId();
    if (!comandaId) {
        throw new Error('Comanda não encontrada na sessão');
    }
    return comandaId;
}

export const ServicoComandas = {
    async solicitarAcesso(codigo: string, apelido?: string): Promise<{ idDispositivo: string; codigoComanda?: string }> {
        return requestAutenticado('/comandas/solicitar-acesso', {
            method: 'POST',
            body: JSON.stringify({ codigo, apelido }),
        });
    },

    async solicitarAcessoMesa(idMesa: string, apelido?: string): Promise<{ idDispositivo: string; codigoComanda: string }> {
        return requestAutenticado('/comandas/solicitar-acesso-mesa', {
            method: 'POST',
            body: JSON.stringify({ idMesa, apelido }),
        });
    },

    async consultarSolicitacao(idDispositivo: string, codigo: string): Promise<{ status: string; token?: string; comandaId?: string }> {
        return requestAutenticado(`/comandas/dispositivos/${idDispositivo}/status?codigo=${encodeURIComponent(codigo)}`, undefined, { includeContentType: false });
    },

    async obterResumo(comandaId?: string): Promise<ComandaResumo> {
        const id = comandaId ?? obterComandaIdObrigatorio();
        const token = obterTokenComandaObrigatorio();
        return requestAutenticado<ComandaResumo>(`/comandas/${id}`, undefined, {
            includeContentType: false,
            extraHeaders: { 'x-comanda-token': token },
        });
    },

    async listarDispositivos(comandaId?: string): Promise<DispositivoComanda[]> {
        const id = comandaId ?? obterComandaIdObrigatorio();
        const token = obterTokenComandaObrigatorio();
        return requestAutenticado<DispositivoComanda[]>(`/comandas/${id}/dispositivos`, undefined, {
            includeContentType: false,
            extraHeaders: { 'x-comanda-token': token },
        });
    },

    async aprovarDispositivo(comandaId: string, dispositivoId: string): Promise<void> {
        const token = obterTokenComandaObrigatorio();
        await requestAutenticado(`/comandas/${comandaId}/dispositivos/${dispositivoId}/aprovar`, {
            method: 'PATCH',
        }, {
            extraHeaders: { 'x-comanda-token': token },
        });
    },

    async recusarDispositivo(comandaId: string, dispositivoId: string): Promise<void> {
        const token = obterTokenComandaObrigatorio();
        await requestAutenticado(`/comandas/${comandaId}/dispositivos/${dispositivoId}/recusar`, {
            method: 'PATCH',
        }, {
            extraHeaders: { 'x-comanda-token': token },
        });
    },

    async revogarDispositivo(comandaId: string, dispositivoId: string): Promise<void> {
        const token = obterTokenComandaObrigatorio();
        await requestAutenticado(`/comandas/${comandaId}/dispositivos/${dispositivoId}/revogar`, {
            method: 'PATCH',
        }, {
            extraHeaders: { 'x-comanda-token': token },
        });
    },

    async trocarMesa(numeroMesa: number, comandaId?: string): Promise<ComandaResumo> {
        const id = comandaId ?? obterComandaIdObrigatorio();
        const token = obterTokenComandaObrigatorio();
        return requestAutenticado<ComandaResumo>(`/comandas/${id}/trocar-mesa`, {
            method: 'PATCH',
            body: JSON.stringify({ numeroMesa }),
        }, {
            extraHeaders: { 'x-comanda-token': token },
        });
    },

    async solicitarConta(comandaId?: string): Promise<ComandaResumo> {
        const id = comandaId ?? obterComandaIdObrigatorio();
        const token = obterTokenComandaObrigatorio();
        return requestAutenticado<ComandaResumo>(`/comandas/${id}/solicitar-conta`, {
            method: 'PATCH',
        }, {
            extraHeaders: { 'x-comanda-token': token },
        });
    },

    async reabrirConta(comandaId?: string): Promise<ComandaResumo> {
        const id = comandaId ?? obterComandaIdObrigatorio();
        const token = obterTokenComandaObrigatorio();
        return requestAutenticado<ComandaResumo>(`/comandas/${id}/reabrir-conta`, {
            method: 'PATCH',
        }, {
            extraHeaders: { 'x-comanda-token': token },
        });
    },

    async obterComandaPorMesa(idMesa: string): Promise<ComandaResumo & { dispositivos: DispositivoComanda[] }> {
        return requestAutenticado(`/comandas/por-mesa/${idMesa}`, undefined, { includeContentType: false });
    },

    async adminVirarMaster(comandaId: string): Promise<void> {
        await requestAutenticado(`/comandas/${comandaId}/admin/virar-master`, { method: 'PATCH' });
    },

    async adminDefinirMaster(comandaId: string, dispositivoId: string): Promise<void> {
        await requestAutenticado(`/comandas/${comandaId}/admin/definir-master/${dispositivoId}`, { method: 'PATCH' });
    },

    async adminEncerrar(comandaId: string): Promise<void> {
        await requestAutenticado(`/comandas/${comandaId}/admin/encerrar`, { method: 'PATCH' });
    },

    async obterPedidos(comandaId?: string): Promise<Pedido[]> {
        const id = comandaId ?? obterComandaIdObrigatorio();
        const token = obterTokenComandaObrigatorio();
        return requestAutenticado<Pedido[]>(`/comandas/${id}/pedidos`, undefined, {
            includeContentType: false,
            extraHeaders: { 'x-comanda-token': token },
        });
    },
};
