import { defineConfig } from '@prisma/client';

const url = process.env.DATABASE_URL ?? 'postgresql://admin:admin@localhost:5432/garcom';

export default defineConfig({
    datasource: {
        url,
    },
});
