import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { PartiesService } from './partiesService';
import revenueRepository from '../repositories/revenueRepository';

/**
 * Serviço de Importação de Receitas a partir de Extratos Bancários
 *
 * Pipeline completo:
 * 1. Ler arquivo Excel
 * 2. Normalizar e mapear dados
 * 3. Identificar automaticamente: profissional, cliente, forma de pagamento
 * 4. Criar clientes inexistentes
 * 5. Gerar preview para revisão manual
 * 6. Inserir no banco após aprovação
 *
 * Princípios:
 * - Clean Architecture
 * - DDD (Domain-Driven Design)
 * - Validação rigorosa em cada etapa
 * - Segurança e integridade de dados
 */
class ImportRevenueFromStatementService {
  /**
   * Colunas esperadas no arquivo Excel
   * Baseado no layout: Profissional | Item | Valor Unitário | Valor | Qtd | Data | Pagamento | Cliente
   */
  static EXPECTED_COLUMNS = {
    profissional: [
      'Profissional',
      'profissional',
      'PROFISSIONAL',
      'Barbeiro',
      'Professional',
    ],
    item: ['Item', 'item', 'ITEM', 'Produto', 'Serviço', 'Servico'],
    valor_unitario: [
      'Valor Unitário',
      'Valor Unitario',
      'valor unitario',
      'VALOR UNITARIO',
      'Preço',
      'Preco',
    ],
    valor: ['Valor', 'valor', 'VALUE', 'Total', 'TOTAL'],
    qtd: ['Qtd', 'qtd', 'QTD', 'Quantidade', 'quantidade', 'QUANTIDADE', 'Qty'],
    data: ['Data', 'data', 'DATE', 'Data Lançamento', 'Data Lancamento'],
    pagamento: [
      'Pagamento',
      'pagamento',
      'PAGAMENTO',
      'Forma Pagamento',
      'Método',
      'Metodo',
    ],
    cliente: ['Cliente', 'cliente', 'CLIENTE', 'Customer', 'Client'],
  };

  /**
   * Palavras-chave para detecção de forma de pagamento
   */
  static PAYMENT_METHOD_KEYWORDS = {
    pix: ['PIX', 'pix', 'Pix'],
    cartao_credito: [
      'CARTÃO',
      'CARTAO',
      'CRÉDITO',
      'CREDITO',
      'MASTERCARD',
      'VISA',
      'ELO',
      'AMEX',
      'HIPERCARD',
      'AMERICAN EXPRESS',
      'CARTÃO DE CRÉDITO',
      'CARTAO DE CREDITO',
    ],
    cartao_debito: [
      'DÉBITO',
      'DEBITO',
      'DEB',
      'CARTÃO DE DÉBITO',
      'CARTAO DE DEBITO',
    ],
    dinheiro: ['DINHEIRO', 'ESPÉCIE', 'CASH', 'ESPECIE'],
    transferencia: ['TED', 'DOC', 'TRANSFERÊNCIA', 'TRANSFERENCIA'],
    boleto: ['BOLETO', 'COBRANÇA', 'COBRANCA'],
  };

  /**
   * 1️⃣ Ler arquivo Excel e converter para JSON
   *
   * @param {File} file - Arquivo Excel (.xlsx, .xls)
   * @returns {Promise<{data: Array, error: string|null}>}
   */
  /**
   * Detecta o tipo de arquivo e chama o método apropriado
   */
  static async readFile(file) {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      console.log('📄 Detectado arquivo CSV:', file.name);
      return this.readCsvFile(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      console.log('📊 Detectado arquivo Excel:', file.name);
      return this.readExcelFile(file);
    } else {
      return {
        data: null,
        error:
          'Formato de arquivo não suportado. Use CSV ou Excel (.xlsx/.xls)',
      };
    }
  }

