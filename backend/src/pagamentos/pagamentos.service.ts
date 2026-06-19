import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoService } from './mercado-pago.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PlanCode, CATALOGO_PLANOS, MAX_FOUNDERS, isValidPlanCode, precoEmReais } from './planos';

@Injectable()
export class PagamentosService {
    private readonly logger = new Logger(PagamentosService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly mercadoPago: MercadoPagoService,
    ) {}

    private async contarFundadores(): Promise<number> {
        return this.prisma.restaurante.count({
            where: { foundingMemberAt: { not: null } },
        });
    }

    private async verificarElegibilidadeFundador(restauranteId: string): Promise<void> {
        const restaurante = await this.prisma.restaurante.findUnique({
            where: { id: restauranteId },
        });

        if (!restaurante) throw new NotFoundException('Restaurante não encontrado');

        const agora = new Date();

        if (restaurante.subscriptionStatus !== 'trialing') {
            throw new ForbiddenException('Plano Fundador disponível apenas durante o trial');
        }
        if (restaurante.trialEndsAt <= agora) {
            throw new ForbiddenException('Trial expirado — Plano Fundador não está mais disponível para este restaurante');
        }
        if (restaurante.foundingMemberAt !== null) {
            throw new ForbiddenException('Este restaurante já utilizou o Plano Fundador');
        }

        const totalFundadores = await this.contarFundadores();
        if (totalFundadores >= MAX_FOUNDERS) {
            throw new ForbiddenException('Todas as vagas do Plano Fundador já foram preenchidas');
        }
    }

    /**
     * Adiciona meses a uma data de forma cumulativa:
     * max(agora, trialEndsAt) + durationMonths
     */
    private calcularNovaExpiracao(trialEndsAt: Date, durationMonths: number): Date {
        const agora = new Date();
        const base = trialEndsAt > agora ? trialEndsAt : agora;
        const nova = new Date(base);
        nova.setMonth(nova.getMonth() + durationMonths);
        return nova;
    }

