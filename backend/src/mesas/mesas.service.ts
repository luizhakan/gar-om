import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MesasService {
    constructor(private prisma: PrismaService) {}

    async listar(restauranteId?: string) {
        const restaurante = restauranteId
            ? await this.prisma.restaurante.findUnique({ where: { id: restauranteId } })
            : await this.prisma.restaurante.findFirst();
        return this.prisma.mesa.findMany({
            where: restaurante ? { restauranteId: restaurante.id } : undefined,
            orderBy: { numero: 'asc' },
        });
    }

    async configurar(total: number, baseUrl: string, restauranteId?: string) {
        let restaurantePadrao = restauranteId
            ? await this.prisma.restaurante.upsert({
                where: { id: restauranteId },
                update: {},
                create: { id: restauranteId, nome: 'Restaurante Default' },
            })
            : await this.prisma.restaurante.findFirst();

        if (!restaurantePadrao) {
            restaurantePadrao = await this.prisma.restaurante.create({
                data: { id: 'restaurante-default', nome: 'Restaurante Default' },
            });
        }

        await this.prisma.mesa.deleteMany({ where: { restauranteId: restaurantePadrao.id } });

        const payload = Array.from({ length: total }, (_, index) => {
            const numero = index + 1;
            return {
                id: `mesa-${numero}`,
                numero,
                codigoQr: `${baseUrl}/mesa/${numero}`,
                ocupada: false,
                restauranteId: restaurantePadrao.id,
            };
        });

        await this.prisma.mesa.createMany({ data: payload });
        return this.listar();
    }
}
