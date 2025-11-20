import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthTokenPayload } from './token.util';

export const UsuarioAutenticado = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): AuthTokenPayload => {
        const request = ctx.switchToHttp().getRequest();
        return request.user as AuthTokenPayload;
    },
);
