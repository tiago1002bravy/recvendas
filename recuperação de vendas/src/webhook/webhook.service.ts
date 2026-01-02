import { Injectable, Logger } from '@nestjs/common';
import { WebhookDto } from './dto/webhook.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { ClickUpService } from '../clickup/clickup.service';

export interface FormattedLeadData {
  nomeLead: string;
  valor: number;
  liquidado: number;
  acaoTomada: string[];
  produto: string;
  emailLead: string;
  whatsappLead: string;
  id?: number | string;
  created?: string;
  from?: string;
  utms?: {
    utm_source?: string;
    utm_medium?: string;
    utm_term?: string;
    utm_content?: string;
    utm_campaign?: string;
  };
  projeto?: string;
  dadosOriginais?: any;
}

interface FieldMapping {
  nomeLead: string;
  valor: string;
  acaoTomada: string;
  produto: string;
  emailLead: string;
  whatsappLead: string;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  private fieldMapping: FieldMapping = {
    nomeLead: 'client.name|body.client.name|name|content.name',
    valor: 'sale.amount|body.sale.amount|offer.amount|body.offer.amount|valor',
    acaoTomada: 'acao|event|body.event|type|body.type',
    produto: 'product.name|body.product.name|produto',
    emailLead: 'client.email|body.client.email|email|content.email',
    whatsappLead: 'client.cellphone|body.client.cellphone|formatted_phone|whatsapp|telefone|content.whatsapp',
  };

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly clickUpService: ClickUpService,
  ) {}

  configurarMapeamento(mapping: FieldMapping): void {
    this.fieldMapping = mapping;
    this.logger.log('🔧 Mapeamento de campos configurado');
    this.logger.debug(`Mapeamento: ${JSON.stringify(mapping, null, 2)}`);
  }

  private extrairValor(dados: WebhookDto, campo: string): any {
    if (campo.includes('|')) {
      const opcoes = campo.split('|').map((c) => c.trim());
      for (const opcao of opcoes) {
        const valor = this.extrairValorSimples(dados, opcao);
        if (valor !== null && valor !== undefined && valor !== '') {
          return valor;
        }
      }
      return null;
    }

    return this.extrairValorSimples(dados, campo);
  }

  private extrairValorSimples(dados: WebhookDto, campo: string): any {
    const partes = campo.split('.');
    let valor: any = dados;

    for (const parte of partes) {
      if (valor && typeof valor === 'object' && parte in valor) {
        valor = valor[parte];
      } else {
        return null;
      }
    }

    return valor;
  }

  private limparString(valor: any): string {
    if (valor === null || valor === undefined) return '';
    return String(valor).trim();
  }

  private normalizarProduto(produto: string): string {
    if (!produto) return '';

    let normalizado = produto.trim();
    normalizado = normalizado.toLowerCase();
    normalizado = normalizado.replace(/\s+/g, ' ').trim();

    if (normalizado.includes('+')) {
      normalizado = normalizado.replace(/\s*\+\s*/g, '+');
      normalizado = normalizado.replace(/\s+/g, '-');
    } else {
      normalizado = normalizado.replace(/\s+/g, '-');
    }

    return normalizado;
  }

  private converterParaArrayTags(valor: any): string[] {
    if (!valor) return [];

    if (Array.isArray(valor)) {
      return valor
        .map((item) => this.limparString(item))
        .filter((item) => item !== '');
    }

    if (typeof valor === 'string') {
      const limpo = this.limparString(valor);
      if (!limpo) return [];

      const separadores = [',', ';', '|', '\n'];
      for (const sep of separadores) {
        if (limpo.includes(sep)) {
          return limpo
            .split(sep)
            .map((item) => this.limparString(item))
            .filter((item) => item !== '');
        }
      }

      return [limpo];
    }

    return [];
  }

  private converterNumero(valor: any): number {
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string') {
      const limpo = valor.replace(/[^\d.,]/g, '').replace(',', '.');
      const numero = parseFloat(limpo);
      return isNaN(numero) ? 0 : numero;
    }
    return 0;
  }

  private normalizarWhatsApp(dados: WebhookDto): string {
    const valor = this.extrairValor(dados, 'body.client.cellphone|formatted_phone|whatsapp|telefone|content.whatsapp');

    if (!valor) return '';

    const str = this.limparString(valor);
    if (!str) return '';

    let limpo = str.replace(/[^\d+]/g, '');

    if (!limpo.startsWith('+')) {
      if (limpo.startsWith('0')) {
        limpo = limpo.substring(1);
      }
      if (!limpo.startsWith('55')) {
        limpo = '55' + limpo;
      }
      limpo = '+' + limpo;
    }

    return limpo;
  }

  formatarDados(dados: WebhookDto, projetoUrl?: string): FormattedLeadData {
    this.logger.debug('Formatando dados do lead...');

    let dadosProcessados: any = dados;
    if (Array.isArray(dados) && dados.length > 0) {
      dadosProcessados = dados[0];
      this.logger.debug('📦 Dados recebidos como array (formato n8n)');
    }

    const temBody = dadosProcessados && typeof dadosProcessados === 'object' && 'body' in dadosProcessados;
    const dadosFinais = temBody ? dadosProcessados.body : dadosProcessados;

    this.logger.debug(`📋 Estrutura: ${temBody ? 'com body' : 'diretos'}`);

    const emailRaw = this.extrairValor(dadosFinais, this.fieldMapping.emailLead);
    const nomeRaw = this.extrairValor(dadosFinais, this.fieldMapping.nomeLead);
    const valorRaw = this.extrairValor(dadosFinais, this.fieldMapping.valor);
    const liquidadoRaw = this.extrairValor(
      dadosFinais,
      'sale.seller_balance|body.sale.seller_balance|seller_balance|body.seller_balance',
    );

    const utmsRaw = this.extrairValor(dadosFinais, 'utms|content.utms');
    let utms = null;
    if (utmsRaw && typeof utmsRaw === 'object') {
      utms = {
        utm_source: this.limparString(utmsRaw.utm_source || ''),
        utm_medium: this.limparString(utmsRaw.utm_medium || ''),
        utm_campaign: this.limparString(utmsRaw.utm_campaign || ''),
        utm_term: this.limparString(utmsRaw.utm_term || ''),
        utm_content: this.limparString(utmsRaw.utm_content || ''),
      };
    }

    const projetoFinal = projetoUrl || this.extrairValor(dadosFinais, 'projeto|from|content.from') || 'default';
    if (projetoFinal === 'default' && !projetoUrl && !this.extrairValor(dadosFinais, 'projeto|from|content.from')) {
      this.logger.debug('ℹ️ Projeto não informado, usando "default"');
    }

    const acaoRaw = this.extrairValor(dadosFinais, this.fieldMapping.acaoTomada);
    let acoesFormatadas: string[] = [];

    const saleStatus = this.extrairValor(
      dadosFinais,
      'sale.status|body.sale.status|currentStatus|body.currentStatus',
    );
    const method = this.extrairValor(dadosFinais, 'sale.method|body.sale.method|method|body.method');
    const event = this.extrairValor(dadosFinais, 'event|body.event|type|body.type');
    const hasSale = this.extrairValor(dadosFinais, 'sale|body.sale') !== null;
    const hasOffer = this.extrairValor(dadosFinais, 'offer|body.offer') !== null;

    const eventLower = event ? this.limparString(event).toLowerCase() : '';
    const isCheckoutAbandoned =
      eventLower === 'checkoutabandoned' || eventLower === 'checkout-abandoned';
    const isCarrinhoAbandonado =
      isCheckoutAbandoned ||
      (hasOffer && (!hasSale || !saleStatus || (saleStatus !== 'paid' && saleStatus !== 'waiting_payment' && saleStatus !== 'refunded')));

    const statusFalhaPagamento = ['failed', 'refused', 'declined', 'error', 'rejected', 'canceled', 'cancelled'];
    const isCartaoRecusado = saleStatus && statusFalhaPagamento.includes(saleStatus.toLowerCase());

    if (isCartaoRecusado) {
      acoesFormatadas = ['cartao-recusado'];
      this.logger.debug(`✅ Ação detectada: cartao-recusado (status: ${saleStatus})`);
    } else if (isCarrinhoAbandonado) {
      acoesFormatadas = ['carrinho-abandonado'];
      if (isCheckoutAbandoned) {
        this.logger.debug('✅ Ação detectada: carrinho-abandonado (event: checkoutAbandoned)');
      } else {
        this.logger.debug('✅ Ação detectada: carrinho-abandonado (tem offer mas não tem venda completa)');
      }
    } else if (saleStatus === 'refunded') {
      acoesFormatadas = ['reembolso'];
      this.logger.debug('✅ Ação detectada: reembolso (status: refunded)');
    } else if (saleStatus === 'paid') {
      acoesFormatadas = ['comprador'];
      this.logger.debug('✅ Ação detectada: comprador (status: paid)');
    } else if (saleStatus === 'waiting_payment' && method === 'PIX') {
      acoesFormatadas = ['pix-gerado'];
      this.logger.debug('✅ Ação detectada: pix-gerado (waiting_payment + PIX)');
    } else if (acaoRaw && (!Array.isArray(acaoRaw) || acaoRaw.length > 0)) {
      acoesFormatadas = this.converterParaArrayTags(acaoRaw);
    } else if (event) {
      const eventLower = this.limparString(event).toLowerCase().replace(/_/g, '-');
      if (eventLower === 'saleupdated' || eventLower === 'sale-updated') {
        acoesFormatadas = ['venda-atualizada'];
      } else {
        acoesFormatadas = [eventLower];
      }
    }

    if (acoesFormatadas.length === 0) {
      this.logger.debug('⚠️ Nenhuma ação detectada');
    }

    const produtoRaw = this.extrairValor(dadosFinais, this.fieldMapping.produto);

    // Validar valores negativos
    const liquidado = this.converterNumero(liquidadoRaw);
    if (liquidado < 0 && !acoesFormatadas.includes('refunded') && !acoesFormatadas.includes('reembolso')) {
      this.logger.warn(`⚠️ Valor líquido negativo sem ação de reembolso: ${liquidado}`);
    }

    const dadosFormatados: FormattedLeadData = {
      nomeLead: this.limparString(nomeRaw),
      valor: this.converterNumero(valorRaw),
      liquidado: liquidado,
      acaoTomada: acoesFormatadas,
      produto: this.normalizarProduto(this.limparString(produtoRaw)),
      emailLead: this.limparString(emailRaw).toLowerCase(),
      whatsappLead: this.normalizarWhatsApp(dadosFinais),
      id: dadosFinais.id || this.extrairValor(dadosFinais, 'sale.id|body.sale.id|client.id|body.client.id'),
      created: dadosFinais.created || this.extrairValor(dadosFinais, 'sale.created_at|body.sale.created_at|client.created_at|body.client.created_at'),
      from: dadosFinais.from || null,
      utms: utms,
      projeto: this.limparString(projetoFinal),
      dadosOriginais: dadosProcessados,
    };

    this.logger.debug('Dados formatados com sucesso');
    return dadosFormatados;
  }

  async processarDados(dados: WebhookDto, projeto?: string): Promise<FormattedLeadData> {
    this.logger.log('🔄 Processando dados recebidos...');

    const dadosFormatados = this.formatarDados(dados, projeto);

    try {
      await this.salvarNoBanco(dadosFormatados);
    } catch (error: any) {
      this.logger.error(`❌ Erro ao salvar no banco: ${error.message}`);
    }

    try {
      await this.salvarNoClickUp(dadosFormatados);
    } catch (error: any) {
      this.logger.error(`❌ Erro ao salvar no ClickUp: ${error.message}`);
    }

    this.logger.log('✅ Processamento concluído');

    return dadosFormatados;
  }

  private async salvarNoBanco(dados: FormattedLeadData): Promise<void> {
    const dadosParaBanco = {
      nome_lead: dados.nomeLead,
      valor: dados.valor,
      liquidado: dados.liquidado,
      acao_tomada: dados.acaoTomada,
      produto: dados.produto,
      email_lead: dados.emailLead,
      whatsapp_lead: dados.whatsappLead,
      id_original: dados.id ? String(dados.id) : null,
      created_original: dados.created || null,
      from_original: dados.from || null,
      utms: dados.utms || null,
      projeto: dados.projeto || null,
      dados_originais: dados.dadosOriginais || null,
    };

    await this.supabaseService.salvarRecuperacaoVenda(dadosParaBanco);
  }

  private async salvarNoClickUp(dados: FormattedLeadData): Promise<void> {
    const dadosParaClickUp = {
      nome_lead: dados.nomeLead,
      valor: dados.valor,
      liquidado: dados.liquidado,
      acao_tomada: dados.acaoTomada,
      produto: dados.produto,
      email_lead: dados.emailLead,
      whatsapp_lead: dados.whatsappLead,
      projeto: dados.projeto || null,
    };

    await this.clickUpService.salvarRecuperacaoVenda(dadosParaClickUp);
  }
}

