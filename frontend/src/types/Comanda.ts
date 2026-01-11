export type StatusComanda = 'aberta' | 'encerrada';

export type StatusDispositivo = 'pendente' | 'aprovado' | 'recusado' | 'revogado';

export interface ComandaResumo {
    id: string;
    codigo: string;
    status: StatusComanda;
    contaSolicitada: boolean;
    mesaAtual?: { id: string; numero: number } | null;
    dispositivoAtual?: { id: string; master: boolean } | null;
}

export interface DispositivoComanda {
    id: string;
    apelido?: string | null;
    master: boolean;
    status: StatusDispositivo;
    ativo: boolean;
    createdAt: string;
}
