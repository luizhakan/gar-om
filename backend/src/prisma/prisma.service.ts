import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        const datasourceUrl = process.env.DATABASE_URL;
        if (!datasourceUrl) {
            throw new Error('DATABASE_URL não configurado');
        }

        super({
            datasourceUrl,
        });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
