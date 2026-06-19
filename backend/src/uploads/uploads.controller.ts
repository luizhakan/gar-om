import {
    Controller,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors,
    BadRequestException,
    PayloadTooLargeException,
    ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { AuthGuard, Roles } from '../auth/auth.guard';
import { SubscriptionGuard } from '../auth/subscription.guard';
import { UsuarioAutenticado } from '../auth/auth-user.decorator';
import type { AuthTokenPayload } from '../auth/token.util';
import { PrismaService } from '../prisma/prisma.service';
import { getStorageLimitBytes } from '../pagamentos/planos';

export const UPLOADS_ROOT = join(__dirname, '..', '..', '..', 'uploads');

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB por arquivo

const storage = diskStorage({
    destination: (req, _file, cb) => {
        const user = (req as any).user as AuthTokenPayload;
        const dir = join(UPLOADS_ROOT, user.restauranteId);
        mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `${randomUUID()}${ext}`);
    },
});

@Controller('uploads')
@UseGuards(AuthGuard, SubscriptionGuard)
@Roles('admin')
export class UploadsController {
    constructor(private readonly prisma: PrismaService) {}

    @Post('imagem')
    @UseInterceptors(
        FileInterceptor('arquivo', {
            storage,
            limits: { fileSize: MAX_FILE_BYTES },
            fileFilter: (_req, file, cb) => {
                if (!ALLOWED_MIMES.includes(file.mimetype)) {
                    return cb(new BadRequestException('Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.'), false);
                }
                cb(null, true);
            },
        }),
    )
    async uploadImagem(
        @UploadedFile() arquivo: Express.Multer.File,
        @UsuarioAutenticado() usuario: AuthTokenPayload,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ) {
        if (!arquivo) throw new BadRequestException('Nenhum arquivo enviado');

        const restaurante = await this.prisma.restaurante.findUnique({
            where: { id: usuario.restauranteId },
            select: { storageUsedBytes: true, planCode: true, subscriptionStatus: true },
        });
        if (!restaurante) throw new BadRequestException('Restaurante não encontrado');

        const limite = getStorageLimitBytes(restaurante.planCode, restaurante.subscriptionStatus);
        const usado = BigInt(restaurante.storageUsedBytes);
        const tamanho = BigInt(arquivo.size);

        if (usado + tamanho > limite) {
            throw new ForbiddenException(
                `Limite de armazenamento atingido. Você usa ${formatMb(usado)} de ${formatMb(limite)} disponíveis.`,
            );
        }

        await this.prisma.restaurante.update({
            where: { id: usuario.restauranteId },
            data: { storageUsedBytes: { increment: tamanho } },
        });

        const url = `${process.env.API_URL ?? 'http://localhost:3001'}/uploads/${usuario.restauranteId}/${arquivo.filename}`;

        return {
            url,
            storageUsedBytes: String(usado + tamanho),
            storageLimitBytes: String(limite),
        };
    }
}

function formatMb(bytes: bigint): string {
    return `${(Number(bytes) / 1024 / 1024).toFixed(0)} MB`;
}
