import { defineConfig } from '@prisma/client';

const url = process.env.DATABASE_URL;

if (!url) {
    throw new Error('DATABASE_URL não configurado');
}

export default defineConfig({
    datasource: {
        url,
    },
});
