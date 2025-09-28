// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(process.env.PORT ?? 3000);
// }
// bootstrap();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // Prefix API ถ้าคุณอยากมี เช่น /api (เลือกเปิดหรือปิด)
  // app.setGlobalPrefix('api');

  // Enable URI Versioning => /v1/*
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // CORS (tune as needed)
  app.enableCors({ origin: true, credentials: true });

  // เปิด Swagger เฉพาะ non-prod (แนะนำ) หรือเปิดตลอดก็ได้
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Royalty Reward API')
      .setDescription('REST API documentation')
      .setVersion('1.0.0')
      // กำหนด server base URLs (แก้ให้ตรง dev/prod ของคุณ)
      .addServer('http://localhost:3000', 'Local')
      // ถ้าใช้ JWT:
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Paste JWT here' },
        'JWT',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // ให้โหลด JSON ได้ที่ /openapi.json
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get('/openapi.json', (req: any, res: any) => {
      res.header('Content-Type', 'application/json').send(document);
    });

    SwaggerModule.setup('docs', app, document, {
      customSiteTitle: 'Royalty Reward API Docs',
      swaggerOptions: {
        persistAuthorization: true,  // จำ token ไว้ในหน้า docs
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
bootstrap();
