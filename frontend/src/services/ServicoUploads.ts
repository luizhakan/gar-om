import { env } from '../config/env';
import { requestAutenticado } from './requestAutenticado';

export interface ResultadoUpload {
    url: string;
    storageUsedBytes: string;
    storageLimitBytes: string;
}

const API_BASE = env.apiBaseUrl.replace(/\/$/, '');
const usarApi = Boolean(API_BASE);

export const ServicoUploads = {
    async uploadImagem(arquivo: File): Promise<ResultadoUpload> {
        if (!usarApi) throw new Error('API não configurada');

        const fd = new FormData();
        fd.append('arquivo', arquivo);

        // includeContentType: false → deixa o browser setar o boundary do multipart automaticamente
        return requestAutenticado<ResultadoUpload>(
            '/uploads/imagem',
            { method: 'POST', body: fd },
            { includeContentType: false },
        );
    },
};
