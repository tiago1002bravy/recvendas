import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface RecuperacaoVendaData {
  nome_lead: string;
  valor: number;
  liquidado: number;
  acao_tomada: string[];
  produto: string;
  email_lead: string;
  whatsapp_lead: string;
  id_original?: string;
  created_original?: string;
  from_original?: string;
  utms?: any;
  projeto?: string;
  dados_originais?: any;
}

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('❌ Variáveis de ambiente do Supabase não configuradas');
      throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger.log('✅ Cliente Supabase inicializado');
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async salvarRecuperacaoVenda(dados: RecuperacaoVendaData) {
    try {
      // Validar email - se ausente ou inválido, criar email temporário
      let emailLead = dados.email_lead;
      if (!emailLead || !emailLead.includes('@')) {
        if (dados.whatsapp_lead) {
          emailLead = `whatsapp_${dados.whatsapp_lead.replace(/[^\d]/g, '')}@desconhecido.local`;
          this.logger.warn(`⚠️ Email inválido, usando WhatsApp como base: ${emailLead}`);
        } else {
          emailLead = `desconhecido_${Date.now()}@desconhecido.local`;
          this.logger.warn(`⚠️ Email e WhatsApp ausentes, usando email temporário: ${emailLead}`);
        }
      }

      // Validar projeto - usar 'default' se não informado
      const projeto = dados.projeto || 'default';
      if (projeto === 'default' && !dados.projeto) {
        this.logger.debug('ℹ️ Projeto não informado, usando "default"');
      }

      // Validar dados_originais - limitar tamanho se muito grande
      let dadosOriginais = dados.dados_originais;
      if (dadosOriginais) {
        const dadosOriginaisStr = JSON.stringify(dadosOriginais);
        if (dadosOriginaisStr.length > 1000000) {
          // 1MB
          this.logger.warn('⚠️ dados_originais muito grande, salvando apenas campos essenciais');
          dadosOriginais = {
            id: dadosOriginais.id,
            sale_id: dadosOriginais.sale?.id,
            client_email: dadosOriginais.client?.email,
          };
        }
      }

      // Se tem projeto, verificar se já existe e fazer merge das ações
      if (projeto) {
        // Primeiro, verificar se já existe um registro com mesmo email + projeto
        const { data: existingData, error: selectError } = await this.supabase
          .from('recuperacao_vendas')
          .select('id, acao_tomada, projeto')
          .eq('email_lead', emailLead)
          .eq('projeto', projeto)
          .maybeSingle();

        if (selectError && selectError.code !== 'PGRST116') {
          // PGRST116 = nenhum resultado encontrado (não é erro)
          this.logger.error(`❌ Erro ao verificar registro existente: ${selectError.message}`);
          throw selectError;
        }

        if (existingData) {
          // ✅ Mesmo email + mesmo projeto → ATUALIZA (faz merge das ações)
          const acoesExistentes = existingData.acao_tomada || [];
          const acoesNovas = dados.acao_tomada || [];

          // Merge: combina arrays e remove duplicatas
          const acoesMerged = [...new Set([...acoesExistentes, ...acoesNovas])];

          this.logger.log(
            `🔄 Lead existente encontrado (email: ${emailLead}, projeto: ${projeto})`,
          );
          this.logger.log(`   Ações existentes: [${acoesExistentes.join(', ')}]`);
          this.logger.log(`   Novas ações: [${acoesNovas.join(', ')}]`);
          this.logger.log(`   Ações após merge: [${acoesMerged.join(', ')}]`);

          // Atualizar com ações mergeadas (mantém campos que não devem ser atualizados)
          const dadosAtualizados = {
            nome_lead: dados.nome_lead,
            valor: dados.valor,
            liquidado: dados.liquidado,
            acao_tomada: acoesMerged,
            produto: dados.produto,
            email_lead: emailLead,
            whatsapp_lead: dados.whatsapp_lead,
            id_original: dados.id_original,
            created_original: dados.created_original,
            from_original: dados.from_original,
            utms: dados.utms,
            projeto: projeto,
            dados_originais: dadosOriginais,
            updated_at: new Date().toISOString(),
          };

          const { data, error } = await this.supabase
            .from('recuperacao_vendas')
            .update(dadosAtualizados)
            .eq('id', existingData.id)
            .select()
            .single();

          if (error) {
            this.logger.error(`❌ Erro ao atualizar no Supabase: ${error.message}`);
            this.logger.error(`   Código do erro: ${error.code}`);
            this.logger.error(`   Detalhes: ${JSON.stringify(error, null, 2)}`);
            throw error;
          }

          this.logger.log(`✅ Lead atualizado no Supabase com ID: ${data.id}`);
          return data;
        } else {
          // ✅ Mesmo email + novo projeto → CRIA NOVO (ou email novo)
          this.logger.log(`📝 Criando novo lead (email: ${emailLead}, projeto: ${projeto})`);

          const dadosParaInsert = {
            nome_lead: dados.nome_lead,
            valor: dados.valor,
            liquidado: dados.liquidado,
            acao_tomada: dados.acao_tomada,
            produto: dados.produto,
            email_lead: emailLead,
            whatsapp_lead: dados.whatsapp_lead,
            id_original: dados.id_original,
            created_original: dados.created_original,
            from_original: dados.from_original,
            utms: dados.utms,
            projeto: projeto,
            dados_originais: dadosOriginais,
          };

          const { data, error } = await this.supabase
            .from('recuperacao_vendas')
            .insert([dadosParaInsert])
            .select()
            .single();

          if (error) {
            this.logger.error(`❌ Erro ao salvar no Supabase: ${error.message}`);
            this.logger.error(`   Código do erro: ${error.code}`);
            this.logger.error(`   Detalhes: ${JSON.stringify(error, null, 2)}`);
            this.logger.error(`   Dados tentados: ${JSON.stringify(dadosParaInsert, null, 2)}`);
            throw error;
          }

          this.logger.log(`✅ Novo lead salvo no Supabase com ID: ${data.id}`);
          return data;
        }
      } else {
        // Se não tem projeto, fazer insert normal
        const { data, error } = await this.supabase
          .from('recuperacao_vendas')
          .insert([dados])
          .select()
          .single();

        if (error) {
          this.logger.error(`❌ Erro ao salvar no Supabase: ${error.message}`);
          throw error;
        }

        this.logger.log(`✅ Dados salvos no Supabase com ID: ${data.id}`);
        return data;
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao salvar recuperação de venda: ${error.message}`);
      throw error;
    }
  }
}