  /**
   * Lê arquivo CSV de forma mais confiável
   */
  static async readCsvFile(file) {
    return new Promise(resolve => {
      try {
        console.log('📄 Lendo arquivo CSV:', file.name);

        const reader = new FileReader();

        reader.onload = e => {
          try {
            const csvText = e.target.result;
            console.log(
              '📄 CSV raw text (primeiros 200 chars):',
              csvText.substring(0, 200)
            );

            // Parse CSV manualmente para maior controle
            const lines = csvText.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
              resolve({
                data: null,
                error:
                  'Arquivo CSV deve ter pelo menos 2 linhas (header + dados)',
              });
              return;
            }

            // Primeira linha é o header
            const headerLine = lines[0];
            const headers = this.parseCsvLine(headerLine);

            console.log('📋 Headers detectados:', headers);

            // Processar linhas de dados
            const jsonData = [];
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue; // Pular linhas vazias

              const values = this.parseCsvLine(line);

              // Criar objeto com headers como chaves
              const row = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });

              jsonData.push(row);
            }

            console.log('✅ CSV lido com sucesso:', jsonData.length, 'linhas');
            console.log('🔍 Primeiras 3 linhas:', jsonData.slice(0, 3));

            resolve({ data: jsonData, error: null });
          } catch (parseError) {
            console.error('❌ Erro ao processar CSV:', parseError);
            resolve({
              data: null,
              error: 'Erro ao processar arquivo CSV: ' + parseError.message,
            });
          }
        };

        reader.onerror = () => {
          resolve({ data: null, error: 'Erro ao ler arquivo CSV' });
        };

