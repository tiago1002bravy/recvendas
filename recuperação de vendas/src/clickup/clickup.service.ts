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

export interface ClickUpVendaData {
  nome_lead: string;
  valor: number;
  liquidado: number;
  acao_tomada: string[];
  produto: string;
  email_lead: string;
  whatsapp_lead: string;
  projeto?: string;
}

@Injectable()
export class ClickUpService {
  private readonly logger = new Logger(ClickUpService.name);
  private readonly apiToken: string;
  private readonly listId: string = '901305222206';
  private readonly baseUrl = 'https://api.clickup.com/api/v2';
  private customFieldIds: Map<string, string> = new Map();
  private produtoLabelIds: Map<string, string> = new Map();

  // ID fixo do campo "Produto"
  private readonly PRODUTO_FIELD_ID = 'b01ec9fe-187c-4e49-8d0e-5f40d24ed3f3';

  // IDs fixos dos labels de produto
  private readonly produtoLabelIdsFixos: Map<string, string> = new Map([
    ['ingresso escala 26', '000859e0-a3fb-482a-9042-b9eb72e7afec'],
    ['ingresso-escala-26', '000859e0-a3fb-482a-9042-b9eb72e7afec'],
    ['ingressoescala26', '000859e0-a3fb-482a-9042-b9eb72e7afec'],
    ['ingresso + template escala 26', '46f2f9e5-c903-4ea4-be76-2d95f45a8ae0'],
    ['ingresso+template-escala-26', '46f2f9e5-c903-4ea4-be76-2d95f45a8ae0'],
    ['ingresso+template escala 26', '46f2f9e5-c903-4ea4-be76-2d95f45a8ae0'],
    ['ingressotemplateescala26', '46f2f9e5-c903-4ea4-be76-2d95f45a8ae0'],
  ]);

  constructor(private configService: ConfigService) {
    this.apiToken =
      this.configService.get<string>('CLICKUP_API_TOKEN') ||
      this.configService.get<string>('CLICKUP_TOKEN') ||
      '';

    if (!this.apiToken) {
      this.logger.warn(
        '⚠️ CLICKUP_API_TOKEN/CLICKUP_TOKEN não configurado. Integração com ClickUp desabilitada.',
      );
    } else {
      this.logger.log('✅ Cliente ClickUp inicializado');
      this.carregarCustomFields().catch((error) => {
        this.logger.warn(`⚠️ Erro ao carregar custom fields na inicialização: ${error.message}`);
      });
    }
  }