    /**
     * Cria preferência de checkout (PIX, boleto, cartão)
     * POST /pagamentos/checkout
     */
    async createCheckoutPreference(restauranteId: string, planCode: PlanCode) {
        if (!isValidPlanCode(planCode)) {
            throw new BadRequestException(`planCode inválido: ${planCode}`);
        }

        const restaurante = await this.prisma.restaurante.findUnique({
            where: { id: restauranteId },
        });
        if (!restaurante) throw new NotFoundException('Restaurante não encontrado');

        if (planCode === 'founder') {
            await this.verificarElegibilidadeFundador(restauranteId);
        }

        const plano = CATALOGO_PLANOS[planCode];
        const valorTotal = precoEmReais(planCode);
        const ts = Date.now();
        const externalReference = `sub-${restauranteId}-${planCode}-${ts}`;

        const notificationUrl =
            process.env.MERCADO_PAGO_WEBHOOK_URL ||
            `${process.env.API_BASE_URL}/webhooks/mercadopago`;

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        try {
            const preference = await this.mercadoPago.createPreference({
                items: [
                    {
                        title: plano.label,
                        description: `${plano.label} — ${restaurante.nome}`,
                        quantity: 1,
                        unit_price: valorTotal,
                    },
                ],
                payer: {
                    email: restaurante.billingEmail || 'pagador@garcomagil.com',
                    name: restaurante.nome,
                },
                external_reference: externalReference,
                notification_url: notificationUrl,
                back_urls: {
                    success: `${frontendUrl}/admin/assinatura?status=success`,
                    failure: `${frontendUrl}/admin/assinatura?status=failure`,
                    pending: `${frontendUrl}/admin/assinatura?status=pending`,
                },
            });

            this.logger.log(`Preference criada: ${preference.id} | restaurante=${restauranteId} | plano=${planCode}`);

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
     * Cria pagamento direto com cartão (rota legada)
     * O preço é sempre calculado no backend a partir do planCode — nunca do cliente.
     */
    async createPayment(createPaymentDto: CreatePaymentDto, restauranteId: string) {
        const restaurante = await this.prisma.restaurante.findUnique({
            where: { id: restauranteId },
        });
        if (!restaurante) throw new NotFoundException('Restaurante não encontrado');

        const planCode = (createPaymentDto.planCode as PlanCode) || 'mensal';
        if (!isValidPlanCode(planCode)) {
            throw new BadRequestException(`planCode inválido: ${planCode}`);
        }

        if (planCode === 'founder') {
            await this.verificarElegibilidadeFundador(restauranteId);
        }

        const paymentMethodId = createPaymentDto.payment_method_id || createPaymentDto.paymentMethodId;
        if (!paymentMethodId) throw new BadRequestException('payment_method_id é obrigatório');

        const valorTotal = precoEmReais(planCode);
        const plano = CATALOGO_PLANOS[planCode];
        const idempotencyKey = randomUUID();

        const notificationUrl =
            process.env.MERCADO_PAGO_WEBHOOK_URL ||
            `${process.env.API_BASE_URL}/webhooks/mercadopago`;

        try {
            const mpPayment = await this.mercadoPago.createPayment({
                transaction_amount: valorTotal,
                token: createPaymentDto.token,
                description: plano.label,
                installments: createPaymentDto.installments,
                payment_method_id: paymentMethodId,
                payer: createPaymentDto.payer,
                external_reference: `sub-${restauranteId}-${planCode}-${Date.now()}`,
                notification_url: notificationUrl,
            }, idempotencyKey);

            const pagamento = await this.prisma.pagamento.create({
                data: {
                    restauranteId,
                    mercadoPagoId: mpPayment.id?.toString(),
                    status: this.mapMercadoPagoStatus(mpPayment.status),
                    statusDetail: mpPayment.status_detail,
                    transactionAmount: valorTotal,
                    paymentMethodId,
                    paymentTypeId: mpPayment.payment_type_id,
                    installments: createPaymentDto.installments,
                    externalReference: `sub-${restauranteId}-${planCode}-${Date.now()}`,
                    description: plano.label,
                    payerEmail: createPaymentDto.payer.email,
                    payerIdentification: createPaymentDto.payer.identification
                        ? {
                              type: createPaymentDto.payer.identification.type,
                              number: createPaymentDto.payer.identification.number,
                          }
                        : undefined,
                    cardToken: createPaymentDto.token,
                    idempotencyKey,
                    planDurationMonths: plano.durationMonths,
                    planCode,
                },
            });

            if (mpPayment.status === 'approved') {
                await this.updateRestauranteSubscription(restauranteId, planCode);
            }

            this.logger.log(`Pagamento criado: ${pagamento.id} | plano=${planCode}`);

            return { ...pagamento, mercadoPagoData: mpPayment };
        } catch (error) {
            this.logger.error('Erro ao processar pagamento', error);
            throw new BadRequestException('Erro ao processar pagamento');
        }
    }

    /**
     * Atualiza a assinatura do restaurante após pagamento aprovado (tempo cumulativo)
     */
    private async updateRestauranteSubscription(restauranteId: string, planCode: PlanCode) {
        const plano = CATALOGO_PLANOS[planCode];

        const restaurante = await this.prisma.restaurante.findUnique({
            where: { id: restauranteId },
        });
        if (!restaurante) return;

        const novaExpiracao = this.calcularNovaExpiracao(restaurante.trialEndsAt, plano.durationMonths);

        const dadosExtra: Record<string, unknown> = {};

        if (planCode === 'founder') {
            const totalFundadores = await this.contarFundadores();
            if (totalFundadores >= MAX_FOUNDERS) {
                this.logger.warn(`Vaga de fundador esgotada no momento da aprovação — restaurante=${restauranteId}`);
                throw new ForbiddenException('Todas as vagas do Plano Fundador foram preenchidas');
            }
            dadosExtra.foundingMemberAt = new Date();
            dadosExtra.foundingNumber = totalFundadores + 1;
        }

        await this.prisma.restaurante.update({
            where: { id: restauranteId },
            data: {
                subscriptionStatus: 'active',
                trialEndsAt: novaExpiracao,
                planLabel: plano.label,
                blockedAt: null,
                ...dadosExtra,
            },
        });

        this.logger.log(
            `Assinatura atualizada: restaurante=${restauranteId} | plano=${planCode} | expira=${novaExpiracao.toISOString()}`,
        );
    }

    /**
     * Retorna elegibilidade e vagas restantes do Plano Fundador
     * GET /pagamentos/vagas-fundador
     */
    async vagasFundador(restauranteId: string): Promise<{ elegivel: boolean; vagasRestantes: number }> {
        const restaurante = await this.prisma.restaurante.findUnique({
            where: { id: restauranteId },
        });
        if (!restaurante) throw new NotFoundException('Restaurante não encontrado');

        const totalFundadores = await this.contarFundadores();
        const vagasRestantes = Math.max(0, MAX_FOUNDERS - totalFundadores);
        const agora = new Date();

        const elegivel =
            restaurante.subscriptionStatus === 'trialing' &&
            restaurante.trialEndsAt > agora &&
            restaurante.foundingMemberAt === null &&
            vagasRestantes > 0;

        return { elegivel, vagasRestantes };
    }

    async findOne(id: string, restauranteId: string) {
        const pagamento = await this.prisma.pagamento.findFirst({
            where: { id, restauranteId },
        });
        if (!pagamento) throw new NotFoundException('Pagamento não encontrado');
        return pagamento;
    }

    /**
     * Processa notificação de webhook do Mercado Pago
     */
    async processWebhook(webhookData: any) {
        try {
            this.logger.log(`Processando webhook: ${JSON.stringify(webhookData)}`);

            const webhookEvent = await this.prisma.webhookEvent.create({
                data: {
                    eventType: webhookData.type,
                    eventAction: webhookData.action,
                    resourceId: webhookData.data?.id,
                    liveMode: webhookData.live_mode,
                    rawPayload: webhookData,
                },
            });

            if (webhookData.type === 'payment') {
                const paymentId = webhookData.data?.id;

                if (paymentId) {
                    this.logger.log(`Processando pagamento ID: ${paymentId}`);

                    const mpPayment = await this.mercadoPago.getPayment(paymentId);
                    this.logger.log(`Dados MP: ${JSON.stringify(mpPayment)}`);

                    let pagamento = await this.prisma.pagamento.findUnique({
                        where: { mercadoPagoId: paymentId.toString() },
                    });

                    if (!pagamento && mpPayment.external_reference) {
                        // Formato novo: sub-{UUID}-{planCode}-{ts}
                        // Formato legado: sub-{UUID} ou sub-{UUID}-{ts}
                        const uuidPattern = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';
                        const matchNovo = mpPayment.external_reference.match(
                            new RegExp(`^sub-(${uuidPattern})-([a-z]+)-\\d+$`),
                        );
                        const matchLegado = mpPayment.external_reference.match(
                            new RegExp(`^sub-(${uuidPattern})`),
                        );

                        const restauranteId = matchNovo ? matchNovo[1] : matchLegado ? matchLegado[1] : null;
                        const planCodeRaw = matchNovo ? matchNovo[2] : 'mensal';
                        const planCode: PlanCode = isValidPlanCode(planCodeRaw) ? planCodeRaw : 'mensal';

                        if (restauranteId) {
                            const restauranteExiste = await this.prisma.restaurante.findUnique({
                                where: { id: restauranteId },
                            });
                            if (!restauranteExiste) {
                                this.logger.warn(`Restaurante ${restauranteId} não encontrado`);
                                return { success: true };
                            }

                            const plano = CATALOGO_PLANOS[planCode];

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
                                    payerIdentification: mpPayment.payer?.identification
                                        ? {
                                              type: mpPayment.payer.identification.type,
                                              number: mpPayment.payer.identification.number,
                                          }
                                        : undefined,
                                    idempotencyKey: `webhook-${paymentId}`,
                                    planDurationMonths: plano.durationMonths,
                                    planCode,
                                },
                            });
                            this.logger.log(`Pagamento criado via webhook: ${pagamento.id} | plano=${planCode}`);
                        }
                    }

                    if (pagamento) {
                        await this.prisma.pagamento.update({
                            where: { id: pagamento.id },
                            data: {
                                status: this.mapMercadoPagoStatus(mpPayment.status),
                                statusDetail: mpPayment.status_detail,
                            },
                        });

                        await this.prisma.webhookEvent.update({
                            where: { id: webhookEvent.id },
                            data: {
                                pagamentoId: pagamento.id,
                                processed: true,
                                processedAt: new Date(),
                            },
                        });

                        if (mpPayment.status === 'approved') {
                            const planCode = (pagamento.planCode as PlanCode) ||
                                this.durationToLegacyPlanCode(pagamento.planDurationMonths);

                            await this.updateRestauranteSubscription(
                                pagamento.restauranteId,
                                planCode,
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

    /** Compatibilidade: converte duração legada em planCode */
    private durationToLegacyPlanCode(months: number): PlanCode {
        if (months >= 12) return 'anual';
        if (months >= 3) return 'trimestral';
        return 'mensal';
    }

    private mapMercadoPagoStatus(status: string | undefined): PaymentStatus {
        const statusMap: Record<string, PaymentStatus> = {
            pending: PaymentStatus.pending,
            approved: PaymentStatus.approved,
            authorized: PaymentStatus.authorized,
            in_process: PaymentStatus.in_process,
            in_mediation: PaymentStatus.in_mediation,
            rejected: PaymentStatus.rejected,
            cancelled: PaymentStatus.cancelled,
            refunded: PaymentStatus.refunded,
            charged_back: PaymentStatus.charged_back,
        };
        return statusMap[status || 'pending'] || PaymentStatus.pending;
    }
}
