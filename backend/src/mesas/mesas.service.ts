import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MesasService {
    constructor(private prisma: PrismaService) {}

    async listar(restauranteId: string) {
        const restaurante = await this.prisma.restaurante.findUnique({ where: { id: restauranteId } });
        if (!restaurante) throw new NotFoundException('Restaurante não encontrado');

        return this.prisma.mesa.findMany({
            where: { restauranteId: restaurante.id },
            orderBy: { numero: 'asc' },
        });
    }

    async configurar(total: number, baseUrl: string, restauranteId: string) {
        let baseUrlNormalizado: URL;
        try {
            baseUrlNormalizado = new URL(baseUrl);
        } catch {
            throw new BadRequestException('URL base inválida para geração do QR Code');
        }

        if (!['http:', 'https:'].includes(baseUrlNormalizado.protocol)) {
            throw new BadRequestException('A URL base deve usar http ou https');
        }

        const restaurantePadrao = await this.prisma.restaurante.findUnique({ where: { id: restauranteId } });
        if (!restaurantePadrao) throw new NotFoundException('Restaurante não encontrado');

        await this.prisma.mesa.deleteMany({ where: { restauranteId: restaurantePadrao.id } });

        const payload = Array.from({ length: total }, (_, index) => {
            const numero = index + 1;
            const urlMesa = new URL(baseUrlNormalizado.toString());
            urlMesa.pathname = `/mesa/${numero}`;
            urlMesa.searchParams.set('restauranteId', restauranteId);
            return {
                id: `mesa-${numero}`,
                numero,
                codigoQr: urlMesa.toString(),
                ocupada: false,
                restauranteId: restaurantePadrao.id,
            };
        });

        await this.prisma.mesa.createMany({ data: payload });
        return this.listar(restauranteId);
    }
}
