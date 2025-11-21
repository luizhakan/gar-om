import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterService {
    constructor(private readonly prisma: PrismaService) {}

    private calcularStatusEfetivo(restaurante: { subscriptionStatus: SubscriptionStatus; trialEndsAt: Date; blockedAt: Date | null }) {
        if (restaurante.blockedAt) return SubscriptionStatus.blocked;
        if (restaurante.subscriptionStatus === SubscriptionStatus.trialing && restaurante.trialEndsAt < new Date()) {
            return SubscriptionStatus.past_due;
        }
        return restaurante.subscriptionStatus;
    }

    private formatarRestaurante(restaurante: Prisma.RestauranteGetPayload<{ include: { admins: { select: { id: true; nome: true; email: true; createdAt: true } } } }>) {
        const agora = new Date();
        const adminPrincipal = restaurante.admins[0];
        const diasTrialRestantes = Math.max(
            0,
            Math.ceil((restaurante.trialEndsAt.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)),
        );

        return {
            id: restaurante.id,
            nome: restaurante.nome,
            createdAt: restaurante.createdAt,
            trialStartedAt: restaurante.trialStartedAt,
            trialEndsAt: restaurante.trialEndsAt,
            diasTrialRestantes,
            subscriptionStatus: restaurante.subscriptionStatus,
            statusEfetivo: this.calcularStatusEfetivo(restaurante),
            planLabel: restaurante.planLabel ?? 'Trial 14 dias',
            billingEmail: restaurante.billingEmail ?? adminPrincipal?.email,
            billingPhone: restaurante.billingPhone,
            mercadoPagoCustomerId: restaurante.mercadoPagoCustomerId,
            mercadoPagoSubscriptionId: restaurante.mercadoPagoSubscriptionId,
            blockedAt: restaurante.blockedAt,
            adminContato: adminPrincipal ?? null,
        };
    }

    async listarRestaurantes() {
        const restaurantes = await this.prisma.restaurante.findMany({
            include: {
                admins: {
                    select: { id: true, nome: true, email: true, createdAt: true },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return restaurantes.map((restaurante) => this.formatarRestaurante(restaurante));
    }

    async atualizarRestaurante(id: string, dto: Prisma.RestauranteUpdateInput) {
        if (Object.keys(dto).length === 0) {
            const existente = await this.prisma.restaurante.findUnique({
                where: { id },
                include: {
                    admins: {
                        select: { id: true, nome: true, email: true, createdAt: true },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            });
            if (!existente) throw new NotFoundException(`Restaurante ${id} não encontrado`);
            return this.formatarRestaurante(existente);
        }
        try {
            const atualizado = await this.prisma.restaurante.update({
                where: { id },
                data: dto,
                include: {
                    admins: {
                        select: { id: true, nome: true, email: true, createdAt: true },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            });
            return this.formatarRestaurante(atualizado);
        } catch (erro) {
            throw new NotFoundException(`Restaurante ${id} não encontrado`);
        }
    }

    normalizarAtualizacaoAssinatura(dto: {
        subscriptionStatus?: SubscriptionStatus;
        trialEndsAt?: string;
        planLabel?: string;
        mercadoPagoCustomerId?: string;
        mercadoPagoSubscriptionId?: string;
        billingEmail?: string;
        billingPhone?: string;
        blocked?: boolean;
    }): Prisma.RestauranteUpdateInput {
        const data: Prisma.RestauranteUpdateInput = {};
        if (dto.subscriptionStatus !== undefined) {
            data.subscriptionStatus = dto.subscriptionStatus;
        }
        if (dto.trialEndsAt !== undefined) {
            data.trialEndsAt = new Date(dto.trialEndsAt);
        }
        if (dto.planLabel !== undefined) {
            data.planLabel = dto.planLabel;
        }
        if (dto.mercadoPagoCustomerId !== undefined) {
            data.mercadoPagoCustomerId = dto.mercadoPagoCustomerId;
        }
        if (dto.mercadoPagoSubscriptionId !== undefined) {
            data.mercadoPagoSubscriptionId = dto.mercadoPagoSubscriptionId;
        }
        if (dto.billingEmail !== undefined) {
            data.billingEmail = dto.billingEmail;
        }
        if (dto.billingPhone !== undefined) {
            data.billingPhone = dto.billingPhone;
        }
        if (dto.blocked !== undefined) {
            data.blockedAt = dto.blocked ? new Date() : null;
            if (dto.blocked) {
                data.subscriptionStatus = SubscriptionStatus.blocked;
            } else if (dto.subscriptionStatus === undefined) {
                data.subscriptionStatus = SubscriptionStatus.past_due;
            }
        }
        return data;
    }
}
