import type { Mesa } from '../types/Mesa';
import type { Pedido } from '../types/Pedido';
import { requestAutenticado } from './requestAutenticado';

interface MesaApi {
    id: string;
    numero: number;
    codigoQr: string;
    ocupada: boolean;
    contaSolicitada?: boolean;
    restauranteId: string;
}

function mapearMesaApi(payload: MesaApi): Mesa {
    return {
        id: payload.id,
        numero: payload.numero,
        codigoQr: payload.codigoQr,
        ocupada: payload.ocupada,
        contaSolicitada: payload.contaSolicitada ?? false,
        restauranteId: payload.restauranteId,
    };
}

export const ServicoMesas = {
    async listar(): Promise<Mesa[]> {
        const data = await requestAutenticado<MesaApi[]>('/mesas');
        return data.map(mapearMesaApi);
    },

    async obterStatusPublico(idMesa: string): Promise<{ ocupada: boolean; contaSolicitada: boolean; }> {
        const data = await requestAutenticado<{ ocupada: boolean; contaSolicitada?: boolean; }>(
            `/mesas/${idMesa}/status-publico`,
            undefined,
            { includeContentType: false },
        );
        return {
            ocupada: data.ocupada,
            contaSolicitada: data.contaSolicitada ?? false,
        };
    },

    async obterComanda(idMesa: string): Promise<Pedido[]> {
        // Retorna lista de pedidos da sessão atual (backend filtra por mesa ocupada + 24h)
        return await requestAutenticado<Pedido[]>(`/mesas/${idMesa}/comanda`, undefined, { includeContentType: false });
    },

    async adicionarMesa(numero: number): Promise<Mesa> {
        const data = await requestAutenticado<MesaApi>('/mesas', {
            method: 'POST',
            body: JSON.stringify({
                numero,
                baseUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
            }),
        });
        return mapearMesaApi(data);
    },

    async configurarMesas(total: number): Promise<Mesa[]> {
        const data = await requestAutenticado<MesaApi[]>('/mesas/configurar', {
            method: 'POST',
            body: JSON.stringify({
                total,
                baseUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
            }),
        });
        return data.map(mapearMesaApi);
    },

    async excluirMesa(id: string): Promise<void> {
        await requestAutenticado(`/mesas/${id}`, {
            method: 'DELETE',
        });
    },

    async fecharMesa(id: string): Promise<Mesa> {
        const data = await requestAutenticado<MesaApi>(`/mesas/${id}/fechar`, {
            method: 'PATCH',
        });
        return mapearMesaApi(data);
    },

    async solicitarConta(idMesa: string): Promise<void> {
        await requestAutenticado(`/mesas/${idMesa}/solicitar-conta`, { method: 'PATCH' });
    },
};
