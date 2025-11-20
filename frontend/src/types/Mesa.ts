export interface Mesa {
    id: string;
    numero: number;
    codigoQr: string;
    ocupada: boolean;
    contaSolicitada?: boolean;
    restauranteId: string;
    createdAt?: string;
    updatedAt?: string;
}
