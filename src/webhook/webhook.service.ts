import { Injectable, Logger } from '@nestjs/common';
import { WebhookDto } from './dto/webhook.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { ClickUpService } from '../clickup/clickup.service';

export interface FormattedLeadData {
  nomeLead: string;
  valor: number;
  liquidado: number; // Valor líquido recebido (seller_balance)
  acaoTomada: string[]; // Array de tags/actions
  produto: string;
  emailLead: string;
  whatsappLead: string;
  // Campos adicionais para banco de dados
  id?: number | string;
  created?: string;
  from?: string;
  utms?: {
    utm_source?: string;
    utm_medium?: string;
    utm_term?: string;
    utm_content?: string;
  };
  projeto?: string;
  dadosOriginais?: any; // Para referência futura
}

// Configuração de mapeamento de campos
// Será configurada quando recebermos o primeiro webhook
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
  
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly clickUpService: ClickUpService,
  ) {}
  
  // Mapeamento de campos configurado com base no formato real recebido
  private fieldMapping: FieldMapping = {
    nomeLead: 'client.name|body.client.name|name|content.name', // Prioriza client.name (quando já está no body)
    valor: 'sale.amount|body.sale.amount|offer.amount|body.offer.amount|valor', // Prioriza sale.amount
    acaoTomada: 'acao|event|body.event|type|body.type', // Campo "acao" ou event/type
    produto: 'product.name|body.product.name|produto', // Prioriza product.name
    emailLead: 'client.email|body.client.email|email|content.email', // Prioriza client.email
    whatsappLead: 'client.cellphone|body.client.cellphone|formatted_phone|whatsapp|telefone|content.whatsapp', // Prioriza client.cellphone
  };

  // Método para configurar o mapeamento de campos
  configurarMapeamento(mapping: FieldMapping): void {
    this.fieldMapping = mapping;
    this.logger.log('🔧 Mapeamento de campos configurado');
    this.logger.debug(`Mapeamento: ${JSON.stringify(mapping, null, 2)}`);
  }

  // Extrai valor do objeto usando o caminho do campo (suporta nested paths como "user.name")
  // Suporta múltiplos campos como fallback (separados por |)
  private extrairValor(dados: WebhookDto, campo: string): any {
    // Se o campo contém |, tenta cada opção até encontrar uma
    if (campo.includes('|')) {
      const opcoes = campo.split('|').map(c => c.trim());
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

  // Converte valor para string, removendo espaços
  private limparString(valor: any): string {
    if (valor === null || valor === undefined) return '';
    return String(valor).trim();
  }

  // Normaliza nome do produto conforme regras específicas
  private normalizarProduto(produto: string): string {
    if (!produto) return '';
    
    let normalizado = produto.trim();
    
    // Converte para lowercase
    normalizado = normalizado.toLowerCase();
    
    // Remove espaços extras e normaliza
    normalizado = normalizado.replace(/\s+/g, ' ').trim();
    
    // Se contém "+", mantém o "+" mas normaliza espaços ao redor
    if (normalizado.includes('+')) {
      // Remove espaços ao redor do "+"
      normalizado = normalizado.replace(/\s*\+\s*/g, '+');
      // Substitui espaços restantes por hífen
      normalizado = normalizado.replace(/\s+/g, '-');
    } else {
      // Se não tem "+", substitui todos os espaços por hífen
      normalizado = normalizado.replace(/\s+/g, '-');
    }
    
    return normalizado;
  }

  // Converte valor para array de strings (tags)
  // Aceita: array, string separada por vírgula, ou string única
  private converterParaArrayTags(valor: any): string[] {
    if (!valor) return [];
    
    // Se já é um array
    if (Array.isArray(valor)) {
      return valor
        .map(item => this.limparString(item))
        .filter(item => item !== '');
    }
    
    // Se é string, tenta separar por vírgula, ponto e vírgula, ou pipe
    if (typeof valor === 'string') {
      const limpo = this.limparString(valor);
      if (!limpo) return [];
      
      // Tenta separar por diferentes delimitadores
      const separadores = [',', ';', '|', '\n'];
      for (const sep of separadores) {
        if (limpo.includes(sep)) {
          return limpo
            .split(sep)
            .map(item => this.limparString(item))
            .filter(item => item !== '');
        }
      }
      
      // Se não tem separador, retorna como array com um único item
      return [limpo];
    }
    
    return [];
  }

  // Converte valor para número
  private converterNumero(valor: any): number {
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string') {
      // Remove caracteres não numéricos exceto ponto e vírgula
      const limpo = valor.replace(/[^\d.,]/g, '').replace(',', '.');
      const numero = parseFloat(limpo);
      return isNaN(numero) ? 0 : numero;
    }
    return 0;
  }

  // Normaliza WhatsApp para formato E.164
  // Tenta múltiplos campos como fallback
  private normalizarWhatsApp(dados: WebhookDto): string {
    // Tenta primeiro formatted_phone (já está em E.164), depois whatsapp, depois telefone, depois body.client.cellphone
    const valor = this.extrairValor(dados, 'body.client.cellphone|formatted_phone|whatsapp|telefone|content.whatsapp');
    
    if (!valor) return '';
    
    const str = this.limparString(valor);
    if (!str) return '';
    
    // Remove tudo exceto números e +
    let limpo = str.replace(/[^\d+]/g, '');
    
    // Se não começa com +, adiciona código do Brasil por padrão
    if (!limpo.startsWith('+')) {
      // Se começa com 0, remove
      if (limpo.startsWith('0')) {
        limpo = limpo.substring(1);
      }
      // Se não começa com 55 (Brasil), adiciona
      if (!limpo.startsWith('55')) {
        limpo = '55' + limpo;
      }
      limpo = '+' + limpo;
    }
    
    return limpo;
  }

  formatarDados(dados: WebhookDto, projetoUrl?: string): FormattedLeadData {
    this.logger.debug('Formatando dados do lead...');
    
    // Se os dados vieram como array (n8n), pega o primeiro item
    let dadosProcessados: any = dados;
    if (Array.isArray(dados) && dados.length > 0) {
      dadosProcessados = dados[0];
      this.logger.debug('📦 Dados recebidos como array (formato n8n)');
    }
    
    // Se tem body dentro do objeto (formato n8n), usa o body como base
    // Caso contrário, usa os dados diretos
    const temBody = dadosProcessados && typeof dadosProcessados === 'object' && 'body' in dadosProcessados;
    const dadosFinais = temBody ? dadosProcessados.body : dadosProcessados;
    
    this.logger.debug(`📋 Estrutura: ${temBody ? 'com body' : 'diretos'}`);
    
    // Extrai email com múltiplos fallbacks
    const emailRaw = this.extrairValor(dadosFinais, this.fieldMapping.emailLead);
    
    // Extrai nome com múltiplos fallbacks
    const nomeRaw = this.extrairValor(dadosFinais, this.fieldMapping.nomeLead);
    
    // Extrai valor (pode não existir, será 0)
    const valorRaw = this.extrairValor(dadosFinais, this.fieldMapping.valor);
    
    // Extrai valor líquido (seller_balance)
    const liquidadoRaw = this.extrairValor(dadosFinais, 'sale.seller_balance|body.sale.seller_balance|seller_balance|body.seller_balance');
    
    // Extrai UTMs (pode estar em content.utms ou no nível raiz)
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
    
    // Projeto vem da URL, não do body
    const projetoFinal = projetoUrl || this.extrairValor(dadosFinais, 'projeto|from|content.from');
    
    // Extrai ações - se for evento de venda, mapeia para "pix-gerado" ou outras ações
    const acaoRaw = this.extrairValor(dadosFinais, this.fieldMapping.acaoTomada);
    let acoesFormatadas: string[] = [];
    
    // Verifica status e método da venda para detectar ações
    // Tenta primeiro no nível atual (body), depois com prefixo body.
    const saleStatus = this.extrairValor(dadosFinais, 'sale.status|body.sale.status|currentStatus|body.currentStatus');
    const method = this.extrairValor(dadosFinais, 'sale.method|body.sale.method|method|body.method');
    const event = this.extrairValor(dadosFinais, 'event|body.event|type|body.type');
    const hasSale = this.extrairValor(dadosFinais, 'sale|body.sale') !== null;
    const hasOffer = this.extrairValor(dadosFinais, 'offer|body.offer') !== null;
    
    // Detecta carrinho abandonado: pelo evento "checkoutAbandoned" ou se tem offer mas não tem sale/sale sem status de pagamento
    const eventLower = event ? this.limparString(event).toLowerCase() : '';
    const isCheckoutAbandoned = eventLower === 'checkoutabandoned' || eventLower === 'checkout-abandoned';
    const isCarrinhoAbandonado = isCheckoutAbandoned || (hasOffer && (!hasSale || !saleStatus || (saleStatus !== 'paid' && saleStatus !== 'waiting_payment' && saleStatus !== 'refunded')));
    
    // Status que indicam falha de pagamento/cartão recusado
    const statusFalhaPagamento = ['failed', 'refused', 'declined', 'error', 'rejected', 'canceled', 'cancelled'];
    const isCartaoRecusado = saleStatus && statusFalhaPagamento.includes(saleStatus.toLowerCase());
    
    // Mapeia status para ações específicas
    if (isCartaoRecusado) {
      acoesFormatadas = ['cartao-recusado'];
      this.logger.debug(`✅ Ação detectada: cartao-recusado (status: ${saleStatus})`);
    }
    else if (isCarrinhoAbandonado) {
      acoesFormatadas = ['carrinho-abandonado'];
      if (isCheckoutAbandoned) {
        this.logger.debug('✅ Ação detectada: carrinho-abandonado (event: checkoutAbandoned)');
      } else {
        this.logger.debug('✅ Ação detectada: carrinho-abandonado (tem offer mas não tem venda completa)');
      }
    }
    else if (saleStatus === 'refunded') {
      acoesFormatadas = ['reembolso'];
      this.logger.debug('✅ Ação detectada: reembolso (status: refunded)');
    }
    else if (saleStatus === 'paid') {
      acoesFormatadas = ['comprador'];
      this.logger.debug('✅ Ação detectada: comprador (status: paid)');
    }
    // Se for waiting_payment com método PIX, marca como pix-gerado
    else if (saleStatus === 'waiting_payment' && method === 'PIX') {
      acoesFormatadas = ['pix-gerado'];
      this.logger.debug('✅ Ação detectada: pix-gerado (waiting_payment + PIX)');
    } 
    // Se encontrou ação explícita, usa ela
    else if (acaoRaw && (!Array.isArray(acaoRaw) || acaoRaw.length > 0)) {
      acoesFormatadas = this.converterParaArrayTags(acaoRaw);
    }
    // Se não encontrou, tenta inferir do evento
    else if (event) {
      const eventLower = this.limparString(event).toLowerCase().replace(/_/g, '-');
      if (eventLower === 'saleupdated' || eventLower === 'sale-updated') {
        acoesFormatadas = ['venda-atualizada'];
      } else {
        acoesFormatadas = [eventLower];
      }
    }
    
    // Se ainda não tem ações, deixa vazio (será salvo como array vazio)
    if (acoesFormatadas.length === 0) {
      this.logger.debug('⚠️ Nenhuma ação detectada');
    }
    
    const produtoRaw = this.extrairValor(dadosFinais, this.fieldMapping.produto);
    
    const dadosFormatados: FormattedLeadData = {
      nomeLead: this.limparString(nomeRaw),
      valor: this.converterNumero(valorRaw),
      liquidado: this.converterNumero(liquidadoRaw),
      acaoTomada: acoesFormatadas,
      produto: this.normalizarProduto(this.limparString(produtoRaw)),
      emailLead: this.limparString(emailRaw).toLowerCase(),
      whatsappLead: this.normalizarWhatsApp(dadosFinais),
      // Campos adicionais
      id: dadosFinais.id || this.extrairValor(dadosFinais, 'sale.id|body.sale.id|client.id|body.client.id'),
      created: dadosFinais.created || this.extrairValor(dadosFinais, 'sale.created_at|body.sale.created_at|client.created_at|body.client.created_at'),
      from: dadosFinais.from || null,
      utms: utms,
      projeto: this.limparString(projetoFinal),
      dadosOriginais: dadosProcessados, // Mantém referência aos dados originais
    };

    this.logger.debug('Dados formatados com sucesso');
    return dadosFormatados;
  }

  async processarDados(dados: WebhookDto, projeto?: string): Promise<FormattedLeadData> {
    this.logger.log('🔄 Processando dados recebidos...');
    
    const dadosFormatados = this.formatarDados(dados, projeto);
    
    // Salvar no banco de dados Supabase
    try {
      await this.salvarNoBanco(dadosFormatados);
    } catch (error) {
      this.logger.error(`❌ Erro ao salvar no banco: ${error.message}`);
      // Não interrompe o fluxo, apenas loga o erro
    }

    // Salvar no ClickUp
    try {
      await this.salvarNoClickUp(dadosFormatados);
    } catch (error) {
      this.logger.error(`❌ Erro ao salvar no ClickUp: ${error.message}`);
      // Não interrompe o fluxo, apenas loga o erro
    }
    
    this.logger.log('✅ Processamento concluído');
    
    return dadosFormatados;
  }

  private async salvarNoBanco(dados: FormattedLeadData): Promise<void> {
    const dadosParaBanco = {
      nome_lead: dados.nomeLead,
      valor: dados.valor,
      liquidado: dados.liquidado,
      acao_tomada: dados.acaoTomada, // Array de strings
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
      acao_tomada: dados.acaoTomada, // Array de strings (será usado como tags)
      produto: dados.produto,
      email_lead: dados.emailLead,
      whatsapp_lead: dados.whatsappLead,
      projeto: dados.projeto || null,
    };

    await this.clickUpService.salvarRecuperacaoVenda(dadosParaClickUp);
  }
}