  private async carregarCustomFields(): Promise<void> {
    if (!this.apiToken) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${this.baseUrl}/list/${this.listId}/field`, {
        method: 'GET',
        headers: {
          Authorization: this.apiToken,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        this.logger.warn(`⚠️ Erro ao carregar custom fields: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      const fields: ClickUpCustomField[] = data.fields || [];

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
          this.customFieldIds.set('produto', this.PRODUTO_FIELD_ID);
          if (field.id === this.PRODUTO_FIELD_ID && (field.type === 'labels' || field.type === 'label')) {
            this.carregarLabelsProduto(this.PRODUTO_FIELD_ID);
          } else if (field.id !== this.PRODUTO_FIELD_ID) {
            this.logger.debug(
              `ℹ️ Campo "produto" encontrado com ID diferente: ${field.id}. Usando ID fixo: ${this.PRODUTO_FIELD_ID}`,
            );
            this.carregarLabelsProduto(this.PRODUTO_FIELD_ID);
          }
        } else if (nameLower.includes('backend_projeto') || nameLower.includes('projeto')) {
          this.customFieldIds.set('backend_projeto', field.id);
        }
      });

      this.logger.log(`✅ Custom fields carregados: ${this.customFieldIds.size} campos mapeados`);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.logger.warn('⚠️ Timeout ao carregar custom fields');
      } else {
        this.logger.warn(`⚠️ Erro ao carregar custom fields: ${error.message}`);
      }
    }
  }

  private async carregarLabelsProduto(fieldId: string): Promise<void> {
    if (!this.apiToken) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${this.baseUrl}/list/${this.listId}/field`, {
        method: 'GET',
        headers: {
          Authorization: this.apiToken,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        this.logger.debug(
          `ℹ️ Não foi possível carregar labels dinamicamente (${fieldId}): ${response.statusText}. Usando IDs fixos.`,
        );
        return;
      }

      const data = await response.json();
      const fields: any[] = data.fields || [];

      const produtoField = fields.find((f: any) => f.id === fieldId);

      if (!produtoField) {
        this.logger.debug(`ℹ️ Campo de produto (${fieldId}) não encontrado na lista. Usando IDs fixos.`);
        return;
      }

      const options = produtoField.type_config?.options || produtoField.options || [];

      if (options && options.length > 0) {
        options.forEach((option: any) => {
          const labelName = option.label || option.name || option.value;
          const labelId = option.id || option.value;
          if (labelName && labelId) {
            const nomeNormalizado = labelName.toLowerCase().trim();
            this.produtoLabelIds.set(nomeNormalizado, labelId);
            this.produtoLabelIds.set(labelName, labelId);
          }
        });

        this.logger.debug(
          `✅ Labels de produto carregados dinamicamente: ${this.produtoLabelIds.size} labels mapeados`,
        );
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.logger.debug('⚠️ Timeout ao carregar labels do produto. Usando IDs fixos.');
      } else {
        this.logger.debug(`ℹ️ Erro ao carregar labels do produto: ${error.message}. Usando IDs fixos.`);
      }
    }
  }

  private obterIdLabelProduto(nomeProduto: string): string | null {
    const nomeNormalizado = nomeProduto.toLowerCase().trim();
    if (this.produtoLabelIdsFixos.has(nomeNormalizado)) {
      const id = this.produtoLabelIdsFixos.get(nomeNormalizado) || null;
      this.logger.debug(`✅ ID encontrado nos fixos: "${nomeProduto}" → ${id}`);
      return id;
    }

    const nomeSemEspacos = nomeNormalizado.replace(/[+\s-]/g, '');
    for (const [key, id] of this.produtoLabelIdsFixos.entries()) {
      const keySemEspacos = key.replace(/[+\s-]/g, '');
      if (keySemEspacos === nomeSemEspacos) {
        this.logger.debug(`✅ ID encontrado nos fixos (normalizado): "${nomeProduto}" → ${id}`);
        return id;
      }
    }

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

    for (const [key, id] of this.produtoLabelIds.entries()) {
      const keyNormalizado = key.toLowerCase().replace(/[+\s-]/g, '');
      if (keyNormalizado === nomeSemEspacos) {
        this.logger.debug(`✅ ID encontrado nos dinâmicos (parcial): "${nomeProduto}" → ${id}`);
        return id;
      }
    }

    this.logger.warn(`⚠️ ID do label não encontrado para: "${nomeProduto}"`);
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

      const customFieldsFilter: any[] = [
        {
          field_id: emailFieldId,
          operator: '=',
          value: email,
        },
      ];

      if (projeto && projetoFieldId) {
        customFieldsFilter.push({
          field_id: projetoFieldId,
          operator: '=',
          value: projeto,
        });
      }

      this.logger.debug(`🔍 Buscando task por email: ${email}, projeto: ${projeto || 'N/A'}`);

      const filtersEncoded = encodeURIComponent(JSON.stringify(customFieldsFilter));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(
        `${this.baseUrl}/list/${this.listId}/task?archived=false&include_closed=true&custom_fields=${filtersEncoded}`,
        {
          method: 'GET',
          headers: {
            Authorization: this.apiToken,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

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

      if (tasks.length > 0) {
        const taskDetails = await this.buscarTaskDetalhes(tasks[0].id);
        if (taskDetails) {
          this.logger.debug(`✅ Task existente encontrada: ${tasks[0].id}`);
          return taskDetails;
        }
      }

      return null;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.logger.warn('⚠️ Timeout ao buscar task');
      } else {
        this.logger.error(`❌ Erro ao buscar task: ${error.message}`);
      }
      return null;
    }
  }

  private async buscarTaskDetalhes(taskId: string): Promise<ClickUpTask | null> {
    if (!this.apiToken) return null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${this.baseUrl}/task/${taskId}`, {
        method: 'GET',
        headers: {
          Authorization: this.apiToken,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.logger.warn('⚠️ Timeout ao buscar detalhes da task');
      } else {
        this.logger.error(`❌ Erro ao buscar detalhes da task: ${error.message}`);
      }
      return null;
    }
  }

  async salvarRecuperacaoVenda(dados: ClickUpVendaData): Promise<void> {
    if (!this.apiToken) {
      this.logger.debug('⚠️ ClickUp não configurado, pulando salvamento');
      return;
    }

    try {
      if (this.customFieldIds.size === 0) {
        await this.carregarCustomFields();
      }

      if (!this.customFieldIds.get('produto') || this.customFieldIds.get('produto') !== this.PRODUTO_FIELD_ID) {
        this.logger.log(`🔧 Forçando uso do ID fixo do campo "Produto": ${this.PRODUTO_FIELD_ID}`);
        this.customFieldIds.set('produto', this.PRODUTO_FIELD_ID);
      }

      const projeto = dados.projeto || 'default';

      if (projeto) {
        const taskExistente = await this.buscarTaskPorEmailEProjeto(dados.email_lead, projeto);

        if (taskExistente) {
          await this.atualizarTask(taskExistente, dados);
          return;
        }
      }

      await this.criarTask(dados);
    } catch (error: any) {
      this.logger.error(`❌ Erro ao salvar no ClickUp: ${error.message}`);
    }
  }

  private async atualizarTask(task: ClickUpTask, dados: ClickUpVendaData): Promise<void> {
    if (!this.apiToken || !task.id) return;

    try {
      const tagsExistentes = (task.tags || []).map((t: any) => (typeof t === 'string' ? t : t.name || t));
      const tagsNovas = dados.acao_tomada || [];
      const tagsMerged = [...new Set([...tagsExistentes, ...tagsNovas])];

      this.logger.log(
        `🔄 Task existente encontrada (email: ${dados.email_lead}, projeto: ${dados.projeto})`,
      );
      this.logger.log(`   Tags existentes: [${tagsExistentes.join(', ')}]`);
      this.logger.log(`   Novas tags: [${tagsNovas.join(', ')}]`);
      this.logger.log(`   Tags após merge: [${tagsMerged.join(', ')}]`);

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

      const produtoFieldId = this.PRODUTO_FIELD_ID;
      if (produtoFieldId) {
        const labelId = this.obterIdLabelProduto(dados.produto);
        this.logger.debug(`🔍 Produto: "${dados.produto}" → Label ID: ${labelId || 'NÃO ENCONTRADO'}`);

        const produtoValue = labelId ? [labelId] : null;

        if (produtoValue) {
          customFields.push({
            id: produtoFieldId,
            value: produtoValue,
          });
        } else {
          this.logger.warn(`⚠️ Não foi possível definir produto: ID do label não encontrado para "${dados.produto}"`);
        }
      }

      const projetoFieldId = this.customFieldIds.get('backend_projeto');
      if (projetoFieldId && dados.projeto) {
        customFields.push({
          id: projetoFieldId,
          value: dados.projeto,
        });
      }

      const updateData: any = {};

      const nomeAtual = task.name || '';
      const novoNome = dados.nome_lead || '';

      if (!nomeAtual.trim() && novoNome.trim()) {
        updateData.name = novoNome;
        this.logger.debug(`📝 Atualizando nome da task (estava vazio): "${novoNome}"`);
      }

      if (customFields.length > 0) {
        updateData.custom_fields = customFields;
      }

      if (Object.keys(updateData).length === 0) {
        this.logger.debug(`ℹ️ Nada para atualizar na task ${task.id} (nome preservado, sem custom fields novos)`);
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(`${this.baseUrl}/task/${task.id}`, {
          method: 'PUT',
          headers: {
            Authorization: this.apiToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(`❌ Erro ao atualizar task no ClickUp:`);
          this.logger.error(`   Status: ${response.status} ${response.statusText}`);
          this.logger.error(`   Detalhes: ${errorText}`);
          throw new Error(`ClickUp API error: ${response.status} - ${errorText}`);
        }

        this.logger.log(`✅ Task atualizada no ClickUp com ID: ${task.id}`);
      }

      if (tagsMerged.length > 0) {
        await this.adicionarTagsATask(task.id, tagsMerged, tagsExistentes);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.logger.warn('⚠️ Timeout ao atualizar task');
      } else {
        this.logger.error(`❌ Erro ao atualizar task no ClickUp: ${error.message}`);
      }
      throw error;
    }
  }

  private async criarTask(dados: ClickUpVendaData): Promise<void> {
    if (!this.apiToken) return;

    try {
      this.logger.log(
        `📝 Criando nova task (email: ${dados.email_lead}, projeto: ${dados.projeto || 'N/A'})`,
      );

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

      const produtoFieldId = this.PRODUTO_FIELD_ID;
      if (produtoFieldId) {
        const labelId = this.obterIdLabelProduto(dados.produto);
        this.logger.debug(`🔍 Produto: "${dados.produto}" → Label ID: ${labelId || 'NÃO ENCONTRADO'}`);

        const produtoValue = labelId ? [labelId] : null;

        if (produtoValue) {
          customFields.push({
            id: produtoFieldId,
            value: produtoValue,
          });
        } else {
          this.logger.warn(`⚠️ Não foi possível definir produto: ID do label não encontrado para "${dados.produto}"`);
        }
      }

      const projetoFieldId = this.customFieldIds.get('backend_projeto');
      if (projetoFieldId && dados.projeto) {
        customFields.push({
          id: projetoFieldId,
          value: dados.projeto,
        });
      }

      const nomeTask = (dados.nome_lead || '').trim();
      if (!nomeTask) {
        this.logger.warn(`⚠️ Nome do lead está vazio! Usando email como fallback: ${dados.email_lead}`);
      }

      const taskData: any = {
        name: nomeTask || dados.email_lead || 'Lead sem nome',
      };

      if (customFields.length > 0) {
        taskData.custom_fields = customFields;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${this.baseUrl}/list/${this.listId}/task`, {
        method: 'POST',
        headers: {
          Authorization: this.apiToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`❌ Erro ao criar task no ClickUp:`);
        this.logger.error(`   Status: ${response.status} ${response.statusText}`);
        this.logger.error(`   Detalhes: ${errorText}`);
        throw new Error(`ClickUp API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const taskId = result.id;

      if (dados.acao_tomada && dados.acao_tomada.length > 0) {
        await this.adicionarTagsATask(taskId, dados.acao_tomada, []);
      }

      this.logger.log(`✅ Nova task criada no ClickUp com ID: ${taskId}`);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.logger.warn('⚠️ Timeout ao criar task');
      } else {
        this.logger.error(`❌ Erro ao criar task no ClickUp: ${error.message}`);
      }
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
      const tagsNovas = tagsParaAdicionar.filter((tag) => !tagsExistentes.includes(tag));

      if (tagsNovas.length === 0) {
        this.logger.debug(`ℹ️ Todas as tags já existem na task ${taskId}`);
        return;
      }

      this.logger.debug(`🏷️ Adicionando ${tagsNovas.length} tags à task ${taskId}: [${tagsNovas.join(', ')}]`);

      for (const tag of tagsNovas) {
        try {
          const tagEncoded = encodeURIComponent(tag);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(`${this.baseUrl}/task/${taskId}/tag/${tagEncoded}`, {
            method: 'POST',
            headers: {
              Authorization: this.apiToken,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 400 && errorText.includes('already')) {
              this.logger.debug(`ℹ️ Tag "${tag}" já existe na task ${taskId}`);
            } else {
              this.logger.warn(`⚠️ Erro ao adicionar tag "${tag}" à task ${taskId}: ${response.statusText} - ${errorText}`);
            }
          } else {
            this.logger.debug(`✅ Tag "${tag}" adicionada à task ${taskId}`);
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            this.logger.warn(`⚠️ Timeout ao adicionar tag "${tag}"`);
          } else {
            this.logger.warn(`⚠️ Erro ao adicionar tag "${tag}": ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      this.logger.error(`❌ Erro ao adicionar tags à task: ${error.message}`);
    }
  }
}

