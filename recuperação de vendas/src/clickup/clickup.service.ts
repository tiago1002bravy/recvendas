import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ClickUpTask {
  id?: string;
  name: string;
  tags?: string[];
  custom_fields?: Array<{
    id: string;
    value: any;
  }>;
  status?: {
    status: string;
  };
}

interface ClickUpCustomField {
  id: string;
  name: string;
  type: string;
}

@Injectable()
export class ClickUpService {
  private readonly logger = new Logger(ClickUpService.name);
  private readonly apiToken: string;
  private readonly listId: string = '901305222206'; // ID da lista do ClickUp
  private readonly baseUrl = 'https://api.clickup.com/api/v2';
  private customFieldIds: Map<string, string> = new Map();
  private produtoLabelIds: Map<string, string> = new Map(); // Mapeia nome do produto -> ID do label
  
  // IDs fixos dos labels de produto (fornecidos pelo usuário)
  private readonly produtoLabelIdsFixos: Map<string, string> = new Map([
    // "Ingresso Escala 26" → ID: 000859e0-a3fb-482a-9042-b9eb72e7afec
    ['ingresso escala 26', '000859e0-a3fb-482a-9042-b9eb72e7afec'],
    ['ingresso-escala-26', '000859e0-a3fb-482a-9042-b9eb72e7afec'],
    ['ingressoescala26', '000859e0-a3fb-482a-9042-b9eb72e7afec'],
    
    // "Ingresso + Template Escala 26" → ID: 46f2f9e5-c903-4ea4-be76-2d95f45a8ae0
    ['ingresso + template escala 26', '46f2f9e5-c903-4ea4-be76-2d95f45a8ae0'],
    ['ingresso+template-escala-26', '46f2f9e5-c903-4ea4-be76-2d95f45a8ae0'],
    ['ingresso+template escala 26', '46f2f9e5-c903-4ea4-be76-2d95f45a8ae0'],
    ['ingressotemplateescala26', '46f2f9e5-c903-4ea4-be76-2d95f45a8ae0'],
  ]);

  constructor(private configService: ConfigService) {
    // Tenta CLICKUP_API_TOKEN primeiro, depois CLICKUP_TOKEN como fallback
    this.apiToken = 
      this.configService.get<string>('CLICKUP_API_TOKEN') || 
      this.configService.get<string>('CLICKUP_TOKEN');

    if (!this.apiToken) {
      this.logger.warn('⚠️ CLICKUP_API_TOKEN/CLICKUP_TOKEN não configurado. Integração com ClickUp desabilitada.');
    } else {
      this.logger.log('✅ Cliente ClickUp inicializado');
      // Carregar IDs dos custom fields na inicialização (não bloqueia)
      this.carregarCustomFields().catch((error) => {
        this.logger.warn(`⚠️ Erro ao carregar custom fields na inicialização: ${error.message}`);
      });
    }
  }

