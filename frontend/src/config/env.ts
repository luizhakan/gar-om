const base = import.meta.env.VITE_API_URL as string | undefined;

export const env = {
    apiBaseUrl: base ?? 'http://localhost:3001',
};
