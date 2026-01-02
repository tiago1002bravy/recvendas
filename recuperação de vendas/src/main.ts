import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Sem ValidationPipe - aceita qualquer formato de dados sem validação
  app.enableCors();

  const port = process.env.PORT || 3010;
  await app.listen(port);
  console.log(`🚀 Aplicação rodando na porta ${port}`);
  console.log(`📡 Webhook disponível em: http://localhost:${port}/webhook`);
}

bootstrap();

