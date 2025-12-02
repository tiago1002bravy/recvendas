import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Put, Param } from '@nestjs/common';
import { WebhookService, FormattedLeadData } from './webhook.service';
import { WebhookDto } from './dto/webhook.dto';

interface FieldMappingDto {
  nomeLead: string;
  valor: string;
  acaoTomada: string;
  produto: string;
  emailLead: string;
  whatsappLead: string;
}

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post(':projeto')
  @HttpCode(HttpStatus.OK)
  async receberWebhookComProjeto(
    @Param('projeto') projeto: string,
    @Body() dados: WebhookDto,
  ): Promise<{
    sucesso: boolean;
    mensagem: string;
    dadosRecebidos: any;
    dadosFormatados?: FormattedLeadData;
    erro?: string;
  }> {
    try {
      this.logger.log(`📥 Webhook recebido para projeto: ${projeto}`);
      this.logger.log(`📋 Estrutura dos dados recebidos: ${JSON.stringify(dados, null, 2)}`);

      const dadosFormatados = await this.webhookService.processarDados(dados, projeto);

      this.logger.log(`✅ Dados processados para lead: ${dadosFormatados.nomeLead || 'N/A'}`);
      this.logger.log(`   Projeto: ${dadosFormatados.projeto || 'N/A'}`);
      this.logger.log(`   Produto: ${dadosFormatados.produto || 'N/A'}`);
      this.logger.log(`   Valor: R$ ${dadosFormatados.valor || 0}`);
      this.logger.log(`   Líquido: R$ ${dadosFormatados.liquidado || 0}`);
      this.logger.log(`   Ações: ${dadosFormatados.acaoTomada.length > 0 ? dadosFormatados.acaoTomada.join(', ') : 'N/A'}`);
      this.logger.log(`   Email: ${dadosFormatados.emailLead || 'N/A'}`);
      this.logger.log(`   WhatsApp: ${dadosFormatados.whatsappLead || 'N/A'}`);

      return {
        sucesso: true,
        mensagem: 'Dados recebidos e formatados com sucesso',
        dadosRecebidos: dados,
        dadosFormatados,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao processar webhook: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      
      return {
        sucesso: false,
        mensagem: 'Erro ao processar webhook',
        dadosRecebidos: dados,
        erro: error.message,
      };
    }
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async receberWebhook(@Body() dados: WebhookDto): Promise<{
    sucesso: boolean;
    mensagem: string;
    dadosRecebidos: any;
    dadosFormatados?: FormattedLeadData;
    erro?: string;
  }> {
    try {
      this.logger.log('📥 Webhook recebido (sem projeto na URL)');
      this.logger.log(`📋 Estrutura dos dados recebidos: ${JSON.stringify(dados, null, 2)}`);

      const dadosFormatados = await this.webhookService.processarDados(dados);

      this.logger.log(`✅ Dados processados para lead: ${dadosFormatados.nomeLead || 'N/A'}`);
      this.logger.log(`   Projeto: ${dadosFormatados.projeto || 'N/A'}`);
      this.logger.log(`   Produto: ${dadosFormatados.produto || 'N/A'}`);
      this.logger.log(`   Valor: R$ ${dadosFormatados.valor || 0}`);
      this.logger.log(`   Líquido: R$ ${dadosFormatados.liquidado || 0}`);
      this.logger.log(`   Ações: ${dadosFormatados.acaoTomada.length > 0 ? dadosFormatados.acaoTomada.join(', ') : 'N/A'}`);
      this.logger.log(`   Email: ${dadosFormatados.emailLead || 'N/A'}`);
      this.logger.log(`   WhatsApp: ${dadosFormatados.whatsappLead || 'N/A'}`);

      return {
        sucesso: true,
        mensagem: 'Dados recebidos e formatados com sucesso',
        dadosRecebidos: dados,
        dadosFormatados,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao processar webhook: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      
      return {
        sucesso: false,
        mensagem: 'Erro ao processar webhook',
        dadosRecebidos: dados,
        erro: error.message,
      };
    }
  }

  @Put('configurar-mapeamento')
  @HttpCode(HttpStatus.OK)
  async configurarMapeamento(@Body() mapping: FieldMappingDto): Promise<{
    sucesso: boolean;
    mensagem: string;
    mapeamento: FieldMappingDto;
  }> {
    this.logger.log('🔧 Configurando mapeamento de campos...');
    this.webhookService.configurarMapeamento(mapping);
    
    return {
      sucesso: true,
      mensagem: 'Mapeamento de campos configurado com sucesso',
      mapeamento: mapping,
    };
  }
}

