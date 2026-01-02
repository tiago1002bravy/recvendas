import { Controller, Post, Body, Param, Logger } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookDto } from './dto/webhook.dto';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async webhook(@Body() dados: WebhookDto) {
    this.logger.log('📥 Webhook recebido (sem projeto)');
    return this.webhookService.processarDados(dados);
  }

  @Post(':projeto')
  async webhookComProjeto(@Param('projeto') projeto: string, @Body() dados: WebhookDto) {
    this.logger.log(`📥 Webhook recebido para o projeto: ${projeto}`);
    return this.webhookService.processarDados(dados, projeto);
  }
}
