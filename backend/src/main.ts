import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as classValidator from 'class-validator';
import * as classTransformer from 'class-transformer';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { corsWhitelist } from './whitelist';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bodyParser: true, // Habilita body parser
    });
    app.useWebSocketAdapter(new IoAdapter(app));
    app.use(helmet());

    const envOrigins =
        process.env.CORS_ORIGIN?.split(',')
            .map(o => o.trim())
            .filter(Boolean) ?? [];

    const corsOrigins = Array.from(new Set([...corsWhitelist, ...envOrigins]));

    app.enableCors({
        origin: corsOrigins,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });

    // Middleware para logar todas as requisições
    app.use((req: any, res: any, next: any) => {
        const timestamp = new Date().toISOString();
        console.log('\n==================== REQUISIÇÃO ====================');
        console.log(`[${timestamp}] ${req.method} ${req.url}`);
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Query Params:', JSON.stringify(req.query, null, 2));
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('IP:', req.ip || req.connection.remoteAddress);
        console.log('====================================================\n');
        next();
    });

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        validatorPackage: classValidator,
        transformerPackage: classTransformer,
    }));

    const port = process.env.PORT || 3001;
    await app.listen(port);
    // eslint-disable-next-line no-console
    console.log(`API Garçom rodando em http://localhost:${port}`);
}

bootstrap();
