import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configurar pasta de uploads como estática
  app.useStaticAssets('uploads', {
    prefix: '/uploads',
  });

  // Configurar CORS
  app.enableCors({
    origin: true, // Permite todas as origens em desenvolvimento
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(3000);
  console.log('🚀 Backend rodando em http://localhost:3000');
}
bootstrap();
