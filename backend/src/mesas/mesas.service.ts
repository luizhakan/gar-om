import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MesasService {
    constructor(private prisma: PrismaService) {}

    listar() {
        return this.prisma.mesa.findMany({
            orderBy: { numero: 'asc' },
        });
    }

    async configurar(total: number, baseUrl: string) {
        await this.prisma.mesa.deleteMany();

        const payload = Array.from({ length: total }, (_, index) => {
            const numero = index + 1;
            return {
                id: `mesa-${numero}`,
                numero,
                codigoQr: `${baseUrl}/mesa/${numero}`,
                ocupada: false,
            };
        });

        await this.prisma.mesa.createMany({ data: payload });
        return this.listar();
    }
}
