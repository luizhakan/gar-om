import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { validarToken, type AuthTokenPayload } from './token.util';

const META_ROLES = 'roles';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader: string | undefined = request.headers.authorization;
        const [, token] = authHeader?.split(' ') ?? [];

        const payload = validarToken(token);
        request.user = payload;

        const rolesRequeridas = this.reflector.getAllAndOverride<string[]>(META_ROLES, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (rolesRequeridas?.length && !rolesRequeridas.includes(payload.role)) {
            throw new ForbiddenException('Permissão insuficiente');
        }

        return true;
    }
}

export const Roles = (...roles: AuthTokenPayload['role'][]) => Reflect.metadata(META_ROLES, roles);
