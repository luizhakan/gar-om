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
     * Cria uma preference de checkout do Mercado Pago (aceita PIX, boleto, cartão, etc)
     */
    async createCheckoutPreference(restauranteId: string, planDurationMonths: number = 1) {
        // Verifica se o restaurante existe
        const restaurante = await this.prisma.restaurante.findUnique({
            where: { id: restauranteId },
        });

        if (!restaurante) {
            throw new NotFoundException('Restaurante não encontrado');
        }

        // Valor baseado na duração do plano
        const valorMensal = 1.00;
        let valorTotal = valorMensal * planDurationMonths;
        // Aplica descontos: 20% para 12 meses, 10% para 3 meses
        let desconto = 0;
        if (planDurationMonths === 12) {
            desconto = 0.20;
        } else if (planDurationMonths === 3) {
            desconto = 0.10;
        }
        if (desconto > 0) {
            valorTotal = Number((valorTotal * (1 - desconto)).toFixed(2));
        }

        // URL de notificação (webhook)
        const notificationUrl = process.env.MERCADO_PAGO_WEBHOOK_URL || 
            `${process.env.API_BASE_URL}/webhooks/mercadopago`;

        // URLs de retorno
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        try {
            // Cria preference no Mercado Pago
            const preference = await this.mercadoPago.createPreference({
                items: [
                    {
                        title: `Assinatura Garçom - ${planDurationMonths} ${planDurationMonths === 1 ? 'mês' : 'meses'}`,
                        description: `Assinatura do sistema Garçom para ${restaurante.nome}`,
                        quantity: 1,
                        unit_price: valorTotal,
                    }
                ],
                payer: {
                    email: restaurante.billingEmail || 'teste@teste.com',
                    name: restaurante.nome,
                },
                external_reference: `sub-${restauranteId}-${Date.now()}`,
                notification_url: notificationUrl,
                back_urls: {
                    success: `${frontendUrl}/admin/assinatura?status=success`,
                    failure: `${frontendUrl}/admin/assinatura?status=failure`,
                    pending: `${frontendUrl}/admin/assinatura?status=pending`,
                },
                payment_methods: {
                    installments: planDurationMonths,
                },
            });

            this.logger.log(`Preference criada: ${preference.id} para restaurante ${restauranteId}`);

            return {
                preferenceId: preference.id,
                initPoint: preference.init_point,
                sandboxInitPoint: preference.sandbox_init_point,
            };
        } catch (error) {
            this.logger.error('Erro ao criar preference', error);
            throw new BadRequestException('Erro ao criar checkout');
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
                    this.logger.log(`Processando pagamento ID: ${paymentId}`);
                    
                    // Busca informações atualizadas do pagamento
                    const mpPayment = await this.mercadoPago.getPayment(paymentId);
                    this.logger.log(`Dados do pagamento MP: ${JSON.stringify(mpPayment)}`);

                    // Busca o pagamento no banco
                    let pagamento = await this.prisma.pagamento.findUnique({
                        where: { mercadoPagoId: paymentId.toString() }
                    });

                    if (pagamento) {
                        this.logger.log(`Pagamento encontrado no banco: ${pagamento.id}`);
                    } else {
                        this.logger.log(`Pagamento não encontrado no banco. External reference: ${mpPayment.external_reference}`);
                    }

                    // Se não existe pagamento salvo, cria um novo (caso seja do checkout)
                    if (!pagamento && mpPayment.external_reference) {
                        // Extrai o restauranteId da external_reference (formato: sub-{restauranteId}-{timestamp})
                        // UUID tem formato: 8-4-4-4-12 caracteres hexadecimais
                        const match = mpPayment.external_reference.match(/^sub-([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/);
                        if (match) {
                            const restauranteId = match[1];
                            this.logger.log(`RestauranteId extraído: ${restauranteId}`);
                            
                            // Verifica se o restaurante existe
                            const restauranteExiste = await this.prisma.restaurante.findUnique({
                                where: { id: restauranteId }
                            });

                            if (!restauranteExiste) {
                                this.logger.warn(`Restaurante ${restauranteId} não encontrado. Ignorando webhook.`);
                                return { success: true, message: 'Restaurante não encontrado' };
                            }
                            
                            // Cria o pagamento no banco
                            pagamento = await this.prisma.pagamento.create({
                                data: {
                                    restauranteId,
                                    mercadoPagoId: paymentId.toString(),
                                    status: this.mapMercadoPagoStatus(mpPayment.status),
                                    statusDetail: mpPayment.status_detail,
                                    transactionAmount: mpPayment.transaction_amount || 0,
                                    paymentMethodId: mpPayment.payment_method_id,
                                    paymentTypeId: mpPayment.payment_type_id,
                                    externalReference: mpPayment.external_reference,
                                    description: mpPayment.description,
                                    payerEmail: mpPayment.payer?.email,
                                    payerIdentification: mpPayment.payer?.identification ? {
                                        type: mpPayment.payer.identification.type,
                                        number: mpPayment.payer.identification.number,
                                    } : undefined,
                                    idempotencyKey: `webhook-${paymentId}`,
                                    planDurationMonths: 1,
                                }
                            });

                            this.logger.log(`Pagamento criado via webhook: ${pagamento.id}`);
                        }
                    }

                    if (pagamento) {
                        // Atualiza o status do pagamento
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

                        // Se pagamento aprovado, atualiza a assinatura
                        if (mpPayment.status === 'approved') {
                            await this.updateRestauranteSubscription(
                                pagamento.restauranteId, 
                                pagamento.planDurationMonths
                            );
                        }

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