  private async carregarCustomFields(): Promise<void> {
    if (!this.apiToken) return;

    try {
      // Buscar custom fields da lista
      const response = await fetch(`${this.baseUrl}/list/${this.listId}/field`, {
        method: 'GET',
        headers: {
          'Authorization': this.apiToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.warn(`⚠️ Erro ao carregar custom fields: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      const fields: ClickUpCustomField[] = data.fields || [];

      // Mapear campos por nome
      fields.forEach((field) => {
        const nameLower = field.name.toLowerCase().trim();
        if (nameLower.includes('e-mail') || nameLower.includes('email')) {
          this.customFieldIds.set('email', field.id);
        } else if (nameLower.includes('whatsapp')) {
          this.customFieldIds.set('whatsapp', field.id);
        } else if (nameLower.includes('oportunidade')) {
          this.customFieldIds.set('oportunidade', field.id);
        } else if (nameLower.includes('liquidado')) {
          this.customFieldIds.set('liquidado', field.id);
        } else if (nameLower.includes('produto')) {
          this.customFieldIds.set('produto', field.id);
          // Se for campo de label, carregar os labels disponíveis
          if (field.type === 'labels' || field.type === 'label') {
            this.carregarLabelsProduto(field.id);
          }
        } else if (nameLower.includes('backend_projeto') || nameLower.includes('projeto')) {
          this.customFieldIds.set('backend_projeto', field.id);
        }
      });

      this.logger.log(`✅ Custom fields carregados: ${this.customFieldIds.size} campos mapeados`);
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao carregar custom fields: ${error.message}`);
    }
  }

  private async carregarLabelsProduto(fieldId: string): Promise<void> {
    if (!this.apiToken) return;

    try {
      // Buscar detalhes do campo para obter os labels disponíveis
      const response = await fetch(`${this.baseUrl}/field/${fieldId}`, {
        method: 'GET',
        headers: {
          'Authorization': this.apiToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.warn(`⚠️ Erro ao carregar labels do produto: ${response.statusText}`);
        return;
      }

      const field = await response.json();
      
      // Labels podem estar em type_config.options ou options
      const options = field.type_config?.options || field.options || [];
      
      options.forEach((option: any) => {
        const labelName = option.label || option.name || option.value;
        const labelId = option.id || option.value;
        if (labelName && labelId) {
          // Normalizar nome (lowercase, sem espaços extras)
          const nomeNormalizado = labelName.toLowerCase().trim();
          this.produtoLabelIds.set(nomeNormalizado, labelId);
          // Também salvar o nome original para busca exata
          this.produtoLabelIds.set(labelName, labelId);
        }
      });

      this.logger.log(`✅ Labels de produto carregados: ${this.produtoLabelIds.size} labels mapeados`);
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao carregar labels do produto: ${error.message}`);
    }
  }

  private obterIdLabelProduto(nomeProduto: string): string | null {
    // 1. Tentar IDs fixos primeiro (mais confiável)
    const nomeNormalizado = nomeProduto.toLowerCase().trim();
    if (this.produtoLabelIdsFixos.has(nomeNormalizado)) {
      return this.produtoLabelIdsFixos.get(nomeNormalizado) || null;
    }
    
    // 2. Tentar busca normalizada sem espaços/símbolos (para casos como "ingresso+template-escala-26")
    const nomeSemEspacos = nomeNormalizado.replace(/[+\s-]/g, '');
    for (const [key, id] of this.produtoLabelIdsFixos.entries()) {
      const keySemEspacos = key.replace(/[+\s-]/g, '');
      if (keySemEspacos === nomeSemEspacos) {
        return id;
      }
    }
    
    // 3. Tentar busca nos labels carregados dinamicamente
    if (this.produtoLabelIds.has(nomeProduto)) {
      return this.produtoLabelIds.get(nomeProduto) || null;
    }
    
    if (this.produtoLabelIds.has(nomeNormalizado)) {
      return this.produtoLabelIds.get(nomeNormalizado) || null;
    }
    
    // 4. Tentar busca parcial nos labels carregados
    for (const [key, id] of this.produtoLabelIds.entries()) {
      const keyNormalizado = key.toLowerCase().replace(/[+\s-]/g, '');
      if (keyNormalizado === nomeSemEspacos) {
        return id;
      }
    }
    
    return null;
  }

  private async buscarTaskPorEmailEProjeto(
    email: string,
    projeto: string,
  ): Promise<ClickUpTask | null> {
    if (!this.apiToken) return null;

    try {
      const emailFieldId = this.customFieldIds.get('email');
      const projetoFieldId = this.customFieldIds.get('backend_projeto');

      if (!emailFieldId) {
        this.logger.warn('⚠️ Campo de email não encontrado nos custom fields');
        return null;
      }

      // Buscar tasks na lista (limitado a 100 para performance)
      const response = await fetch(
        `${this.baseUrl}/list/${this.listId}/task?archived=false&page=0&order_by=created&reverse=true&subtasks=true&statuses[]=`,
        {
          method: 'GET',
          headers: {
            'Authorization': this.apiToken,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        this.logger.warn(`⚠️ Erro ao buscar tasks: ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      const tasks: any[] = data.tasks || [];

      // Buscar task que tenha o mesmo email e projeto
      for (const task of tasks) {
        // Buscar detalhes completos da task para obter custom fields
        const taskDetails = await this.buscarTaskDetalhes(task.id);
        if (!taskDetails) continue;

        const taskEmail = this.extrairValorCustomField(taskDetails, emailFieldId);
        const taskProjeto = projetoFieldId
          ? this.extrairValorCustomField(taskDetails, projetoFieldId)
          : null;

        if (taskEmail === email && (!projeto || !taskProjeto || taskProjeto === projeto)) {
          return taskDetails;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar task: ${error.message}`);
      return null;
    }
  }

  private async buscarTaskDetalhes(taskId: string): Promise<ClickUpTask | null> {
    if (!this.apiToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}/task/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': this.apiToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar detalhes da task: ${error.message}`);
      return null;
    }
  }

  private extrairValorCustomField(task: any, fieldId: string): string | null {
    if (!task.custom_fields || !Array.isArray(task.custom_fields)) return null;

    const field = task.custom_fields.find((f: any) => f.id === fieldId || f.field?.id === fieldId);
    if (!field) return null;

    // ClickUp retorna valores de forma diferente dependendo do tipo de campo
    // Tentar field.value primeiro
    if (field.value !== null && field.value !== undefined && field.value !== '') {
      return String(field.value);
    }

    // Para campos de texto longo
    if (field.type === 'rich_text' && field.value) {
      return String(field.value);
    }

    // Para campos de seleção/dropdown
    if (field.type === 'drop_down' || field.type === 'labels') {
      if (field.value && field.value.name) {
        return String(field.value.name);
      }
      if (Array.isArray(field.value) && field.value.length > 0) {
        return String(field.value[0].name || field.value[0]);
      }
    }

    // Tentar field.name (alguns campos retornam assim)
    if (field.name) {
      return String(field.name);
    }

    return null;
  }

  async salvarRecuperacaoVenda(dados: {
    nome_lead: string;
    valor: number;
    liquidado: number;
    acao_tomada: string[];
    produto: string;
    email_lead: string;
    whatsapp_lead: string;
    projeto?: string;
  }): Promise<void> {
    if (!this.apiToken) {
      this.logger.debug('⚠️ ClickUp não configurado, pulando salvamento');
      return;
    }

    try {
      // Garantir que os custom fields foram carregados
      if (this.customFieldIds.size === 0) {
        await this.carregarCustomFields();
      }

      // Se tem projeto, buscar task existente
      if (dados.projeto) {
        const taskExistente = await this.buscarTaskPorEmailEProjeto(
          dados.email_lead,
          dados.projeto,
        );

        if (taskExistente) {
          // ✅ Task existente → ATUALIZAR (fazer merge das tags)
          await this.atualizarTask(taskExistente, dados);
          return;
        }
      }

      // ✅ Nova task → CRIAR
      await this.criarTask(dados);
    } catch (error) {
      this.logger.error(`❌ Erro ao salvar no ClickUp: ${error.message}`);
      // Não interrompe o fluxo, apenas loga o erro
    }
  }

  private async atualizarTask(task: ClickUpTask, dados: any): Promise<void> {
    if (!this.apiToken || !task.id) return;

    try {
      // Fazer merge das tags
      // Tags podem vir como objetos {name: string} ou strings
      const tagsExistentes = (task.tags || []).map((t: any) => 
        typeof t === 'string' ? t : (t.name || t)
      );
      const tagsNovas = dados.acao_tomada || [];
      const tagsMerged = [...new Set([...tagsExistentes, ...tagsNovas])];

      this.logger.log(
        `🔄 Task existente encontrada (email: ${dados.email_lead}, projeto: ${dados.projeto})`,
      );
      this.logger.log(`   Tags existentes: [${tagsExistentes.join(', ')}]`);
      this.logger.log(`   Novas tags: [${tagsNovas.join(', ')}]`);
      this.logger.log(`   Tags após merge: [${tagsMerged.join(', ')}]`);

      // Preparar custom fields para atualização
      const customFields: any[] = [];

      // Email
      const emailFieldId = this.customFieldIds.get('email');
      if (emailFieldId) {
        customFields.push({
          id: emailFieldId,
          value: dados.email_lead,
        });
      }

      // WhatsApp
      const whatsappFieldId = this.customFieldIds.get('whatsapp');
      if (whatsappFieldId) {
        customFields.push({
          id: whatsappFieldId,
          value: dados.whatsapp_lead || '',
        });
      }

      // Oportunidade (valor)
      const oportunidadeFieldId = this.customFieldIds.get('oportunidade');
      if (oportunidadeFieldId) {
        customFields.push({
          id: oportunidadeFieldId,
          value: dados.valor,
        });
      }

      // Liquidado
      const liquidadoFieldId = this.customFieldIds.get('liquidado');
      if (liquidadoFieldId) {
        customFields.push({
          id: liquidadoFieldId,
          value: dados.liquidado,
        });
      }

      // Produto (campo de label - precisa ser array de objetos)
      const produtoFieldId = this.customFieldIds.get('produto');
      if (produtoFieldId) {
        const labelId = this.obterIdLabelProduto(dados.produto);
        const produtoValue = labelId
          ? [{ id: labelId }] // Se encontrou ID, usar ID
          : [{ name: dados.produto }]; // Se não encontrou, usar nome (ClickUp criará/selecionará)
        
        customFields.push({
          id: produtoFieldId,
          value: produtoValue,
        });
      }

      // Backend Projeto
      const projetoFieldId = this.customFieldIds.get('backend_projeto');
      if (projetoFieldId && dados.projeto) {
        customFields.push({
          id: projetoFieldId,
          value: dados.projeto,
        });
      }

      // Atualizar task
      // Tags devem ser um array de strings (nomes das tags)
      const updateData: any = {
        name: dados.nome_lead,
      };

      // Adicionar tags apenas se houver tags para adicionar
      if (tagsMerged.length > 0) {
        updateData.tags = tagsMerged;
      }

      if (customFields.length > 0) {
        updateData.custom_fields = customFields;
      }

      const response = await fetch(`${this.baseUrl}/task/${task.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': this.apiToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ClickUp API error: ${response.status} - ${errorText}`);
      }

      this.logger.log(`✅ Task atualizada no ClickUp com ID: ${task.id}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar task no ClickUp: ${error.message}`);
      throw error;
    }
  }

  private async criarTask(dados: any): Promise<void> {
    if (!this.apiToken) return;

    try {
      this.logger.log(
        `📝 Criando nova task (email: ${dados.email_lead}, projeto: ${dados.projeto || 'N/A'})`,
      );

      // Preparar custom fields
      const customFields: any[] = [];

      const emailFieldId = this.customFieldIds.get('email');
      if (emailFieldId) {
        customFields.push({
          id: emailFieldId,
          value: dados.email_lead,
        });
      }

      const whatsappFieldId = this.customFieldIds.get('whatsapp');
      if (whatsappFieldId) {
        customFields.push({
          id: whatsappFieldId,
          value: dados.whatsapp_lead || '',
        });
      }

      const oportunidadeFieldId = this.customFieldIds.get('oportunidade');
      if (oportunidadeFieldId) {
        customFields.push({
          id: oportunidadeFieldId,
          value: dados.valor,
        });
      }

      const liquidadoFieldId = this.customFieldIds.get('liquidado');
      if (liquidadoFieldId) {
        customFields.push({
          id: liquidadoFieldId,
          value: dados.liquidado,
        });
      }

      const produtoFieldId = this.customFieldIds.get('produto');
      if (produtoFieldId) {
        // Produto é campo de label - precisa ser array de objetos
        const labelId = this.obterIdLabelProduto(dados.produto);
        const produtoValue = labelId
          ? [{ id: labelId }] // Se encontrou ID, usar ID
          : [{ name: dados.produto }]; // Se não encontrou, usar nome (ClickUp criará/selecionará)
        
        customFields.push({
          id: produtoFieldId,
          value: produtoValue,
        });
      }

      const projetoFieldId = this.customFieldIds.get('backend_projeto');
      if (projetoFieldId && dados.projeto) {
        customFields.push({
          id: projetoFieldId,
          value: dados.projeto,
        });
      }

      const taskData: any = {
        name: dados.nome_lead,
      };

      // Adicionar tags apenas se houver ações
      if (dados.acao_tomada && dados.acao_tomada.length > 0) {
        taskData.tags = dados.acao_tomada;
      }

      if (customFields.length > 0) {
        taskData.custom_fields = customFields;
      }

      const response = await fetch(`${this.baseUrl}/list/${this.listId}/task`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ClickUp API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      this.logger.log(`✅ Nova task criada no ClickUp com ID: ${result.id}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao criar task no ClickUp: ${error.message}`);
      throw error;
    }
  }
}

