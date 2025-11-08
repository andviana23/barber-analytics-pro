import { format } from 'date-fns';
import { PartiesService } from './partiesService';
import expenseRepository from '../repositories/expenseRepository';
// 🔒 bankStatementRepository NÃO usado - despesas importadas sem bank_statements
// Bank statements são SOMENTE para Conciliação Bancária (feature desabilitada)

/**
 * Serviço de Importação de Despesas a partir de Extratos Bancários OFX
 *
 * Pipeline completo:
 * 1. Ler arquivo OFX (XML/SGML)
 * 2. Normalizar e mapear dados
 * 3. Identificar automaticamente: categoria, fornecedor
 * 4. Criar fornecedores inexistentes
 * 5. Gerar preview para revisão manual
 * 6. Inserir no banco após aprovação
 *
 * Princípios:
 * - Clean Architecture
 * - DDD (Domain-Driven Design)
 * - Validação rigorosa em cada etapa
 * - Segurança e integridade de dados
 */
class ImportExpensesFromOFXService {
  /**
   * Palavras-chave para detecção de categoria de despesa
   */
  static EXPENSE_CATEGORY_KEYWORDS = {
    Aluguel: ['ALUGUEL', 'RENT', 'IMOVEL', 'IMÓVEL', 'LOCACAO', 'LOCAÇÃO'],
    Telecomunicações: [
      'INTERNET',
      'CLARO',
      'VIVO',
      'TIM',
      'OI',
      'TELEFONE',
      'CELULAR',
    ],
    'Energia Elétrica': ['LUZ', 'ENERGIA', 'CEMIG', 'CPFL', 'ELETRICIDADE'],
    'Água e Saneamento': [
      'ÁGUA',
      'AGUA',
      'COPASA',
      'SABESP',
      'SANEPAR',
      'SANITARIO',
    ],
    Tecnologia: [
      'SISTEMA',
      'SAAS',
      'SOFTWARE',
      'LICENCA',
      'LICENÇA',
      'CLOUD',
      'HOSTING',
    ],
    'Folha de Pagamento': [
      'SALÁRIO',
      'SALARIO',
      'PAGAMENTO',
      'FUNCIONARIO',
      'FUNCIONÁRIO',
    ],
    'Produtos e Insumos': [
      'PRODUTO',
      'FORNECEDOR',
      'COMPRA',
      'MATERIAL',
      'ESTOQUE',
    ],
    Marketing: [
      'MARKETING',
      'PUBLICIDADE',
      'FACEBOOK',
      'GOOGLE',
      'ADS',
      'SOCIAL',
    ],
    Manutenção: [
      'MANUTENCAO',
      'MANUTENÇÃO',
      'REPARO',
      'CONSERTO',
      'SERVICO',
      'SERVIÇO',
    ],
    Transporte: [
      'COMBUSTIVEL',
      'COMBUSTÍVEL',
      'GASOLINA',
      'ETANOL',
      'UBER',
      'TAXI',
    ],
  };

  /**
   * Palavras-chave para detecção de fornecedores conhecidos
   */
  static SUPPLIER_KEYWORDS = {
    Claro: ['CLARO'],
    Vivo: ['VIVO'],
    Tim: ['TIM'],
    Oi: ['OI'],
    Cemig: ['CEMIG'],
    CPFL: ['CPFL'],
    Copasa: ['COPASA'],
    Sabesp: ['SABESP'],
    Google: ['GOOGLE', 'GOOGLE ADS'],
    Facebook: ['FACEBOOK', 'META'],
    Microsoft: ['MICROSOFT', 'AZURE'],
    Amazon: ['AMAZON', 'AWS'],
  };

