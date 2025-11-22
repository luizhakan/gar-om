import type { Request } from 'express';

export function extrairIpCliente(req: Request): string {
    const forwarded = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
    const realIp = (req.headers['x-real-ip'] as string | undefined)?.split(',')[0]?.trim();
    const raw = forwarded || realIp || req.ip || req.socket.remoteAddress || '';
    // Normaliza IPv6 mapeado (ex.: ::ffff:192.168.0.10)
    return raw.replace(/^::ffff:/, '') || 'desconhecido';
}