        // Ler como texto para CSV
        reader.readAsText(file, 'UTF-8');
      } catch (err) {
        console.error('❌ Erro ao ler CSV:', err);
        resolve({
          data: null,
          error: 'Erro ao ler arquivo CSV: ' + err.message,
        });
      }
    });
  }

  /**
   * Parse uma linha CSV respeitando aspas e vírgulas
   */
  static parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Aspas duplas escapadas
          current += '"';
          i++; // Pular próxima aspa
        } else {
          // Toggle quotes
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Separador encontrado fora de aspas
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Adicionar último campo
    result.push(current.trim());

    return result;
  }

  /**
   * Lê arquivo Excel (método original)
   */
  static async readExcelFile(file) {
    return new Promise(resolve => {
      try {
        console.log('📊 Lendo arquivo Excel:', file.name);

        const reader = new FileReader();

        reader.onload = e => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Pegar a primeira planilha
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Converter para JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              raw: false, // Manter strings para facilitar parsing
              defval: '', // Valor padrão para células vazias
            });

            console.log(
              '✅ Excel lido com sucesso:',
              jsonData.length,
              'linhas'
            );
            console.log('🔍 Primeiras 3 linhas:', jsonData.slice(0, 3));

            if (jsonData.length === 0) {
              resolve({
                data: null,
                error: 'Arquivo vazio ou formato inválido',
              });
              return;
            }

            resolve({ data: jsonData, error: null });
          } catch (parseError) {
            console.error('❌ Erro ao processar Excel:', parseError);
            resolve({
              data: null,
              error: 'Erro ao processar arquivo Excel: ' + parseError.message,
            });
          }
        };

        reader.onerror = () => {
          resolve({ data: null, error: 'Erro ao ler arquivo' });
        };

        reader.readAsArrayBuffer(file);
      } catch (err) {
        console.error('❌ Erro ao ler arquivo:', err);
        resolve({ data: null, error: err.message });
      }
    });
  }

  /**
   * 2️⃣ Validar cabeçalhos do Excel
   *
   * @param {Array} data - Dados do Excel
   * @returns {{isValid: boolean, missing: Array, headers: Object}}
   */
  static validateHeaders(data) {
    if (!data || data.length === 0) {
      return {
        isValid: false,
        missing: ['Arquivo vazio'],
        headers: {},
      };
    }

    const firstRow = data[0];
    const availableHeaders = Object.keys(firstRow);

    console.log('🔍 Cabeçalhos disponíveis:', availableHeaders);

    const mappedHeaders = {};
    const missing = [];

    // Mapear cada coluna esperada para as colunas disponíveis
    for (const [key, possibleNames] of Object.entries(this.EXPECTED_COLUMNS)) {
      const found = availableHeaders.find(header =>
        possibleNames.some(
          name =>
            header.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(header.toLowerCase())
        )
      );

      if (found) {
        mappedHeaders[key] = found;
      } else {
        missing.push(key);
      }
    }

    console.log('🗺️ Mapeamento de colunas:', mappedHeaders);
    console.log('⚠️ Colunas faltando:', missing);

    // ✅ Colunas obrigatórias: apenas valor, data, pagamento, cliente
    // ⚠️ Profissional e item são OPCIONAIS (podem não existir na planilha)
    const requiredColumns = ['valor', 'data', 'pagamento', 'cliente'];
    const missingRequired = requiredColumns.filter(col => !mappedHeaders[col]);

    if (missingRequired.length > 0) {
      return {
        isValid: false,
        missing: missingRequired,
        headers: mappedHeaders,
      };
    }

    return {
      isValid: true,
      missing: [],
      headers: mappedHeaders,
    };
  }

  /**
   * 3️⃣ Normalizar e mapear dados
   *
   * @param {Array} rawData - Dados brutos do Excel
   * @param {Object} headerMapping - Mapeamento de colunas
   * @param {Object} context - Contexto da importação (unitId, userId, bankAccountId)
   * @returns {{normalized: Array, errors: Array}}
   */
  static normalizeData(rawData, headerMapping, context) {
    const normalized = [];
    const errors = [];

    console.log('🔄 Normalizando', rawData.length, 'linhas...');

    rawData.forEach((row, index) => {
      try {
        const lineNumber = index + 2; // +2 porque Excel começa em 1 e tem header

        // Extrair valores usando o mapeamento das novas colunas
        const profissionalNome = (row[headerMapping.profissional] || '')
          .toString()
          .trim();
        const item = (row[headerMapping.item] || '').toString().trim();
        const rawValorUnitario = row[headerMapping.valor_unitario] || '0';
        const rawValor = row[headerMapping.valor] || '0';
        const rawQtd = row[headerMapping.qtd] || '1';
        const rawDate = row[headerMapping.data] || '';
        const formaPagamento = (row[headerMapping.pagamento] || '')
          .toString()
          .trim();

        console.log(
          '💳 Forma de pagamento extraída:',
          formaPagamento,
          'da linha',
          lineNumber
        );
        const clienteNome = (row[headerMapping.cliente] || '')
          .toString()
          .trim();

        // Parsear data
        const parsedDate = this.parseDate(rawDate);
        if (!parsedDate) {
          errors.push({
            line: lineNumber,
            field: 'data',
            value: rawDate,
            error: 'Data inválida ou não reconhecida',
          });
          return;
        }

        // Parsear valor total
        const parsedValue = this.parseValue(rawValor);
        if (parsedValue <= 0) {
          // Ignora silenciosamente linhas com valor zero (não adiciona erro)
          console.log(
            `⚠️ Linha ${lineNumber} ignorada: valor R$ ${parsedValue.toFixed(2)}`
          );
          return;
        }

        // Parsear quantidade
        const parsedQtd = parseFloat(rawQtd.toString().replace(',', '.')) || 1;

        // Parsear valor unitário
        const parsedValorUnitario =
          this.parseValue(rawValorUnitario) || parsedValue / parsedQtd;

        // Gerar source_hash para dedupe (usando data + valor + profissional + cliente)
        const sourceHash = this.generateSourceHash(
          format(parsedDate, 'yyyy-MM-dd'),
          parsedValue,
          `${profissionalNome}-${clienteNome}-${item}`
        );

        // Usar o campo "Item" como título/descrição da receita
        const titulo =
          item && item.trim() ? item.trim() : `Serviço - ${clienteNome}`;

        // Adicionar à lista normalizada
        normalized.push({
          // Dados originais
          rawData: {
            profissional: profissionalNome,
            item,
            valor_unitario: rawValorUnitario,
            valor: rawValor,
            qtd: rawQtd,
            date: rawDate,
            pagamento: formaPagamento,
            cliente: clienteNome,
          },

          // Dados normalizados
          date: format(parsedDate, 'yyyy-MM-dd'),
          source: titulo,
          value: parsedValue,
          gross_amount: parsedValue,
          net_amount: parsedValue,
          fees: 0,
          status: 'Pending', // Será atualizado no enrichData baseado na forma de pagamento
          expected_receipt_date: format(parsedDate, 'yyyy-MM-dd'), // Será atualizado no enrichData
          actual_receipt_date: null, // Será atualizado no enrichData
          source_hash: sourceHash,
          observations: `${context.bankName || 'Banco não identificado'} | Qtd: ${parsedQtd} | Valor Unit: R$ ${parsedValorUnitario.toFixed(2)}`,

          // Contexto
          unit_id: context.unitId,
          user_id: context.userId,
          account_id: context.bankAccountId, // account_id = ID da conta bancária selecionada

          // Mapeamento automático (a ser preenchido)
          professional_id: null,
          professionalName: profissionalNome,
          party_id: null,
          partyName: clienteNome,
          paymentMethodName: formaPagamento,
          type: 'service', // Padrão: serviço (usuário pode mudar para 'product')
          category_id: null, // OBRIGATÓRIO: deve ser preenchido no modal de revisão

          // Metadados adicionais
          item,
          quantidade: parsedQtd,
          valorUnitario: parsedValorUnitario,

          // Flags
          isNewClient: false,
          hasProfessionalWarning: false,
          lineNumber,
        });
      } catch (err) {
        errors.push({
          line: index + 2,
          field: 'geral',
          value: JSON.stringify(row),
          error: err.message,
        });
      }
    });

    console.log(
      '✅ Normalização completa:',
      normalized.length,
      'receitas válidas'
    );
    console.log('⚠️ Erros encontrados:', errors.length);

    return { normalized, errors };
  }

  /**
   * 4️⃣ Identificar automaticamente profissional, cliente e forma de pagamento
   *
   * @param {Array} normalizedData - Dados normalizados
   * @param {Object} referenceData - Dados de referência (profissionais, clientes, formas de pagamento)
   * @returns {Promise<Array>} Dados enriquecidos com IDs
   */
  static async enrichData(normalizedData, referenceData) {
    const { professionals, clients, paymentMethods, unitId } = referenceData;

    console.log('🔍 Enriquecendo', normalizedData.length, 'registros...');
    console.log('📊 Referências:', {
      professionals: professionals?.length || 0,
      clients: clients?.length || 0,
      paymentMethods: paymentMethods?.length || 0,
    });

    const enriched = [];

    for (const record of normalizedData) {
      try {
        // Detectar profissional pelo nome direto (já vem do Excel)
        const detectedProfessional = this.detectProfessional(
          record.professionalName,
          professionals
        );
        if (detectedProfessional) {
          record.professional_id = detectedProfessional.id;
          record.professionalName =
            detectedProfessional.name || detectedProfessional.nome;
        } else {
          record.hasProfessionalWarning = true;
          // Mantém o nome do Excel com aviso se não encontrar
        }

        // Detectar cliente pelo nome direto (já vem do Excel)
        const detectedClient = this.detectClient(record.partyName, clients);
        if (detectedClient) {
          record.party_id = detectedClient.id;
          record.partyName = detectedClient.nome;
          record.isNewClient = false;
        } else {
          // Cliente não encontrado - criar automaticamente
          if (record.partyName && record.partyName.trim()) {
            try {
              const newClient = await this.createClientFromName(
                record.partyName,
                unitId
              );
              if (newClient) {
                record.party_id = newClient.id;
                record.partyName = newClient.nome;
                record.isNewClient = true;
              }
            } catch (err) {
              console.error('❌ Erro ao criar cliente:', err);
              record.isNewClient = false;
              // Mantém o nome do Excel com aviso
            }
          }
        }

        // Detectar forma de pagamento pelo nome direto (já vem do Excel)
        const detectedPaymentMethod = this.detectPaymentMethod(
          record.paymentMethodName,
          paymentMethods
        );
        if (detectedPaymentMethod) {
          record.payment_method_id = detectedPaymentMethod.id;
          record.paymentMethodName = detectedPaymentMethod.nome;

          // 💰 Calcular taxas e valores líquidos
          const feePercentage = detectedPaymentMethod.fee_percentage || 0;
          const feeAmount = (record.value * feePercentage) / 100;
          record.fees = feeAmount;
          record.gross_amount = record.value;
          record.net_amount = record.value - feeAmount;

          // 📅 Calcular data de recebimento baseada nos dias da forma de pagamento
          const receiptDays = detectedPaymentMethod.receipt_days || 0;
          const paymentDate = new Date(record.date);
          const expectedReceiptDate = new Date(paymentDate);
          expectedReceiptDate.setDate(
            expectedReceiptDate.getDate() + receiptDays
          );

          record.expected_receipt_date = format(
            expectedReceiptDate,
            'yyyy-MM-dd'
          );

          // Se a forma de pagamento for instantânea (0 dias), marcar como recebido
          if (receiptDays === 0) {
            record.status = 'Received';
            record.actual_receipt_date = record.date;
          } else {
            record.status = 'Pending';
            record.actual_receipt_date = null;
          }
        } else {
          // Mantém o nome do Excel com aviso se não encontrar
          // Mantém valores padrão já definidos
        }

        enriched.push(record);
      } catch (err) {
        console.error(
          '❌ Erro ao enriquecer registro linha',
          record.lineNumber,
          ':',
          err
        );
        enriched.push(record);
      }
    }

    console.log('✅ Enriquecimento completo');
    return enriched;
  }

  /**
   * 5️⃣ Inserir receitas aprovadas no banco
   *
   * @param {Array} approvedRecords - Registros aprovados pelo usuário
   * @param {Object} context - Contexto adicional
   * @returns {Promise<{success: number, duplicates: number, errors: Array}>}
   */
  static async insertApprovedRecords(approvedRecords, context) {
    console.log(
      '💾 Inserindo',
      approvedRecords.length,
      'receitas aprovadas...'
    );
    console.log('📋 Context recebido:', context);
    console.log(
      '📋 Primeira receita (sample):',
      JSON.stringify(approvedRecords[0], null, 2)
    );

    let successCount = 0;
    let duplicateCount = 0;
    const errors = [];

    // Verificar duplicatas antes de inserir (usando source_hash)
    const existingHashes = await this.checkExistingHashes(
      approvedRecords.map(r => r.source_hash),
      context.unitId
    );
    console.log('🔍 Hashes existentes encontrados:', existingHashes.length);

    for (const record of approvedRecords) {
      try {
        // Verificar se já existe
        if (existingHashes.includes(record.source_hash)) {
          console.log(
            '⚠️ Registro duplicado (source_hash existe):',
            record.source_hash
          );
          duplicateCount++;
          continue;
        }

        // Preparar payload para inserção
        const payload = {
          type: record.type, // 'service' ou 'product'
          value: record.value,
          date: record.date,
          source: record.source,
          observations: record.observations,
          unit_id: record.unit_id,
          account_id: record.account_id,
          professional_id: record.professional_id,
          user_id: record.user_id,
          party_id: record.party_id,
          gross_amount: record.gross_amount,
          net_amount: record.net_amount,
          fees: record.fees,
          status: record.status,
          expected_receipt_date: record.expected_receipt_date,
          actual_receipt_date: record.actual_receipt_date,
          source_hash: record.source_hash,
          category_id: record.category_id,
          payment_method_id: record.payment_method_id, // NEW: Adicionar forma de pagamento
        };

        console.log(
          '📦 Tentando inserir receita linha',
          record.lineNumber,
          ':',
          {
            type: payload.type,
            value: payload.value,
            date: payload.date,
            source: payload.source?.substring(0, 30),
            unit_id: payload.unit_id,
            bank_account_id: payload.bank_account_id,
            payment_method_id: payload.payment_method_id,
          }
        );

        // Inserir no banco via repository
        const { data, error } = await revenueRepository.create(payload);

        if (error) {
          console.error(
            '❌ Erro ao inserir receita linha',
            record.lineNumber,
            ':',
            error
          );
          console.error(
            '❌ Payload que falhou:',
            JSON.stringify(payload, null, 2)
          );
          errors.push({
            line: record.lineNumber,
            description: record.source,
            error: typeof error === 'string' ? error : JSON.stringify(error),
          });
        } else {
          console.log('✅ Receita inserida:', data?.id || 'sem ID');
          successCount++;
        }
      } catch (err) {
        console.error(
          '❌ Exceção ao inserir receita linha',
          record.lineNumber,
          ':',
          err
        );
        errors.push({
          line: record.lineNumber,
          description: record.source,
          error: err.message,
        });
      }
    }

    console.log('✅ Importação concluída:', {
      success: successCount,
      duplicates: duplicateCount,
      errors: errors.length,
    });

    return {
      success: successCount,
      duplicates: duplicateCount,
      errors,
    };
  }

  // ========================================
  // 🛠️ FUNÇÕES UTILITÁRIAS
  // ========================================

  /**
   * Parsear data de diferentes formatos
   */
  static parseDate(dateStr) {
    if (!dateStr) return null;

    try {
      // Converter para string e remover espaços extras
      const cleanStr = String(dateStr).trim();

      console.log('🕐 Tentando parsear data:', cleanStr);

      // Tentar diferentes formatos comuns brasileiros
      const formats = [
        // DD/MM/YYYY HH:MM (formato da planilha)
        /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/,
        // DD/MM/YYYY (sem hora)
        /^(\d{2})\/(\d{2})\/(\d{4})$/,
        // YYYY-MM-DD HH:MM
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/,
        // YYYY-MM-DD
        /^(\d{4})-(\d{2})-(\d{2})$/,
        // DD-MM-YYYY HH:MM
        /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})$/,
        // DD-MM-YYYY
        /^(\d{2})-(\d{2})-(\d{4})$/,
      ];

      for (const format of formats) {
        const match = cleanStr.match(format);
        if (match) {
          console.log('✅ Match encontrado com formato:', format.source);

          if (format === formats[0]) {
            // DD/MM/YYYY HH:MM
            const [, day, month, year, hour, minute] = match;
            const date = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day),
              parseInt(hour),
              parseInt(minute)
            );
            console.log('📅 Data parseada (com hora):', date);
            return date;
          } else if (format === formats[1]) {
            // DD/MM/YYYY
            const [, day, month, year] = match;
            const date = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            );
            console.log('📅 Data parseada (sem hora):', date);
            return date;
          } else if (format === formats[2]) {
            // YYYY-MM-DD HH:MM
            const [, year, month, day, hour, minute] = match;
            const date = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day),
              parseInt(hour),
              parseInt(minute)
            );
            console.log('📅 Data parseada (ISO com hora):', date);
            return date;
          } else if (format === formats[3]) {
            // YYYY-MM-DD
            const [, year, month, day] = match;
            const date = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            );
            console.log('📅 Data parseada (ISO sem hora):', date);
            return date;
          } else if (format === formats[4]) {
            // DD-MM-YYYY HH:MM
            const [, day, month, year, hour, minute] = match;
            const date = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day),
              parseInt(hour),
              parseInt(minute)
            );
            console.log('📅 Data parseada (DD-MM-YYYY com hora):', date);
            return date;
          } else if (format === formats[5]) {
            // DD-MM-YYYY
            const [, day, month, year] = match;
            const date = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            );
            console.log('📅 Data parseada (DD-MM-YYYY sem hora):', date);
            return date;
          }
        }
      }

      console.warn('❌ Nenhum formato de data reconhecido para:', cleanStr);

      // Fallback: tentar new Date()
      const date = new Date(cleanStr);
      if (!isNaN(date.getTime())) {
        console.log('📅 Data parseada (fallback):', date);
        return date;
      }

      return null;
    } catch (err) {
      console.error('❌ Erro ao parsear data:', err);
      return null;
    }
  }

  /**
   * Parsear valor monetário
   */
  static parseValue(valueStr) {
    if (typeof valueStr === 'number') return Math.abs(valueStr);

    console.log('💰 Parseando valor:', valueStr);

    const cleaned = valueStr
      .toString()
      .replace(/[^\d,.-]/g, '') // Remove tudo exceto números, vírgula, ponto e hífen
      .replace(/\./g, '') // Remove pontos (separadores de milhar)
      .replace(',', '.'); // Vírgula vira ponto decimal

    console.log('💰 Valor limpo:', cleaned);

    const parsed = parseFloat(cleaned);
    const result = isNaN(parsed) ? 0 : Math.abs(parsed);

    console.log('💰 Valor final:', result);

    return result;
  }

  /**
   * Gerar hash simples para dedupe (compatível com browser)
   * Usa um algoritmo simples de hash string
   */
  static generateSourceHash(date, value, source) {
    // Determinístico: não incluir timestamp, para dedupe consistente de reimportações
    const str = `${date}|${Number(value).toFixed(2)}|${(source || '').trim()}`;

    // djb2 determinístico
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) + hash + char; // hash * 33 + char
    }

    return Math.abs(hash).toString(16).padStart(16, '0').slice(0, 32);
  }

  /**
   * Detectar profissional pelo nome na descrição
   * Agora com busca bidirecional e por palavras
   */
  static detectProfessional(description, professionals) {
    if (!description || !professionals || professionals.length === 0)
      return null;

    const descLower = String(description).toLowerCase().trim();

    console.log(
      `🔍 Buscando profissional: "${description}" (normalizado: "${descLower}")`
    );
    console.log(
      `📋 ${professionals.length} profissionais disponíveis:`,
      professionals.map(p => p?.name || p?.nome).filter(Boolean)
    );

    // 1️⃣ Tentar match exato primeiro
    const exactMatch = professionals.find(prof => {
      if (!prof || (!prof.name && !prof.nome)) return false;
      const nomeLower = String(prof.name || prof.nome)
        .toLowerCase()
        .trim();
      return descLower === nomeLower;
    });
    if (exactMatch) {
      console.log(
        `✅ Match exato encontrado: ${exactMatch.name || exactMatch.nome}`
      );
      return exactMatch;
    }

    // 2️⃣ Tentar match bidirecional (um contém o outro)
    const partialMatch = professionals.find(prof => {
      if (!prof || (!prof.name && !prof.nome)) return false;
      const nomeLower = String(prof.name || prof.nome)
        .toLowerCase()
        .trim();
      return descLower.includes(nomeLower) || nomeLower.includes(descLower);
    });
    if (partialMatch) {
      console.log(
        `✅ Match parcial encontrado: ${partialMatch.name || partialMatch.nome}`
      );
      return partialMatch;
    }

    // 3️⃣ Tentar match por palavras (primeiro nome ou sobrenome)
    const descWords = descLower.split(/\s+/);
    const wordMatch = professionals.find(prof => {
      if (!prof || (!prof.name && !prof.nome)) return false;
      const nomeLower = String(prof.name || prof.nome)
        .toLowerCase()
        .trim();
      const nomeWords = nomeLower.split(/\s+/);

      // Verifica se alguma palavra do Excel bate com alguma palavra do banco
      return descWords.some(dw =>
        nomeWords.some(nw => dw === nw && dw.length > 2)
      );
    });
    if (wordMatch) {
      console.log(
        `✅ Match por palavra encontrado: ${wordMatch.name || wordMatch.nome}`
      );
      return wordMatch;
    }

    console.warn(`❌ Nenhum profissional encontrado para: "${description}"`);
    return null;
  }

  /**
   * Detectar cliente pelo nome na descrição
   * Agora com busca bidirecional e por palavras
   */
  static detectClient(description, clients) {
    if (!description || !clients || clients.length === 0) return null;

    const descLower = String(description).toLowerCase().trim();

    // 1️⃣ Tentar match exato primeiro
    const exactMatch = clients.find(client => {
      if (!client || !client.nome) return false;
      const nomeLower = String(client.nome).toLowerCase().trim();
      return descLower === nomeLower;
    });
    if (exactMatch) return exactMatch;

    // 2️⃣ Tentar match bidirecional (um contém o outro)
    const partialMatch = clients.find(client => {
      if (!client || !client.nome) return false;
      const nomeLower = String(client.nome).toLowerCase().trim();
      return descLower.includes(nomeLower) || nomeLower.includes(descLower);
    });
    if (partialMatch) return partialMatch;

    // 3️⃣ Tentar match por palavras (primeiro nome ou sobrenome)
    const descWords = descLower.split(/\s+/);
    const wordMatch = clients.find(client => {
      if (!client || !client.nome) return false;
      const nomeLower = String(client.nome).toLowerCase().trim();
      const nomeWords = nomeLower.split(/\s+/);

      // Verifica se alguma palavra do Excel bate com alguma palavra do banco
      return descWords.some(dw =>
        nomeWords.some(nw => dw === nw && dw.length > 2)
      );
    });
    if (wordMatch) return wordMatch;

    return null;
  }

  /**
   * Detectar forma de pagamento pelas palavras-chave
   * Agora com busca bidirecional e match direto
   */
  static detectPaymentMethod(description, paymentMethods) {
    if (!description || !paymentMethods || paymentMethods.length === 0)
      return null;

    const descLower = String(description).toLowerCase().trim();

    // 1️⃣ Tentar match exato primeiro (suportar name ou nome)
    const exactMatch = paymentMethods.find(pm => {
      if (!pm) return false;
      const label = String(pm.name || pm.nome || '')
        .toLowerCase()
        .trim();
      return label && descLower === label;
    });
    if (exactMatch) return exactMatch;

    // 2️⃣ Tentar match bidirecional (um contém o outro)
    const partialMatch = paymentMethods.find(pm => {
      if (!pm) return false;
      const label = String(pm.name || pm.nome || '')
        .toLowerCase()
        .trim();
      return label && (descLower.includes(label) || label.includes(descLower));
    });
    if (partialMatch) return partialMatch;

    // 3️⃣ Procurar por palavras-chave conhecidas
    for (const [, keywords] of Object.entries(this.PAYMENT_METHOD_KEYWORDS)) {
      if (keywords.some(keyword => descLower.includes(keyword.toLowerCase()))) {
        // Encontrou uma palavra-chave, buscar forma de pagamento correspondente
        const found = paymentMethods.find(pm => {
          if (!pm) return false;
          const pmLower = String(pm.name || pm.nome || '').toLowerCase();
          return (
            pmLower && keywords.some(kw => pmLower.includes(kw.toLowerCase()))
          );
        });

        if (found) return found;
      }
    }

    return null;
  }

  /**
   * Extrair nome do cliente da descrição
   */
  static extractClientName(description) {
    if (!description) return null;

    // Remover palavras comuns de transações
    const cleaned = description
      .replace(/PIX|TRANSFERÊNCIA|TED|DOC|PGTO|RECEBIMENTO/gi, '')
      .trim();

    // Pegar as primeiras palavras (máximo 3)
    const words = cleaned.split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) return null;

    return words.slice(0, 3).join(' ');
  }

  /**
   * Criar cliente automaticamente a partir do nome
   */
  static async createClientFromName(clientName, unitId) {
    try {
      console.log('➕ Criando cliente automaticamente:', clientName);

      // Gerar CPF fictício (00000000000 + timestamp)
      const fictitiousCpf = `000${Date.now().toString().slice(-8)}`;

      const clientData = {
        unit_id: unitId,
        nome: clientName,
        tipo: 'Cliente',
        cpf_cnpj: fictitiousCpf,
        telefone: null,
        email: null,
        endereco: null,
        observacoes: 'Cliente criado automaticamente via importação de extrato',
      };

      const { data, error } = await PartiesService.createParty(clientData);

      if (error) {
        console.error('❌ Erro ao criar cliente:', error);
        return null;
      }

      console.log('✅ Cliente criado:', data.id, data.nome);
      return data;
    } catch (err) {
      console.error('❌ Exceção ao criar cliente:', err);
      return null;
    }
  }

  /**
   * Verificar hashes existentes no banco (dedupe)
   */
  static async checkExistingHashes(hashes, unitId) {
    try {
      const { supabase } = await import('./supabase');

      const { data, error } = await supabase
        .from('revenues')
        .select('source_hash')
        .eq('unit_id', unitId)
        .in('source_hash', hashes);

      if (error) {
        console.error('❌ Erro ao verificar hashes existentes:', error);
        return [];
      }

      return data?.map(r => r.source_hash) || [];
    } catch (err) {
      console.error('❌ Exceção ao verificar hashes:', err);
      return [];
    }
  }

  /**
   * Gerar relatório final da importação
   */
  static generateReport(results, enrichedData, startTime) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    const newClients = enrichedData.filter(r => r.isNewClient).length;
    const withoutProfessional = enrichedData.filter(
      r => r.hasProfessionalWarning
    ).length;

    return {
      total_lidos: enrichedData.length,
      total_aprovados: results.success,
      duplicatas_ignoradas: results.duplicates,
      clientes_criados: newClients,
      profissionais_nao_encontrados: withoutProfessional,
      erros: results.errors.length,
      tempo_execucao: `${duration}s`,
      timestamp: new Date().toISOString(),
    };
  }
}

export default ImportRevenueFromStatementService;
