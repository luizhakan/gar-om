export type PlanCode = 'mensal' | 'trimestral' | 'anual' | 'founder';

export interface PlanoInfo {
    durationMonths: number;
    priceCents: number;
    label: string;
}

export const CATALOGO_PLANOS: Record<PlanCode, PlanoInfo> = {
    mensal:     { durationMonths: 1,  priceCents: 10000, label: 'Plano Mensal' },
    trimestral: { durationMonths: 3,  priceCents: 27000, label: 'Plano Trimestral' },
    anual:      { durationMonths: 12, priceCents: 96000, label: 'Plano Anual' },
    founder:    { durationMonths: 12, priceCents: 50000, label: 'Plano Fundador' },
};

export const MAX_FOUNDERS = 10;

export function isValidPlanCode(code: string): code is PlanCode {
    return code in CATALOGO_PLANOS;
}

export function precoEmReais(planCode: PlanCode): number {
    return CATALOGO_PLANOS[planCode].priceCents / 100;
}
