// Lista centralizada de origens permitidas a acessar o backend (HTTP e WebSocket)
export const corsWhitelist: string[] = [
    // Produção
    'https://garcomagil.com',
    'https://www.garcomagil.com',
    // Desenvolvimento local (Vite e similares)
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];