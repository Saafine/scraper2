/* tslint:disable:no-console */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';
import { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, getNestApplicationOptions());
    app.enableCors();
    await app.listen(process.env.PORT || 3000);
}

function getNestApplicationOptions(): NestApplicationOptions | {} {
    const keyPath = process.env.KEY_PATH;
    const certPath = process.env.CERT_PATH;

    if (!keyPath || !certPath) {
        console.log('SSL: No certification found');
        return {};
    }

    return {
        httpsOptions: {
            key: readFileSync(keyPath),
            cert: readFileSync(certPath),
        },
    };
}

bootstrap();
