import { CanActivate, ExecutionContext, Injectable, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const SKIP_SUBSCRIPTION_CHECK = 'skipSubscriptionCheck';

export const SkipSubscriptionCheck = () => SetMetadata(SKIP_SUBSCRIPTION_CHECK, true);

@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(
        private prisma: PrismaService,
        private reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Verifica se a rota deve pular a verificação de assinatura
        const skipCheck = this.reflector.getAllAndOverride<boolean>(SKIP_SUBSCRIPTION_CHECK, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (skipCheck) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Usuário não autenticado');
        }

        // Master users não são bloqueados
        if (user.role === 'master') {
            return true;
        }

        // Busca o restaurante
        const restauranteId = user.restauranteId;
        if (!restauranteId) {
            throw new ForbiddenException('Restaurante não identificado');
        }

        const restaurante = await this.prisma.restaurante.findUnique({
            where: { id: restauranteId },
            select: { subscriptionStatus: true, trialEndsAt: true },
        });

        if (!restaurante) {
            throw new ForbiddenException('Restaurante não encontrado');
        }

        // Verifica se o status é permitido
        const statusPermitidos: SubscriptionStatus[] = [
            SubscriptionStatus.trialing,
            SubscriptionStatus.active,
        ];

        // Se o status está em trialing, verifica se não expirou
        if (restaurante.subscriptionStatus === SubscriptionStatus.trialing) {
            const agora = new Date();
            if (restaurante.trialEndsAt < agora) {
                throw new ForbiddenException(
                    'Período de trial expirado. Renove sua assinatura para continuar usando o sistema.'
                );
            }
        }

        // Verifica se o status está permitido
        if (!statusPermitidos.includes(restaurante.subscriptionStatus)) {
            throw new ForbiddenException(
                'Assinatura inválida. Renove sua assinatura para continuar usando o sistema.'
            );
        }

        return true;
    }
}
