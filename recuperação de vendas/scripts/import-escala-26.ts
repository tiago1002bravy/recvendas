import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config();

interface CsvRow {
  'Código da venda': string;
  'Data': string;
  'Nome do cliente': string;
  'Email do cliente': string;
  'Método de pagamento': string;
  'Valor Bruto': string;
  'Valor Líquido': string;
  'Telefone': string;
  'Nome do produto': string;
  'Código da Oferta': string;
  'Nome da Oferta': string;
  'Status da venda': string;
  'Erro do processamento': string;
  'Documento': string;
  'Tipo de documento': string;
  'Estado do cliente': string;
  'Cidade do cliente': string;
  'Bairro do cliente': string;
  'CEP do cliente': string;
  'Endereço do cliente': string;
  'Complemento do endereço': string;
  'Número do cliente': string;
  'Co-Produtor': string;
  'Gerente de afiliados': string;
  'Nome do afiliado': string;
  'Afiliado': string;
  'Data de pagamento': string;
  'Código País': string;
  'Parcelas contrato assinatura': string;
  'Parcela atual': string;
  'Cupom': string;
  'utm_source': string;
  'utm_medium': string;
  'utm_campaign': string;
  'utm_content': string;
  'utm_term': string;
}

interface ProcessedRecord {
  nome_lead: string;
  email_lead: string;
  whatsapp_lead: string;
  valor: number;
  liquidado: number;
  produto: string;
  acao_tomada: string[];
  id_original: string | null;
  created_original: string | null;
  projeto: string;
  utms: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  } | null;
  dados_originais: Record<string, any>;
}

// Converter data de DD/MM/YYYY HH:MM:SS para ISO 8601
function convertDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  try {
    // Formato: "09/12/2025 22:05:15"
    const [datePart, timePart] = dateStr.trim().split(' ');
    const [day, month, year] = datePart.split('/');
    
    if (!timePart) {
      // Se não tem hora, usar 00:00:00
      return `${year}-${month}-${day}T00:00:00Z`;
    }
    
    const [hour, minute, second] = timePart.split(':');
    return `${year}-${month}-${day}T${hour}:${minute}:${second || '00'}Z`;
  } catch (error) {
    console.error(`Erro ao converter data: ${dateStr}`, error);
    return null;
  }
}

// Converter número, tratando vazios
function parseNumber(value: string, defaultValue: number = 0): number {
  if (!value || value.trim() === '') return defaultValue;
  const parsed = parseFloat(value.replace(',', '.'));
  return isNaN(parsed) ? defaultValue : parsed;
}

// Processar uma linha do CSV
function processRow(row: CsvRow): ProcessedRecord {
  // Construir objeto utms
  const utmSource = row.utm_source?.trim();
  const utmMedium = row.utm_medium?.trim();
  const utmCampaign = row.utm_campaign?.trim();
  const utmContent = row.utm_content?.trim();
  const utmTerm = row.utm_term?.trim();

  // Se todos os UTMs estão vazios, definir como null
  const utms: ProcessedRecord['utms'] = 
    (utmSource || utmMedium || utmCampaign || utmContent || utmTerm)
      ? {
          utm_source: utmSource || undefined,
          utm_medium: utmMedium || undefined,
          utm_campaign: utmCampaign || undefined,
          utm_content: utmContent || undefined,
          utm_term: utmTerm || undefined,
        }
      : null;

  // Construir dados_originais
  const dados_originais: Record<string, any> = {
    metodo_pagamento: row['Método de pagamento']?.trim() || null,
    codigo_oferta: row['Código da Oferta']?.trim() || null,
    nome_oferta: row['Nome da Oferta']?.trim() || null,
    erro_processamento: row['Erro do processamento']?.trim() || null,
    documento: row.Documento?.trim() || null,
    tipo_documento: row['Tipo de documento']?.trim() || null,
    estado: row['Estado do cliente']?.trim() || null,
    cidade: row['Cidade do cliente']?.trim() || null,
    bairro: row['Bairro do cliente']?.trim() || null,
    cep: row['CEP do cliente']?.trim() || null,
    endereco: row['Endereço do cliente']?.trim() || null,
    complemento: row['Complemento do endereço']?.trim() || null,
    numero: row['Número do cliente']?.trim() || null,
    co_produtor: row['Co-Produtor']?.trim() || null,
    gerente_afiliados: row['Gerente de afiliados']?.trim() || null,
    nome_afiliado: row['Nome do afiliado']?.trim() || null,
    afiliado: row.Afiliado?.trim() || null,
    codigo_pais: row['Código País']?.trim() || null,
    parcelas_contrato: row['Parcelas contrato assinatura']?.trim() || null,
    parcela_atual: row['Parcela atual']?.trim() || null,
    cupom: row.Cupom?.trim() || null,
  };

  // Converter data de pagamento se existir
  if (row['Data de pagamento']?.trim()) {
    dados_originais.data_pagamento = convertDate(row['Data de pagamento']);
  } else {
    dados_originais.data_pagamento = null;
  }

  // Remover campos null/vazios para limpar o JSON
  Object.keys(dados_originais).forEach(key => {
    if (dados_originais[key] === null || dados_originais[key] === '') {
      delete dados_originais[key];
    }
  });

  return {
    nome_lead: row['Nome do cliente']?.trim() || '',
    email_lead: row['Email do cliente']?.trim().toLowerCase() || '',
    whatsapp_lead: row.Telefone?.trim() || '',
    valor: parseNumber(row['Valor Bruto']),
    liquidado: parseNumber(row['Valor Líquido'], 0),
    produto: row['Nome do produto']?.trim() || '',
    acao_tomada: [row['Status da venda']?.trim() || 'unknown'],
    id_original: row['Código da venda']?.trim() || null,
    created_original: convertDate(row.Data),
    projeto: 'escala-26',
    utms: utms,
    dados_originais: Object.keys(dados_originais).length > 0 ? dados_originais : null,
  };
}

