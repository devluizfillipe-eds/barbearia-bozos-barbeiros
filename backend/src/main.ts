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
    origin: '*', // Permite qualquer origem (seguro para testes, ajustar para produção depois)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend rodando em http://0.0.0.0:${port}`);
}
bootstrap();
