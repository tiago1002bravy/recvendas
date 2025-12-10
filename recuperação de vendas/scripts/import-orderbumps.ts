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
  dados_originais: Record<string, any>;
}

// Converter data de DD/MM/YYYY HH:MM:SS para ISO 8601
function convertDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  try {
    const [datePart, timePart] = dateStr.trim().split(' ');
    const [day, month, year] = datePart.split('/');
    
    if (!timePart) {
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
    tipo_produto: 'orderbump', // Marcar como orderbump
  };

  // Converter data de pagamento se existir
  if (row['Data de pagamento']?.trim()) {
    dados_originais.data_pagamento = convertDate(row['Data de pagamento']);
  } else {
    dados_originais.data_pagamento = null;
  }

  // Remover campos null/vazios
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
  const csvPath = path.join(__dirname, '..', 'orderbumps.csv');

  console.log('📂 Lendo arquivo CSV de orderbumps...');
  const csvContent = readFileSync(csvPath, 'utf-8');

  console.log('📊 Parseando CSV...');
  const records: CsvRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });

  console.log(`✅ ${records.length} registros encontrados no CSV\n`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // Processar cada registro
  for (const row of records) {
    try {
      const processed = processRow(row);
      const email = processed.email_lead;
      const produto = processed.produto;

      if (!email) {
        console.warn(`⚠️  Linha ignorada: email vazio`);
        skipped++;
        continue;
      }

      if (!produto) {
        console.warn(`⚠️  Linha ignorada: produto vazio`);
        skipped++;
        continue;
      }

      // Para orderbumps, verificar se já existe registro com mesmo email + projeto + produto
      // Se existir, atualizar. Se não, inserir novo.
      const { data: existing, error: selectError } = await supabase
        .from('recuperacao_vendas')
        .select('id, acao_tomada')
        .eq('email_lead', email)
        .eq('projeto', 'escala-26')
        .eq('produto', produto)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      if (existing) {
        // Atualizar registro existente (mesmo email + projeto + produto)
        const existingStatuses = existing.acao_tomada || [];
        const newStatuses = processed.acao_tomada || [];
        const mergedStatuses = Array.from(new Set([...existingStatuses, ...newStatuses]));

        const { error: updateError } = await supabase
          .from('recuperacao_vendas')
          .update({
            nome_lead: processed.nome_lead,
            valor: processed.valor,
            liquidado: processed.liquidado,
            acao_tomada: mergedStatuses,
            whatsapp_lead: processed.whatsapp_lead,
            id_original: processed.id_original,
            created_original: processed.created_original,
            dados_originais: processed.dados_originais,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) {
          throw updateError;
        }

        updated++;
        console.log(`  🔄 Atualizado: ${email} - ${produto}`);
      } else {
        // Inserir novo registro (produto diferente ou novo cliente)
        const { error: insertError } = await supabase
          .from('recuperacao_vendas')
          .insert([processed]);

        if (insertError) {
          throw insertError;
        }

        inserted++;
        console.log(`  ➕ Inserido: ${email} - ${produto}`);
      }
    } catch (error: any) {
      errors++;
      console.error(`  ❌ Erro ao processar linha:`, error.message);
    }
  }

  console.log('\n📊 Resumo da Importação de Orderbumps:');
  console.log(`  ➕ Novos registros: ${inserted}`);
  console.log(`  🔄 Registros atualizados: ${updated}`);
  console.log(`  ⏭️  Registros ignorados: ${skipped}`);
  console.log(`  ❌ Erros: ${errors}`);
  console.log(`  📦 Total processado: ${records.length}`);
}

// Executar
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

