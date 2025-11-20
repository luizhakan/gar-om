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

    async adicionar(numero: number, baseUrl: string, restauranteId: string) {
        let baseUrlNormalizado: URL;
        try {
            baseUrlNormalizado = new URL(baseUrl);
        } catch {
            throw new BadRequestException('URL base inválida para geração do QR Code');
        }

        if (!['http:', 'https:'].includes(baseUrlNormalizado.protocol)) {
            throw new BadRequestException('A URL base deve usar http ou https');
        }

        const restaurante = await this.prisma.restaurante.findUnique({ where: { id: restauranteId } });
        if (!restaurante) throw new NotFoundException('Restaurante não encontrado');
        
        const mesaExistente = await this.prisma.mesa.findFirst({
            where: { numero, restauranteId },
        });

        if (mesaExistente) {
            throw new BadRequestException(`A mesa com número ${numero} já existe neste restaurante.`);
        }

        const urlMesa = new URL(baseUrlNormalizado.toString());
        urlMesa.pathname = `/mesa/${numero}`;
        urlMesa.searchParams.set('restauranteId', restauranteId);

        return this.prisma.mesa.create({
            data: {
                numero,
                codigoQr: urlMesa.toString(),
                ocupada: false,
                restauranteId: restaurante.id,
            }
        });
    }

    async configurar(quantidade: number, baseUrl: string, restauranteId: string) {
        let baseUrlNormalizado: URL;
        try {
            baseUrlNormalizado = new URL(baseUrl);
        } catch {
            throw new BadRequestException('URL base inválida para geração do QR Code');
        }

        if (!['http:', 'https:'].includes(baseUrlNormalizado.protocol)) {
            throw new BadRequestException('A URL base deve usar http ou https');
        }

        const restaurante = await this.prisma.restaurante.findUnique({ where: { id: restauranteId } });
        if (!restaurante) throw new NotFoundException('Restaurante não encontrado');

        await this.prisma.mesa.deleteMany({ where: { restauranteId } });

        const mesas = Array.from({ length: quantidade }, (_, idx) => {
            const numero = idx + 1;
            const urlMesa = new URL(baseUrlNormalizado.toString());
            urlMesa.pathname = `/mesa/${numero}`;
            urlMesa.searchParams.set('restauranteId', restauranteId);
            return {
                numero,
                codigoQr: urlMesa.toString(),
                ocupada: false,
                restauranteId,
            };
        });

        if (mesas.length) {
            await this.prisma.mesa.createMany({ data: mesas });
        }

        return this.prisma.mesa.findMany({
            where: { restauranteId },
            orderBy: { numero: 'asc' },
        });
    }

    async excluir(id: string, restauranteId: string) {
        const mesa = await this.prisma.mesa.findFirst({
            where: { id, restauranteId },
        });

        if (!mesa) {
            throw new NotFoundException('Mesa não encontrada ou não pertence a este restaurante.');
        }

        await this.prisma.mesa.delete({ where: { id } });
    }
}
