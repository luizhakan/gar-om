export type PlanCode = 'mensal' | 'trimestral' | 'anual' | 'founder';

export interface PlanoInfo {
    durationMonths: number;
    priceCents: number;
    label: string;
    storageLimitMb: number;
}

export const CATALOGO_PLANOS: Record<PlanCode, PlanoInfo> = {
    mensal:     { durationMonths: 1,  priceCents: 10000, label: 'Plano Mensal',     storageLimitMb: 500 },
    trimestral: { durationMonths: 3,  priceCents: 27000, label: 'Plano Trimestral', storageLimitMb: 1024 },
    anual:      { durationMonths: 12, priceCents: 96000, label: 'Plano Anual',      storageLimitMb: 5120 },
    founder:    { durationMonths: 12, priceCents: 50000, label: 'Plano Fundador',   storageLimitMb: 5120 },
};

export const TRIAL_STORAGE_LIMIT_MB = 100;

export function getStorageLimitBytes(planCode: string | null, subscriptionStatus: string): bigint {
    const MB = 1024n * 1024n;
    if (subscriptionStatus === 'active' && planCode && isValidPlanCode(planCode)) {
        return BigInt(CATALOGO_PLANOS[planCode].storageLimitMb) * MB;
    }
    return BigInt(TRIAL_STORAGE_LIMIT_MB) * MB;
}

export const MAX_FOUNDERS = 10;

export function isValidPlanCode(code: string): code is PlanCode {
    return code in CATALOGO_PLANOS;
}

export function precoEmReais(planCode: PlanCode): number {
    return CATALOGO_PLANOS[planCode].priceCents / 100;
}
