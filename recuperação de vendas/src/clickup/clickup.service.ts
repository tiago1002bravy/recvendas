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
  
  // ID fixo do campo "Produto" (fornecido pelo usuário)
  private readonly PRODUTO_FIELD_ID = 'b01ec9fe-187c-4e49-8d0e-5f40d24ed3f3';
  
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
          // Usar ID fixo do campo "Produto" sempre
          this.customFieldIds.set('produto', this.PRODUTO_FIELD_ID);
          // Se o campo encontrado for o correto e for do tipo label, carregar os labels
          if (field.id === this.PRODUTO_FIELD_ID && (field.type === 'labels' || field.type === 'label')) {
            this.carregarLabelsProduto(this.PRODUTO_FIELD_ID);
          } else if (field.id !== this.PRODUTO_FIELD_ID) {
            // Se encontrou outro campo com nome "produto", apenas logar (não carregar labels do campo errado)
            this.logger.debug(`ℹ️ Campo "produto" encontrado com ID diferente: ${field.id}. Usando ID fixo: ${this.PRODUTO_FIELD_ID}`);
            // Carregar labels do campo correto (ID fixo)
            this.carregarLabelsProduto(this.PRODUTO_FIELD_ID);
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
      // Buscar custom fields da lista para obter os labels disponíveis
      const response = await fetch(`${this.baseUrl}/list/${this.listId}/field`, {
        method: 'GET',
        headers: {
          'Authorization': this.apiToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Não é crítico, apenas logar como debug (já temos IDs fixos)
        this.logger.debug(`ℹ️ Não foi possível carregar labels dinamicamente (${fieldId}): ${response.statusText}. Usando IDs fixos.`);
        return;
      }

      const data = await response.json();
      const fields: any[] = data.fields || [];
      
      // Encontrar o campo específico pelo ID
      const produtoField = fields.find((f: any) => f.id === fieldId);
      
      if (!produtoField) {
        this.logger.debug(`ℹ️ Campo de produto (${fieldId}) não encontrado na lista. Usando IDs fixos.`);
        return;
      }
      
      // Labels podem estar em type_config.options ou options
      const options = produtoField.type_config?.options || produtoField.options || [];
      
      if (options && options.length > 0) {
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

        this.logger.debug(`✅ Labels de produto carregados dinamicamente: ${this.produtoLabelIds.size} labels mapeados`);
      }
    } catch (error) {
      // Não é crítico, apenas logar como debug (já temos IDs fixos)
      this.logger.debug(`ℹ️ Erro ao carregar labels do produto: ${error.message}. Usando IDs fixos.`);
    }
  }

  private obterIdLabelProduto(nomeProduto: string): string | null {
    // 1. Tentar IDs fixos primeiro (mais confiável)
    const nomeNormalizado = nomeProduto.toLowerCase().trim();
    if (this.produtoLabelIdsFixos.has(nomeNormalizado)) {
      const id = this.produtoLabelIdsFixos.get(nomeNormalizado) || null;
      this.logger.debug(`✅ ID encontrado nos fixos: "${nomeProduto}" → ${id}`);
      return id;
    }
    
    // 2. Tentar busca normalizada sem espaços/símbolos (para casos como "ingresso+template-escala-26")
    const nomeSemEspacos = nomeNormalizado.replace(/[+\s-]/g, '');
    for (const [key, id] of this.produtoLabelIdsFixos.entries()) {
      const keySemEspacos = key.replace(/[+\s-]/g, '');
      if (keySemEspacos === nomeSemEspacos) {
        this.logger.debug(`✅ ID encontrado nos fixos (normalizado): "${nomeProduto}" → ${id}`);
        return id;
      }
    }
    
    // 3. Tentar busca nos labels carregados dinamicamente
    if (this.produtoLabelIds.has(nomeProduto)) {
      const id = this.produtoLabelIds.get(nomeProduto) || null;
      this.logger.debug(`✅ ID encontrado nos dinâmicos: "${nomeProduto}" → ${id}`);
      return id;
    }
    
    if (this.produtoLabelIds.has(nomeNormalizado)) {
      const id = this.produtoLabelIds.get(nomeNormalizado) || null;
      this.logger.debug(`✅ ID encontrado nos dinâmicos (normalizado): "${nomeProduto}" → ${id}`);
      return id;
    }
    
    // 4. Tentar busca parcial nos labels carregados
    for (const [key, id] of this.produtoLabelIds.entries()) {
      const keyNormalizado = key.toLowerCase().replace(/[+\s-]/g, '');
      if (keyNormalizado === nomeSemEspacos) {
        this.logger.debug(`✅ ID encontrado nos dinâmicos (parcial): "${nomeProduto}" → ${id}`);
        return id;
      }
    }
    
    this.logger.warn(`⚠️ ID do label não encontrado para: "${nomeProduto}"`);
    this.logger.debug(`   IDs fixos disponíveis: ${Array.from(this.produtoLabelIdsFixos.keys()).join(', ')}`);
    this.logger.debug(`   IDs dinâmicos disponíveis: ${Array.from(this.produtoLabelIds.keys()).join(', ')}`);
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

      // Construir filtros de custom fields (apenas email e projeto, produto não importa)
      const customFieldsFilter: any[] = [
        {
          field_id: emailFieldId,
          operator: '=',
          value: email,
        },
      ];

      // Se tem projeto e campo de projeto, adicionar filtro
      if (projeto && projetoFieldId) {
        customFieldsFilter.push({
          field_id: projetoFieldId,
          operator: '=',
          value: projeto,
        });
      }

      this.logger.debug(`🔍 Buscando task por email: ${email}, projeto: ${projeto || 'N/A'}`);
      this.logger.debug(`   Filtros: ${JSON.stringify(customFieldsFilter)}`);

      // Codificar filtros para URL
      const filtersEncoded = encodeURIComponent(JSON.stringify(customFieldsFilter));

      // Buscar tasks usando filtros de custom fields (incluindo tarefas fechadas)
      const response = await fetch(
        `${this.baseUrl}/list/${this.listId}/task?archived=false&include_closed=true&custom_fields=${filtersEncoded}`,
        {
          method: 'GET',
          headers: {
            'Authorization': this.apiToken,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(`⚠️ Erro ao buscar tasks: ${response.statusText} - ${errorText}`);
        return null;
      }

      const data = await response.json();
      const tasks: any[] = data.tasks || [];

      if (tasks.length === 0) {
        this.logger.debug(`🔍 Nenhuma task encontrada para email: ${email}, projeto: ${projeto}`);
        return null;
      }

      // Se encontrou tasks, buscar detalhes da primeira (deve ser a única com esses filtros)
      if (tasks.length > 0) {
        const taskDetails = await this.buscarTaskDetalhes(tasks[0].id);
        if (taskDetails) {
          this.logger.debug(`✅ Task existente encontrada: ${tasks[0].id}`);
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
      
      // Garantir que o campo "produto" está usando o ID correto
      if (!this.customFieldIds.get('produto') || this.customFieldIds.get('produto') !== this.PRODUTO_FIELD_ID) {
        this.logger.log(`🔧 Forçando uso do ID fixo do campo "Produto": ${this.PRODUTO_FIELD_ID}`);
        this.customFieldIds.set('produto', this.PRODUTO_FIELD_ID);
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

      // Produto (campo de label - usar ID fixo)
      const produtoFieldId = this.PRODUTO_FIELD_ID; // Sempre usar o ID fixo correto
      if (produtoFieldId) {
        const labelId = this.obterIdLabelProduto(dados.produto);
        this.logger.debug(`🔍 Produto: "${dados.produto}" → Label ID: ${labelId || 'NÃO ENCONTRADO'}`);
        
        if (!labelId) {
          this.logger.warn(`⚠️ ID do label não encontrado para produto: "${dados.produto}"`);
          this.logger.warn(`   Tentando usar nome do label...`);
        }
        
        // ClickUp: value deve ser array de strings (IDs das opções)
        // Formato: { "id": "field-id", "value": ["option-id"] }
        const produtoValue = labelId
          ? [labelId] // Array de strings com o ID da opção
          : null; // Se não encontrou ID, não enviar (ou criar label primeiro)
        
        if (produtoValue) {
          this.logger.debug(`📦 Valor do produto sendo enviado: ${JSON.stringify(produtoValue)}`);
          this.logger.debug(`   Campo ID: ${produtoFieldId}`);
          this.logger.debug(`   Label ID: ${labelId}`);
          
          customFields.push({
            id: produtoFieldId,
            value: produtoValue, // Array de strings: ["id-da-opcao"]
          });
        } else {
          this.logger.warn(`⚠️ Não foi possível definir produto: ID do label não encontrado para "${dados.produto}"`);
        }
      } else {
        this.logger.warn(`⚠️ Campo "produto" não encontrado nos custom fields`);
      }

      // Backend Projeto
      const projetoFieldId = this.customFieldIds.get('backend_projeto');
      if (projetoFieldId && dados.projeto) {
        customFields.push({
          id: projetoFieldId,
          value: dados.projeto,
        });
      }

      // Atualizar task (sem tags no body, vamos adicionar individualmente)
      // NUNCA editar o nome da tarefa - manter o nome existente
      const updateData: any = {};

      // Só atualizar nome se:
      // 1. O nome atual da task está vazio E
      // 2. O novo nome não está vazio
      const nomeAtual = task.name || '';
      const novoNome = dados.nome_lead || '';
      
      if (!nomeAtual.trim() && novoNome.trim()) {
        // Só atualizar se o nome atual está vazio e temos um nome válido
        updateData.name = novoNome;
        this.logger.debug(`📝 Atualizando nome da task (estava vazio): "${novoNome}"`);
      } else if (nomeAtual.trim() && !novoNome.trim()) {
        // Se o nome atual existe mas o novo está vazio, NÃO atualizar
        this.logger.debug(`⚠️ Nome da task não será atualizado (novo nome está vazio, mantendo: "${nomeAtual}")`);
      } else if (nomeAtual.trim() && novoNome.trim() && nomeAtual !== novoNome) {
        // Se ambos existem mas são diferentes, NÃO atualizar (manter o existente)
        this.logger.debug(`⚠️ Nome da task não será atualizado (mantendo nome existente: "${nomeAtual}")`);
      }
      // Se ambos estão vazios ou são iguais, não fazer nada

      if (customFields.length > 0) {
        updateData.custom_fields = customFields;
      }

      // Se não há nada para atualizar (nem nome nem custom fields), pular a atualização
      if (Object.keys(updateData).length === 0) {
        this.logger.debug(`ℹ️ Nada para atualizar na task ${task.id} (nome preservado, sem custom fields novos)`);
        // Ainda precisamos adicionar as tags, então continuar
      } else {
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
          let errorDetails = '';
          try {
            const errorJson = JSON.parse(errorText);
            errorDetails = `\n   Código: ${errorJson.ECODE || 'N/A'}\n   Mensagem: ${errorJson.err || errorText}\n   Dados enviados: ${JSON.stringify(updateData, null, 2)}`;
          } catch {
            errorDetails = `\n   Resposta: ${errorText}\n   Dados enviados: ${JSON.stringify(updateData, null, 2)}`;
          }
          this.logger.error(`❌ Erro ao atualizar task no ClickUp:`);
          this.logger.error(`   Status: ${response.status} ${response.statusText}`);
          this.logger.error(`   Detalhes: ${errorDetails}`);
          throw new Error(`ClickUp API error: ${response.status} - ${errorText}`);
        }

        this.logger.log(`✅ Task atualizada no ClickUp com ID: ${task.id}`);
      }

      // Adicionar tags individualmente usando o endpoint específico
      if (tagsMerged.length > 0) {
        await this.adicionarTagsATask(task.id, tagsMerged, tagsExistentes);
      }
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

      // Produto (campo de label - usar ID fixo)
      const produtoFieldId = this.PRODUTO_FIELD_ID; // Sempre usar o ID fixo correto
      if (produtoFieldId) {
        // Produto é campo de label - precisa ser array de IDs ou objetos
        const labelId = this.obterIdLabelProduto(dados.produto);
        this.logger.debug(`🔍 Produto: "${dados.produto}" → Label ID: ${labelId || 'NÃO ENCONTRADO'}`);
        
        if (!labelId) {
          this.logger.warn(`⚠️ ID do label não encontrado para produto: "${dados.produto}"`);
          this.logger.warn(`   Tentando usar nome do label...`);
        }
        
        // ClickUp: value deve ser array de strings (IDs das opções)
        // Formato: { "id": "field-id", "value": ["option-id"] }
        const produtoValue = labelId
          ? [labelId] // Array de strings com o ID da opção
          : null; // Se não encontrou ID, não enviar (ou criar label primeiro)
        
        if (produtoValue) {
          this.logger.debug(`📦 Valor do produto sendo enviado: ${JSON.stringify(produtoValue)}`);
          this.logger.debug(`   Campo ID: ${produtoFieldId}`);
          this.logger.debug(`   Label ID: ${labelId}`);
          
          customFields.push({
            id: produtoFieldId,
            value: produtoValue, // Array de strings: ["id-da-opcao"]
          });
        } else {
          this.logger.warn(`⚠️ Não foi possível definir produto: ID do label não encontrado para "${dados.produto}"`);
        }
      } else {
        this.logger.warn(`⚠️ Campo "produto" não encontrado nos custom fields`);
      }

      const projetoFieldId = this.customFieldIds.get('backend_projeto');
      if (projetoFieldId && dados.projeto) {
        customFields.push({
          id: projetoFieldId,
          value: dados.projeto,
        });
      }

      // Garantir que o nome não está vazio ao criar
      const nomeTask = (dados.nome_lead || '').trim();
      if (!nomeTask) {
        this.logger.warn(`⚠️ Nome do lead está vazio! Usando email como fallback: ${dados.email_lead}`);
      }

      const taskData: any = {
        name: nomeTask || dados.email_lead || 'Lead sem nome', // Fallback para evitar nome vazio
      };

      // Não adicionar tags no body da criação, vamos adicionar depois
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
        let errorDetails = '';
        try {
          const errorJson = JSON.parse(errorText);
          errorDetails = `\n   Código: ${errorJson.ECODE || 'N/A'}\n   Mensagem: ${errorJson.err || errorText}`;
          if (errorJson.ECODE === 'FIELD_158' || errorJson.err?.includes('option id')) {
            errorDetails += `\n   ⚠️ Campo de produto com ID inválido!`;
            errorDetails += `\n   Produto recebido: "${dados.produto}"`;
            errorDetails += `\n   ID do label encontrado: ${this.obterIdLabelProduto(dados.produto) || 'NÃO ENCONTRADO'}`;
            errorDetails += `\n   Custom field ID do produto: ${this.customFieldIds.get('produto') || 'NÃO ENCONTRADO'}`;
          }
          errorDetails += `\n   Dados enviados: ${JSON.stringify(taskData, null, 2)}`;
        } catch {
          errorDetails = `\n   Resposta: ${errorText}\n   Dados enviados: ${JSON.stringify(taskData, null, 2)}`;
        }
        this.logger.error(`❌ Erro ao criar task no ClickUp:`);
        this.logger.error(`   Status: ${response.status} ${response.statusText}`);
        this.logger.error(`   Detalhes: ${errorDetails}`);
        throw new Error(`ClickUp API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const taskId = result.id;
      
      // Adicionar tags individualmente após criar a task
      if (dados.acao_tomada && dados.acao_tomada.length > 0) {
        await this.adicionarTagsATask(taskId, dados.acao_tomada, []);
      }
      
      this.logger.log(`✅ Nova task criada no ClickUp com ID: ${taskId}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao criar task no ClickUp: ${error.message}`);
      throw error;
    }
  }

  private async adicionarTagsATask(
    taskId: string,
    tagsParaAdicionar: string[],
    tagsExistentes: string[],
  ): Promise<void> {
    if (!this.apiToken || !taskId || tagsParaAdicionar.length === 0) return;

    try {
      // Filtrar apenas tags que ainda não existem
      const tagsNovas = tagsParaAdicionar.filter(
        (tag) => !tagsExistentes.includes(tag),
      );

      if (tagsNovas.length === 0) {
        this.logger.debug(`ℹ️ Todas as tags já existem na task ${taskId}`);
        return;
      }

      this.logger.debug(`🏷️ Adicionando ${tagsNovas.length} tags à task ${taskId}: [${tagsNovas.join(', ')}]`);

      // Adicionar cada tag individualmente usando o endpoint POST /task/{task_id}/tag/{tag_name}
      for (const tag of tagsNovas) {
        try {
          // Codificar o nome da tag para URL (pode conter caracteres especiais)
          const tagEncoded = encodeURIComponent(tag);
          
          const response = await fetch(
            `${this.baseUrl}/task/${taskId}/tag/${tagEncoded}`,
            {
              method: 'POST',
              headers: {
                'Authorization': this.apiToken,
                'Content-Type': 'application/json',
              },
            },
          );

          if (!response.ok) {
            const errorText = await response.text();
            // Se a tag já existe, não é um erro crítico
            if (response.status === 400 && errorText.includes('already')) {
              this.logger.debug(`ℹ️ Tag "${tag}" já existe na task ${taskId}`);
            } else {
              this.logger.warn(`⚠️ Erro ao adicionar tag "${tag}" à task ${taskId}: ${response.statusText} - ${errorText}`);
            }
          } else {
            this.logger.debug(`✅ Tag "${tag}" adicionada à task ${taskId}`);
          }
        } catch (error) {
          this.logger.warn(`⚠️ Erro ao adicionar tag "${tag}": ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao adicionar tags à task: ${error.message}`);
      // Não interrompe o fluxo, apenas loga o erro
    }
  }
}

