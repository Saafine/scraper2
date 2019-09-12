import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const fs = require('fs');
    const keyPath = process.env.KEY_PATH || 'NO KEY PATH';
    const certPath = process.env.CERT_PATH || 'NO CERT PATH';
    console.log('Bootstrapping SSL', { keyPath, certPath });
    const keyFile = fs.readFileSync(keyPath);
    const certFile = fs.readFileSync(certPath);
    const app = await NestFactory.create(AppModule, {
        httpsOptions: {
            key: keyFile,
            cert: certFile,
        }
    });
    app.enableCors();
    await app.listen(process.env.PORT || 3000);
}

bootstrap();
