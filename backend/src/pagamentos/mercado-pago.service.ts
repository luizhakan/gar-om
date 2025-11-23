import { Injectable, Logger } from '@nestjs/common';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

@Injectable()
export class MercadoPagoService {
    private readonly logger = new Logger(MercadoPagoService.name);
    private client: MercadoPagoConfig;
    private payment: Payment;
    private preference: Preference;

    constructor() {
        const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
        
        if (!accessToken) {
            this.logger.warn('MERCADO_PAGO_ACCESS_TOKEN não configurado');
        }

        this.client = new MercadoPagoConfig({ 
            accessToken: accessToken || '',
            options: {
                timeout: 5000,
            }
        });
        
        this.payment = new Payment(this.client);
        this.preference = new Preference(this.client);
    }

    /**
     * Cria um pagamento no Mercado Pago
     */
    async createPayment(data: {
        transaction_amount: number;
        token: string;
        description: string;
        installments: number;
        payment_method_id: string;
        payer: {
            email: string;
            identification?: {
                type: string;
                number: string;
            };
        };
        external_reference?: string;
        notification_url?: string;
    }, idempotencyKey: string) {
        try {
            this.logger.log(`Criando pagamento: ${JSON.stringify(data)}`);
            
            const response = await this.payment.create({
                body: data,
                requestOptions: {
                    idempotencyKey,
                }
            });

            this.logger.log(`Pagamento criado com sucesso: ${response.id}`);
            return response;
        } catch (error) {
            this.logger.error('Erro ao criar pagamento no Mercado Pago', error);
            throw error;
        }
    }

    /**
     * Busca informações de um pagamento
     */
    async getPayment(paymentId: string) {
        try {
            const response = await this.payment.get({ id: paymentId });
            return response;
        } catch (error) {
            this.logger.error(`Erro ao buscar pagamento ${paymentId}`, error);
            throw error;
        }
    }

    /**
     * Cria uma preference de checkout para aceitar múltiplos meios de pagamento (incluindo PIX)
     */
    async createPreference(data: {
        items: Array<{
            id?: string;
            title: string;
            description?: string;
            quantity: number;
            unit_price: number;
        }>;
        payer?: {
            email: string;
            name?: string;
            identification?: {
                type: string;
                number: string;
            };
        };
        external_reference?: string;
        notification_url?: string;
        back_urls?: {
            success?: string;
            failure?: string;
            pending?: string;
        };
        auto_return?: 'approved' | 'all';
        payment_methods?: {
            excluded_payment_types?: Array<{ id: string }>;
            installments?: number;
        };
    }) {
        try {
            this.logger.log(`Criando preference: ${JSON.stringify(data)}`);
            
            // Adiciona ID ao item se não existir
            const itemsComId = data.items.map((item, index) => ({
                ...item,
                id: item.id || `item-${index + 1}`,
            }));

            const response = await this.preference.create({
                body: {
                    ...data,
                    items: itemsComId,
                },
            });

            this.logger.log(`Preference criada com sucesso: ${response.id}`);
            return response;
        } catch (error) {
            this.logger.error('Erro ao criar preference no Mercado Pago', error);
            throw error;
        }
    }

    /**
     * Valida a assinatura do webhook
     */
    validateWebhookSignature(
        xSignature: string, 
        xRequestId: string, 
        dataId: string
    ): boolean {
        const secretKey = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
        
        if (!secretKey) {
            this.logger.warn('MERCADO_PAGO_WEBHOOK_SECRET não configurado');
            return false;
        }

        try {
            // Extrai ts e hash da x-signature
            const parts = xSignature.split(',');
            let ts: string | null = null;
            let hash: string | null = null;

            for (const part of parts) {
                const [key, value] = part.split('=');
                if (key?.trim() === 'ts') {
                    ts = value?.trim();
                } else if (key?.trim() === 'v1') {
                    hash = value?.trim();
                }
            }

            if (!ts || !hash) {
                this.logger.warn('Assinatura inválida: ts ou hash não encontrado');
                return false;
            }

            // Gera o manifest
            const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

            // Calcula HMAC SHA256
            const crypto = require('crypto');
            const calculatedHash = crypto
                .createHmac('sha256', secretKey)
                .update(manifest)
                .digest('hex');

            const isValid = calculatedHash === hash;
            
            if (!isValid) {
                this.logger.warn('Assinatura do webhook inválida');
            }

            return isValid;
        } catch (error) {
            this.logger.error('Erro ao validar assinatura do webhook', error);
            return false;
        }
    }
}
