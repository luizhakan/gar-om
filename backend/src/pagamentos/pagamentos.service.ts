import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoService } from './mercado-pago.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

/**
 * Serviço para gerenciar pagamentos de ASSINATURA DO RESTAURANTE
 * NÃO é para pagamentos de pedidos dos clientes!
 */
@Injectable()
export class PagamentosService {
    private readonly logger = new Logger(PagamentosService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly mercadoPago: MercadoPagoService,
    ) {}

    /**
     * Cria um novo pagamento de assinatura para o restaurante
     */
    async createPayment(createPaymentDto: CreatePaymentDto, restauranteId: string) {
        // Verifica se o restaurante existe
        const restaurante = await this.prisma.restaurante.findUnique({
            where: { id: restauranteId },
        });

        if (!restaurante) {
            throw new NotFoundException('Restaurante não encontrado');
        }

        // Valida campos obrigatórios
        const transactionAmount = createPaymentDto.transaction_amount || createPaymentDto.transactionAmount;
        const paymentMethodId = createPaymentDto.payment_method_id || createPaymentDto.paymentMethodId;

        if (!transactionAmount) {
            throw new BadRequestException('transaction_amount é obrigatório');
        }
        if (!paymentMethodId) {
            throw new BadRequestException('payment_method_id é obrigatório');
        }

        // Gera chave de idempotência única
        const idempotencyKey = randomUUID();

        // URL de notificação (webhook)
        const notificationUrl = process.env.MERCADO_PAGO_WEBHOOK_URL || 
            `${process.env.API_BASE_URL}/webhooks/mercadopago`;

        try {
            // Cria pagamento no Mercado Pago
            const mpPayment = await this.mercadoPago.createPayment({
                transaction_amount: transactionAmount,
                token: createPaymentDto.token,
                description: createPaymentDto.description || `Assinatura - ${restaurante.nome}`,
                installments: createPaymentDto.installments,
                payment_method_id: paymentMethodId,
                payer: createPaymentDto.payer,
                external_reference: createPaymentDto.external_reference || `sub-${restauranteId}`,
                notification_url: notificationUrl,
            }, idempotencyKey);

            // Salva o pagamento no banco
            const pagamento = await this.prisma.pagamento.create({
                data: {
                    restauranteId,
                    mercadoPagoId: mpPayment.id?.toString(),
                    status: this.mapMercadoPagoStatus(mpPayment.status),
                    statusDetail: mpPayment.status_detail,
                    transactionAmount,
                    paymentMethodId,
                    paymentTypeId: mpPayment.payment_type_id,
                    installments: createPaymentDto.installments,
                    externalReference: createPaymentDto.external_reference,
                    description: createPaymentDto.description,
                    payerEmail: createPaymentDto.payer.email,
                    payerIdentification: createPaymentDto.payer.identification ? {
                        type: createPaymentDto.payer.identification.type,
                        number: createPaymentDto.payer.identification.number,
                    } : undefined,
                    cardToken: createPaymentDto.token,
                    idempotencyKey,
                    planDurationMonths: createPaymentDto.planDurationMonths || 1,
                }
            });

            // Se pagamento aprovado, atualiza status da assinatura do restaurante
            if (mpPayment.status === 'approved') {
                await this.updateRestauranteSubscription(restauranteId, createPaymentDto.planDurationMonths || 1);
            }

            this.logger.log(`Pagamento de assinatura criado com sucesso: ${pagamento.id}`);

            return {
                ...pagamento,
                mercadoPagoData: mpPayment,
            };
        } catch (error) {
            this.logger.error('Erro ao processar pagamento', error);
            throw new BadRequestException('Erro ao processar pagamento');
        }
    }

    /**
     * Atualiza a assinatura do restaurante após pagamento aprovado
     */
    private async updateRestauranteSubscription(restauranteId: string, durationMonths: number) {
        const now = new Date();
        const newTrialEndsAt = new Date(now);
        newTrialEndsAt.setMonth(newTrialEndsAt.getMonth() + durationMonths);

        await this.prisma.restaurante.update({
            where: { id: restauranteId },
            data: {
                subscriptionStatus: 'active',
                trialEndsAt: newTrialEndsAt,
                blockedAt: null, // Remove bloqueio se existir
            }
        });

        this.logger.log(`Assinatura do restaurante ${restauranteId} renovada até ${newTrialEndsAt.toISOString()}`);
    }

    /**
     * Busca um pagamento por ID
     */
    async findOne(id: string, restauranteId: string) {
        const pagamento = await this.prisma.pagamento.findFirst({
            where: {
                id,
                restauranteId,
            },
        });

        if (!pagamento) {
            throw new NotFoundException('Pagamento não encontrado');
        }

        return pagamento;
    }

    /**
     * Processa notificação de webhook
     */
    async processWebhook(webhookData: any) {
        try {
            this.logger.log(`Processando webhook: ${JSON.stringify(webhookData)}`);

            // Salva o evento do webhook
            const webhookEvent = await this.prisma.webhookEvent.create({
                data: {
                    eventType: webhookData.type,
                    eventAction: webhookData.action,
                    resourceId: webhookData.data?.id,
                    liveMode: webhookData.live_mode,
                    rawPayload: webhookData,
                }
            });

            // Se for notificação de pagamento, atualiza o status
            if (webhookData.type === 'payment') {
                const paymentId = webhookData.data?.id;

                if (paymentId) {
                    // Busca informações atualizadas do pagamento
                    const mpPayment = await this.mercadoPago.getPayment(paymentId);

                    // Atualiza o pagamento no banco
                    const pagamento = await this.prisma.pagamento.findUnique({
                        where: { mercadoPagoId: paymentId.toString() }
                    });

                    if (pagamento) {
                        await this.prisma.pagamento.update({
                            where: { id: pagamento.id },
                            data: {
                                status: this.mapMercadoPagoStatus(mpPayment.status),
                                statusDetail: mpPayment.status_detail,
                            }
                        });

                        // Vincula o webhook ao pagamento
                        await this.prisma.webhookEvent.update({
                            where: { id: webhookEvent.id },
                            data: {
                                pagamentoId: pagamento.id,
                                processed: true,
                                processedAt: new Date(),
                            }
                        });

                        this.logger.log(`Pagamento ${pagamento.id} atualizado via webhook`);
                    }
                }
            }

            return { success: true };
        } catch (error) {
            this.logger.error('Erro ao processar webhook', error);
            throw error;
        }
    }

    /**
     * Mapeia status do Mercado Pago para o enum do Prisma
     */
    private mapMercadoPagoStatus(status: string | undefined): PaymentStatus {
        const statusMap: Record<string, PaymentStatus> = {
            'pending': PaymentStatus.pending,
            'approved': PaymentStatus.approved,
            'authorized': PaymentStatus.authorized,
            'in_process': PaymentStatus.in_process,
            'in_mediation': PaymentStatus.in_mediation,
            'rejected': PaymentStatus.rejected,
            'cancelled': PaymentStatus.cancelled,
            'refunded': PaymentStatus.refunded,
            'charged_back': PaymentStatus.charged_back,
        };

        return statusMap[status || 'pending'] || PaymentStatus.pending;
    }
}
