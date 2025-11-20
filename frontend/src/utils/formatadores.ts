/**
 * Formata um número para o padrão de moeda Real Brasileiro (BRL).
 * @param valor Valor numérico a ser formatado
 * @returns String formatada (ex: R$ 10,00)
 */
export function formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

/**
 * Gera um ID aleatório curto (útil para testes ou chaves temporárias).
 */
export function gerarIdAleatorio(): string {
    return Math.random().toString(36).substring(2, 9);
}

/**
 * Formata uma data ISO para formato brasileiro.
 * @param dataISO String de data no formato ISO
 * @returns String formatada (ex: 19/11/2025 17:30)
 */
export function formatarData(dataISO: string): string {
    const data = new Date(dataISO);
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(data);
}

/**
 * Calcula o tempo decorrido desde uma data até agora.
 * @param dataISO String de data no formato ISO
 * @returns String descritiva (ex: "há 5 minutos")
 */
export function calcularTempoDecorrido(dataISO: string): string {
    const agora = new Date();
    const data = new Date(dataISO);
    const diferencaMs = agora.getTime() - data.getTime();
    const minutos = Math.floor(diferencaMs / 60000);

    if (minutos < 1) return 'agora mesmo';
    if (minutos === 1) return 'há 1 minuto';
    if (minutos < 60) return `há ${String(minutos)} minutos`;

    const horas = Math.floor(minutos / 60);
    if (horas === 1) return 'há 1 hora';
    return `há ${String(horas)} horas`;
}
