import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'path';

if (process.env.NODE_ENV === 'test') {
    // Correção: Subir 2 níveis para encontrar o .env.test na raiz do backend
    config({ path: resolve(__dirname, '../../.env.test') });
} else {
    config();
}