// Função principal
async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
    process.exit(1);
  }

  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
  const csvPath = path.join(__dirname, '..', 'Exportação – escala 26.csv');

  console.log('📂 Lendo arquivo CSV...');
  const csvContent = readFileSync(csvPath, 'utf-8');

  console.log('📊 Parseando CSV...');
  const records: CsvRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });

  console.log(`✅ ${records.length} registros encontrados no CSV\n`);

  // Processar registros e agrupar por email para fazer merge
  const recordsByEmail = new Map<string, ProcessedRecord[]>();

  for (const row of records) {
    const processed = processRow(row);
    const email = processed.email_lead;

    if (!email) {
      console.warn(`⚠️  Linha ignorada: email vazio`);
      continue;
    }

    if (!recordsByEmail.has(email)) {
      recordsByEmail.set(email, []);
    }
    recordsByEmail.get(email)!.push(processed);
  }

  console.log(`📧 ${recordsByEmail.size} emails únicos encontrados\n`);

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  // Processar cada email
  for (const [email, emailRecords] of recordsByEmail.entries()) {
    try {
      // Se há múltiplos registros para o mesmo email, fazer merge
      let mergedRecord: ProcessedRecord;

      if (emailRecords.length === 1) {
        mergedRecord = emailRecords[0];
      } else {
        // Merge: combinar todos os status, usar o último registro para outros campos
        const allStatuses = new Set<string>();
        emailRecords.forEach(r => {
          r.acao_tomada.forEach(s => allStatuses.add(s));
        });

        // Usar o último registro como base (assumindo que é o mais recente)
        mergedRecord = { ...emailRecords[emailRecords.length - 1] };
        mergedRecord.acao_tomada = Array.from(allStatuses);

        // Se houver múltiplos valores, usar o maior valor
        mergedRecord.valor = Math.max(...emailRecords.map(r => r.valor));
        mergedRecord.liquidado = Math.max(...emailRecords.map(r => r.liquidado));

        console.log(`  🔄 Merge de ${emailRecords.length} registros para ${email}`);
      }

      // Verificar se já existe registro com mesmo email + projeto
      const { data: existing, error: selectError } = await supabase
        .from('recuperacao_vendas')
        .select('id, acao_tomada')
        .eq('email_lead', email)
        .eq('projeto', 'escala-26')
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      if (existing) {
        // Atualizar registro existente
        const existingStatuses = existing.acao_tomada || [];
        const newStatuses = mergedRecord.acao_tomada || [];
        const mergedStatuses = Array.from(new Set([...existingStatuses, ...newStatuses]));

        const { error: updateError } = await supabase
          .from('recuperacao_vendas')
          .update({
            nome_lead: mergedRecord.nome_lead,
            valor: mergedRecord.valor,
            liquidado: mergedRecord.liquidado,
            acao_tomada: mergedStatuses,
            produto: mergedRecord.produto,
            whatsapp_lead: mergedRecord.whatsapp_lead,
            id_original: mergedRecord.id_original,
            created_original: mergedRecord.created_original,
            utms: mergedRecord.utms,
            dados_originais: mergedRecord.dados_originais,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) {
          throw updateError;
        }

        updated++;
        console.log(`  ✅ Atualizado: ${email}`);
      } else {
        // Inserir novo registro
        const { error: insertError } = await supabase
          .from('recuperacao_vendas')
          .insert([mergedRecord]);

        if (insertError) {
          throw insertError;
        }

        inserted++;
        console.log(`  ➕ Inserido: ${email}`);
      }
    } catch (error: any) {
      errors++;
      console.error(`  ❌ Erro ao processar ${email}:`, error.message);
    }
  }

  console.log('\n📊 Resumo da Importação:');
  console.log(`  ➕ Novos registros: ${inserted}`);
  console.log(`  🔄 Registros atualizados: ${updated}`);
  console.log(`  ❌ Erros: ${errors}`);
  console.log(`  📧 Total de emails processados: ${recordsByEmail.size}`);
}

// Executar
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});