  /**
   * 1️⃣ Ler arquivo OFX e converter para JSON
   *
   * @param {File} file - Arquivo OFX (.ofx)
   * @returns {Promise<{data: Array, error: string|null}>}
   */
  static async readFile(file) {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.ofx')) {
      console.log('📄 Detectado arquivo OFX:', file.name);
      return this.readOFXFile(file);
    } else {
      return {
        data: null,
        error: 'Formato de arquivo não suportado. Use OFX (.ofx)',
      };
    }
  }

  /**
   * Lê arquivo OFX (XML/SGML)
   */
  static async readOFXFile(file) {
    return new Promise(resolve => {
      try {
        console.log('📄 Lendo arquivo OFX:', file.name);

        const reader = new FileReader();

        reader.onload = e => {
          try {
            const ofxText = e.target.result;
            console.log(
              '📄 OFX raw text (primeiros 500 chars):',
              ofxText.substring(0, 500)
            );

            // Parse OFX manualmente
            const transactions = this.parseOFX(ofxText);

            if (transactions.length === 0) {
              resolve({
                data: null,
                error: 'Nenhuma transação encontrada no arquivo OFX',
              });
              return;
            }

            console.log(
              '✅ OFX lido com sucesso:',
              transactions.length,
              'transações'
            );

            resolve({ data: transactions, error: null });
          } catch (parseError) {
            console.error('❌ Erro ao processar OFX:', parseError);
            resolve({
              data: null,
              error: 'Erro ao processar arquivo OFX: ' + parseError.message,
            });
          }
        };

        reader.onerror = () => {
          resolve({ data: null, error: 'Erro ao ler arquivo OFX' });
        };

        // Ler como texto para OFX
        reader.readAsText(file, 'UTF-8');
      } catch (err) {
        console.error('❌ Erro ao ler OFX:', err);
        resolve({
          data: null,
          error: 'Erro ao ler arquivo OFX: ' + err.message,
        });
      }
    });
  }

  /**
   * Parse OFX (XML/SGML) para extrair transações
   */
  static parseOFX(ofxText) {
    const transactions = [];

    try {
      // Normalizar quebras de linha e espaços
      const normalizedText = ofxText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');

      // Encontrar seção de transações bancárias
      const bankMsgMatch = normalizedText.match(
        /<BANKMSGSRSV1>([\s\S]*?)<\/BANKMSGSRSV1>/i
      );
      if (!bankMsgMatch) {
        console.warn('⚠️ Seção BANKMSGSRSV1 não encontrada');
        return transactions;
      }

      const bankMsgContent = bankMsgMatch[1];

      // Encontrar seção STMTTRNRS (Statement Transaction Response)
      const stmtTrnrsMatch = bankMsgContent.match(
        /<STMTTRNRS>([\s\S]*?)<\/STMTTRNRS>/i
      );
      if (!stmtTrnrsMatch) {
        console.warn('⚠️ Seção STMTTRNRS não encontrada');
        return transactions;
      }

      const stmtTrnrsContent = stmtTrnrsMatch[1];

      // Encontrar seção BANKTRANLIST
      const bankTranListMatch = stmtTrnrsContent.match(
        /<BANKTRANLIST>([\s\S]*?)<\/BANKTRANLIST>/i
      );
      if (!bankTranListMatch) {
        console.warn('⚠️ Seção BANKTRANLIST não encontrada');
        return transactions;
      }

      const bankTranListContent = bankTranListMatch[1];

      // Extrair todas as transações STMTTRN
      const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
      let match;

      while ((match = stmtTrnRegex.exec(bankTranListContent)) !== null) {
        const transactionContent = match[1];
        const transaction = this.parseTransaction(transactionContent);

        if (transaction) {
          transactions.push(transaction);
        }
      }

      console.log('✅ Transações extraídas:', transactions.length);
      return transactions;
    } catch (err) {
      console.error('❌ Erro ao fazer parse do OFX:', err);
      return transactions;
    }
  }

  /**
   * Parse uma transação individual STMTTRN
   */
  static parseTransaction(transactionContent) {
    try {
      // Extrair campos da transação
      const fitid = this.extractTag(transactionContent, 'FITID');
      const dtposted = this.extractTag(transactionContent, 'DTPOSTED');
      const trnamt = this.extractTag(transactionContent, 'TRNAMT');
      const trntype = this.extractTag(transactionContent, 'TRNTYPE');
      const name = this.extractTag(transactionContent, 'NAME');
      const memo = this.extractTag(transactionContent, 'MEMO');

      // Validar campos obrigatórios
      if (!fitid || !dtposted || !trnamt || !trntype) {
        console.warn('⚠️ Transação com campos obrigatórios faltando:', {
          fitid: !!fitid,
          dtposted: !!dtposted,
          trnamt: !!trnamt,
          trntype: !!trntype,
        });
        return null;
      }

      // Converter data OFX para Date
      const transactionDate = this.parseOFXDate(dtposted);
      if (!transactionDate) {
        console.warn('⚠️ Data inválida na transação:', dtposted);
        return null;
      }

      // Converter valor
      const amount = parseFloat(trnamt);
      if (isNaN(amount)) {
        console.warn('⚠️ Valor inválido na transação:', trnamt);
        return null;
      }

      // Usar NAME ou MEMO como descrição
      const description = (name || memo || '').trim();

      return {
        fitid: fitid.trim(),
        transaction_date: format(transactionDate, 'yyyy-MM-dd'),
        amount: Math.abs(amount), // Sempre valor absoluto para despesas
        type: trntype.trim().toUpperCase(),
        description: description || 'Transação sem descrição',
        raw_data: {
          fitid,
          dtposted,
          trnamt,
          trntype,
          name,
          memo,
        },
      };
    } catch (err) {
      console.error('❌ Erro ao parsear transação:', err);
      return null;
    }
  }

  /**
   * Extrai valor de uma tag XML/SGML
   * Suporta ambos os formatos:
   * - XML: <TAG>valor</TAG>
   * - SGML: <TAG>valor
   */
  static extractTag(content, tagName) {
    // Tentar formato XML primeiro (com tag de fechamento)
    const xmlRegex = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`, 'i');
    const xmlMatch = content.match(xmlRegex);
    if (xmlMatch) {
      return xmlMatch[1].trim();
    }

    // Tentar formato SGML (sem tag de fechamento)
    // Captura até próxima tag ou quebra de linha
    const sgmlRegex = new RegExp(`<${tagName}>([^<\\n\\r]+)`, 'i');
    const sgmlMatch = content.match(sgmlRegex);
    return sgmlMatch ? sgmlMatch[1].trim() : null;
  }

  /**
   * Converte data OFX para Date
   * Formatos suportados:
   * - YYYYMMDDHHMMSS
   * - YYYYMMDD
   * - YYYYMMDDHHMMSS[timezone] (ex: 20251001062346[-3:GMT])
   */
  static parseOFXDate(ofxDate) {
    try {
      if (!ofxDate) return null;

      // Remover timezone se houver (ex: [-3:GMT], [0:GMT])
      let cleanDate = ofxDate.trim().replace(/\[.*?\]/, '');

      // Formato YYYYMMDDHHMMSS (14 dígitos)
      if (cleanDate.length === 14) {
        const year = cleanDate.substring(0, 4);
        const month = cleanDate.substring(4, 6);
        const day = cleanDate.substring(6, 8);
        const hour = cleanDate.substring(8, 10);
        const minute = cleanDate.substring(10, 12);
        const second = cleanDate.substring(12, 14);

        return new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute),
          parseInt(second)
        );
      }

      // Formato YYYYMMDD (8 dígitos)
      if (cleanDate.length === 8) {
        const year = cleanDate.substring(0, 4);
        const month = cleanDate.substring(4, 6);
        const day = cleanDate.substring(6, 8);

        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      console.warn('⚠️ Formato de data OFX não reconhecido:', ofxDate);
      return null;
    } catch (err) {
      console.error('❌ Erro ao parsear data OFX:', err);
      return null;
    }
  }

  /**
   * 2️⃣ Validar e filtrar transações DEBIT
   *
   * @param {Array} data - Dados do OFX
   * @returns {{isValid: boolean, missing: Array, headers: Object}}
   */
  static validateTransactions(data) {
    if (!data || data.length === 0) {
      return {
        isValid: false,
        missing: ['Arquivo vazio'],
        transactions: [],
      };
    }

    // Filtrar apenas transações DEBIT (saídas)
    const debitTransactions = data.filter(t => t.type === 'DEBIT');

    console.log('🔍 Transações totais:', data.length);
    console.log('🔍 Transações DEBIT:', debitTransactions.length);

    if (debitTransactions.length === 0) {
      return {
        isValid: false,
        missing: ['Nenhuma transação de débito encontrada'],
        transactions: [],
      };
    }

    return {
      isValid: true,
      missing: [],
      transactions: debitTransactions,
    };
  }

  /**
   * 3️⃣ Normalizar e mapear dados
   *
   * @param {Array} rawData - Dados brutos do OFX
   * @param {Object} context - Contexto da importação (unitId, userId, bankAccountId)
   * @returns {{normalized: Array, errors: Array}}
   */
  static normalizeData(rawData, context) {
    const normalized = [];
    const errors = [];

    console.log('🔄 Normalizando', rawData.length, 'transações...');

    rawData.forEach((transaction, index) => {
      try {
        const lineNumber = index + 1;

        // Gerar hash único para dedupe
        const hashUnique = this.generateHashUnique(
          transaction.transaction_date,
          transaction.amount,
          transaction.description,
          context.bankAccountId
        );

        // Detectar categoria automaticamente
        const detectedCategory = this.detectCategory(transaction.description);

        // Detectar fornecedor automaticamente
        const detectedSupplier = this.detectSupplier(transaction.description);

        // Adicionar à lista normalizada
        normalized.push({
          // Dados originais
          rawData: {
            fitid: transaction.fitid,
            transaction_date: transaction.transaction_date,
            amount: transaction.amount,
            type: transaction.type,
            description: transaction.description,
          },

          // Dados normalizados para bank_statements
          bankStatement: {
            bank_account_id: context.bankAccountId,
            transaction_date: transaction.transaction_date,
            description: transaction.description,
            amount: transaction.amount,
            type: 'Debit',
            status: 'pending',
            reconciled: false,
            hash_unique: hashUnique,
            fitid: transaction.fitid,
          },

          // Dados normalizados para expenses
          expense: {
            unit_id: context.unitId,
            value: transaction.amount,
            date: transaction.transaction_date,
            // ✅ Se a data já passou, marcar como Paid automaticamente
            status:
              new Date(transaction.transaction_date) < new Date()
                ? 'Paid'
                : 'Pending',
            description: transaction.description,
            account_id: context.bankAccountId,
            category_id: detectedCategory?.id || null,
            party_id: detectedSupplier?.id || null,
            expected_payment_date: transaction.transaction_date,
            // ✅ Se Paid, definir data de pagamento real
            actual_payment_date:
              new Date(transaction.transaction_date) < new Date()
                ? transaction.transaction_date
                : null,
            type: detectedCategory?.type || 'other',
          },

          // Contexto e metadados
          unit_id: context.unitId,
          user_id: context.userId,
          bank_account_id: context.bankAccountId,

          // Detecções automáticas
          detectedCategory,
          detectedSupplier,
          isNewSupplier: false,
          hasCategoryWarning: !detectedCategory,
          hasSupplierWarning: !detectedSupplier,

          // Flags
          lineNumber,
          hashUnique,
        });
      } catch (err) {
        errors.push({
          line: index + 1,
          field: 'geral',
          value: JSON.stringify(transaction),
          error: err.message,
        });
      }
    });

    // Contar quantas serão marcadas como Paid
    const paidCount = normalized.filter(
      n => n.expense.status === 'Paid'
    ).length;
    const pendingCount = normalized.filter(
      n => n.expense.status === 'Pending'
    ).length;

    console.log(
      '✅ Normalização completa:',
      normalized.length,
      'despesas válidas'
    );
    console.log('💰 Status automático:', {
      Paid: paidCount,
      Pending: pendingCount,
    });
    console.log('⚠️ Erros encontrados:', errors.length);

    return { normalized, errors };
  }

  /**
   * 4️⃣ Identificar automaticamente categoria e fornecedor
   *
   * @param {Array} normalizedData - Dados normalizados
   * @param {Object} referenceData - Dados de referência (categorias, fornecedores)
   * @returns {Promise<Array>} Dados enriquecidos com IDs
   */
  static async enrichData(normalizedData, referenceData) {
    const { categories, suppliers, unitId } = referenceData;

    console.log('🔍 Enriquecendo', normalizedData.length, 'registros...');
    console.log('📊 Referências:', {
      categories: categories?.length || 0,
      suppliers: suppliers?.length || 0,
    });

    const enriched = [];

    for (const record of normalizedData) {
      try {
        // 🔒 AUTO-CATEGORIZAÇÃO REMOVIDA - categoria default já atribuída no modal
        // Todas despesas recebem "Despesas sem Identificação" antes de chegar aqui

        // Detectar fornecedor pelo nome direto
        const detectedSupplier = this.detectSupplierFromReference(
          record.expense.description,
          suppliers
        );
        if (detectedSupplier) {
          record.expense.party_id = detectedSupplier.id;
          record.detectedSupplier = detectedSupplier;
          record.hasSupplierWarning = false;
        } else {
          // Fornecedor não encontrado - criar automaticamente se possível
          if (record.expense.description && record.expense.description.trim()) {
            try {
              const newSupplier = await this.createSupplierFromDescription(
                record.expense.description,
                unitId
              );
              if (newSupplier) {
                record.expense.party_id = newSupplier.id;
                record.detectedSupplier = newSupplier;
                record.isNewSupplier = true;
                record.hasSupplierWarning = false;
              }
            } catch (err) {
              console.error('❌ Erro ao criar fornecedor:', err);
              record.isNewSupplier = false;
            }
          }
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
   * 5️⃣ Inserir despesas aprovadas no banco
   *
   * @param {Array} approvedRecords - Registros aprovados pelo usuário
   * @param {Object} context - Contexto adicional
   * @returns {Promise<{success: number, duplicates: number, errors: Array}>}
   */
  static async insertApprovedRecords(approvedRecords, context) {
    console.log(
      '💾 Inserindo',
      approvedRecords.length,
      'despesas aprovadas...'
    );

    let successCount = 0;
    let duplicateCount = 0;
    const errors = [];

    // Verificar duplicatas antes de inserir (usando hash_unique)
    const existingHashes = await this.checkExistingHashes(
      approvedRecords.map(r => r.hashUnique),
      context.unitId
    );
    console.log('🔍 Hashes existentes encontrados:', existingHashes.length);

    for (const record of approvedRecords) {
      try {
        // Verificar se já existe
        if (existingHashes.includes(record.hashUnique)) {
          console.log(
            '⚠️ Registro duplicado (hash_unique existe):',
            record.hashUnique
          );
          duplicateCount++;
          continue;
        }

        // ✅ Inserir APENAS expense (sem bank_statement)
        // 🔒 Bank statements são usados SOMENTE para Conciliação Bancária (feature desabilitada)
        const expenseResult = await expenseRepository.create(record.expense);

        if (expenseResult.error) {
          console.error(
            '❌ Erro ao inserir expense linha',
            record.lineNumber,
            ':',
            expenseResult.error
          );
          errors.push({
            line: record.lineNumber,
            description: record.expense.description,
            error: `Expense: ${expenseResult.error}`,
          });
          continue;
        }

        console.log('✅ Despesa inserida:', expenseResult.data?.id || 'sem ID');
        successCount++;
      } catch (err) {
        console.error(
          '❌ Exceção ao inserir despesa linha',
          record.lineNumber,
          ':',
          err
        );
        errors.push({
          line: record.lineNumber,
          description: record.expense.description,
          error: err.message,
        });
      }
    }

    console.log('✅ Importação concluída:', {
      success: successCount,
      duplicates: duplicateCount,
      errors: errors.length,
    });

    // Log detalhado dos erros para debug
    if (errors.length > 0) {
      console.error(
        '\n❌ ========== ERROS DETALHADOS DA IMPORTAÇÃO =========='
      );
      errors.forEach((err, idx) => {
        console.error(`\n[ERRO ${idx + 1} de ${errors.length}]`);
        console.error('  📍 Linha:', err.line);
        console.error('  📝 Mensagem:', err.error);
        console.error('  🔍 Detalhes:', err.details || 'N/A');
        console.error('  📦 Tipo:', err.type || 'Validação');
      });
      console.error(
        '\n========================================================\n'
      );
    }

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
   * Gerar hash único para dedupe
   */
  static generateHashUnique(date, amount, description, bankAccountId) {
    const str = `${date}|${Number(amount).toFixed(2)}|${(description || '').trim()}|${bankAccountId}`;

    // djb2 determinístico
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) + hash + char; // hash * 33 + char
    }

    return Math.abs(hash).toString(16).padStart(16, '0').slice(0, 32);
  }

  /**
   * Detectar categoria por palavras-chave
   */
  static detectCategory(description) {
    if (!description) return null;

    const descUpper = description.toUpperCase();

    for (const [categoryName, keywords] of Object.entries(
      this.EXPENSE_CATEGORY_KEYWORDS
    )) {
      if (keywords.some(keyword => descUpper.includes(keyword))) {
        return {
          name: categoryName,
          type: this.getCategoryType(categoryName),
        };
      }
    }

    return null;
  }

  /**
   * Detectar categoria a partir de referências do banco
   */
  static detectCategoryFromReference(description, categories) {
    if (!description || !categories || categories.length === 0) return null;

    const descLower = description.toLowerCase().trim();

    // 1️⃣ Tentar match exato primeiro
    const exactMatch = categories.find(cat => {
      if (!cat || !cat.name) return false;
      const nameLower = String(cat.name).toLowerCase().trim();
      return descLower === nameLower;
    });
    if (exactMatch) return exactMatch;

    // 2️⃣ Tentar match por palavras-chave
    const detectedCategory = this.detectCategory(description);
    if (detectedCategory) {
      const keywordMatch = categories.find(cat => {
        if (!cat || !cat.name) return false;
        return cat.name
          .toLowerCase()
          .includes(detectedCategory.name.toLowerCase());
      });
      if (keywordMatch) return keywordMatch;
    }

    return null;
  }

  /**
   * Detectar fornecedor por palavras-chave
   */
  static detectSupplier(description) {
    if (!description) return null;

    const descUpper = description.toUpperCase();

    for (const [supplierName, keywords] of Object.entries(
      this.SUPPLIER_KEYWORDS
    )) {
      if (keywords.some(keyword => descUpper.includes(keyword))) {
        return {
          name: supplierName,
        };
      }
    }

    return null;
  }

  /**
   * Detectar fornecedor a partir de referências do banco
   */
  static detectSupplierFromReference(description, suppliers) {
    if (!description || !suppliers || suppliers.length === 0) return null;

    const descLower = description.toLowerCase().trim();

    // 1️⃣ Tentar match exato primeiro
    const exactMatch = suppliers.find(supplier => {
      if (!supplier || !supplier.nome) return false;
      const nomeLower = String(supplier.nome).toLowerCase().trim();
      return descLower === nomeLower;
    });
    if (exactMatch) return exactMatch;

    // 2️⃣ Tentar match bidirecional (um contém o outro)
    const partialMatch = suppliers.find(supplier => {
      if (!supplier || !supplier.nome) return false;
      const nomeLower = String(supplier.nome).toLowerCase().trim();
      return descLower.includes(nomeLower) || nomeLower.includes(descLower);
    });
    if (partialMatch) return partialMatch;

    // 3️⃣ Tentar match por palavras-chave
    const detectedSupplier = this.detectSupplier(description);
    if (detectedSupplier) {
      const keywordMatch = suppliers.find(supplier => {
        if (!supplier || !supplier.nome) return false;
        return supplier.nome
          .toLowerCase()
          .includes(detectedSupplier.name.toLowerCase());
      });
      if (keywordMatch) return keywordMatch;
    }

    return null;
  }

  /**
   * Obter tipo de categoria baseado no nome
   */
  static getCategoryType(categoryName) {
    const typeMap = {
      Aluguel: 'rent',
      Telecomunicações: 'utilities',
      'Energia Elétrica': 'utilities',
      'Água e Saneamento': 'utilities',
      Tecnologia: 'utilities',
      'Folha de Pagamento': 'salary',
      'Produtos e Insumos': 'supplies',
      Marketing: 'utilities',
      Manutenção: 'utilities',
      Transporte: 'utilities',
    };

    return typeMap[categoryName] || 'other';
  }

  /**
   * Criar fornecedor automaticamente a partir da descrição
   */
  static async createSupplierFromDescription(description, unitId) {
    try {
      console.log('➕ Criando fornecedor automaticamente:', description);

      // Extrair nome do fornecedor da descrição
      const supplierName = this.extractSupplierName(description);

      if (!supplierName) {
        console.warn('⚠️ Não foi possível extrair nome do fornecedor');
        return null;
      }

      // Gerar CNPJ fictício
      const fictitiousCnpj = `00000000000${Date.now().toString().slice(-3)}`;

      const supplierData = {
        unit_id: unitId,
        nome: supplierName,
        tipo: 'Fornecedor',
        cpf_cnpj: fictitiousCnpj,
        telefone: null,
        email: null,
        endereco: null,
        observacoes: 'Fornecedor criado automaticamente via importação OFX',
      };

      const { data, error } = await PartiesService.createParty(supplierData);

      if (error) {
        console.error('❌ Erro ao criar fornecedor:', error);
        return null;
      }

      console.log('✅ Fornecedor criado:', data.id, data.nome);
      return data;
    } catch (err) {
      console.error('❌ Exceção ao criar fornecedor:', err);
      return null;
    }
  }

  /**
   * Extrair nome do fornecedor da descrição
   */
  static extractSupplierName(description) {
    if (!description) return null;

    // Remover palavras comuns de transações
    const cleaned = description
      .replace(/PIX|TRANSFERÊNCIA|TED|DOC|PGTO|PAGAMENTO|DEBITO|DÉBITO/gi, '')
      .trim();

    // Pegar as primeiras palavras (máximo 3)
    const words = cleaned.split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) return null;

    return words.slice(0, 3).join(' ');
  }

  /**
   * Verificar hashes existentes no banco (dedupe)
   */
  static async checkExistingHashes(hashes, unitId) {
    try {
      const { supabase } = await import('./supabase');

      const { data, error } = await supabase
        .from('bank_statements')
        .select('hash_unique')
        .eq('type', 'Debit')
        .in('hash_unique', hashes);

      if (error) {
        console.error('❌ Erro ao verificar hashes existentes:', error);
        return [];
      }

      return data?.map(r => r.hash_unique) || [];
    } catch (err) {
      console.error('❌ Exceção ao verificar hashes:', err);
      return [];
    }
  }

  /**
   * Aplicar categorias selecionadas manualmente pelo usuário
   *
   * @param {Array} normalizedData - Dados normalizados (resultado de normalizeData())
   * @param {Object} userCategorySelections - Mapa { transactionIndex: categoryId }
   * @returns {Array} Dados com categorias atualizadas
   */
  static applyUserCategorySelections(normalizedData, userCategorySelections) {
    if (!normalizedData || normalizedData.length === 0) {
      console.warn('⚠️ applyUserCategorySelections: normalizedData vazio');
      return normalizedData;
    }

    if (
      !userCategorySelections ||
      Object.keys(userCategorySelections).length === 0
    ) {
      console.log(
        'ℹ️ Nenhuma categoria manual selecionada, mantendo auto-detecção'
      );
      return normalizedData;
    }

    console.log('🔄 Aplicando categorias selecionadas manualmente:', {
      total: normalizedData.length,
      manuais: Object.keys(userCategorySelections).length,
    });

    return normalizedData.map((record, index) => {
      // Se usuário selecionou categoria manualmente para este índice
      if (userCategorySelections[index]) {
        const categoryId = userCategorySelections[index];

        console.log(
          `✅ Linha ${index + 1}: Aplicando categoria manual ${categoryId}`
        );

        return {
          ...record,
          expense: {
            ...record.expense,
            category_id: categoryId,
          },
          hasCategoryWarning: false,
          manuallySelected: true,
        };
      }

      // Caso contrário, mantém auto-detecção
      return record;
    });
  }

  /**
   * Marcar todas as despesas como pagas (status: Paid)
   *
   * @param {Array} normalizedData - Dados normalizados
   * @returns {Array} Dados com status Paid e datas de pagamento preenchidas
   */
  static markAllAsPaid(normalizedData) {
    if (!normalizedData || normalizedData.length === 0) {
      return normalizedData;
    }

    console.log('💰 Marcando todas as despesas como Paid...');

    return normalizedData.map(record => {
      const transactionDate = record.expense.date;
      const isPastDate = new Date(transactionDate) < new Date();

      return {
        ...record,
        expense: {
          ...record.expense,
          status: 'Paid',
          actual_payment_date: transactionDate,
          expected_payment_date: transactionDate,
        },
        bankStatement: {
          ...record.bankStatement,
          reconciled: true,
          status: 'reconciled',
        },
      };
    });
  }

  /**
   * Gerar relatório final da importação
   */
  static generateReport(results, enrichedData, startTime) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    const newSuppliers = enrichedData.filter(r => r.isNewSupplier).length;
    const withoutCategory = enrichedData.filter(
      r => r.hasCategoryWarning
    ).length;
    const withoutSupplier = enrichedData.filter(
      r => r.hasSupplierWarning
    ).length;

    return {
      sucesso: results.success || 0,
      duplicatas: results.duplicates || 0,
      erros: results.errors?.length || 0,
      total: enrichedData.length,
      errorsList: results.errors || [], // Lista detalhada de erros
      total_lidos: enrichedData.length,
      total_aprovados: results.success,
      duplicatas_ignoradas: results.duplicates,
      fornecedores_criados: newSuppliers,
      categorias_nao_encontradas: withoutCategory,
      fornecedores_nao_encontrados: withoutSupplier,
      tempo_execucao: `${duration}s`,
      timestamp: new Date().toISOString(),
    };
  }
}

export default ImportExpensesFromOFXService;
