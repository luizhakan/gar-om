import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as classValidator from 'class-validator';
import * as classTransformer from 'class-transformer';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
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
