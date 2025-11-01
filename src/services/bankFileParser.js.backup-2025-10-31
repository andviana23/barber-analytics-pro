/**
 * bankFileParser.js
 *
 * Parser para arquivos bancários brasileiros.
 * Suporte aos principais bancos: Itaú, Bradesco, Banco do Brasil, Santander.
 * Formatos: CSV, OFX, TXT e formatos proprietários.
 *
 * Autor: Sistema Barber Analytics Pro
 * Data: 2024
 */

/**
 * Classe para parsing de arquivos bancários brasileiros
 */
export class BankFileParser {
  constructor() {
    // Configurações dos bancos
    this.bankConfigs = {
      itau: {
        name: 'Itaú Unibanco',
        code: '341',
        formats: ['csv', 'ofx', 'txt'],
        csvConfig: {
          delimiter: ',',
          hasHeader: true,
          encoding: 'utf8',
          dateFormat: 'DD/MM/YYYY',
          columns: {
            date: 'Data',
            description: 'Descrição',
            amount: 'Valor',
            document: 'Documento',
            balance: 'Saldo',
          },
        },
        patterns: {
          creditPattern:
            /^(DEPOSITO|CREDITO|TED RECEBIDA|PIX RECEBIDO|TRANSFERENCIA RECEBIDA)/i,
          debitPattern:
            /^(DEBITO|SAQUE|TED ENVIADA|PIX ENVIADO|TRANSFERENCIA ENVIADA|PAGAMENTO)/i,
        },
      },

      bradesco: {
        name: 'Bradesco',
        code: '237',
        formats: ['csv', 'txt', 'ofx'],
        csvConfig: {
          delimiter: ';',
          hasHeader: true,
          encoding: 'latin1',
          dateFormat: 'DD/MM/YYYY',
          columns: {
            date: 'Data',
            description: 'Histórico',
            amount: 'Valor R$',
            document: 'Documento',
            balance: 'Saldo R$',
          },
        },
        patterns: {
          creditPattern: /^(CREDITO|DEPOSITO|RECEBIMENTO|TED REC|PIX REC)/i,
          debitPattern: /^(DEBITO|SAQUE|PAGAMENTO|TED ENV|PIX ENV)/i,
        },
      },

      bb: {
        name: 'Banco do Brasil',
        code: '001',
        formats: ['csv', 'ofx', 'txt'],
        csvConfig: {
          delimiter: ';',
          hasHeader: true,
          encoding: 'utf8',
          dateFormat: 'DD/MM/YYYY',
          columns: {
            date: 'Data',
            description: 'Descrição',
            amount: 'Valor',
            document: 'Nr documento',
            balance: 'Saldo',
          },
        },
        patterns: {
          creditPattern:
            /^(CREDITO|DEPOSITO|TED CREDITO|PIX ENTRADA|RECEBIMENTO)/i,
          debitPattern: /^(DEBITO|SAQUE|TED DEBITO|PIX SAIDA|PAGAMENTO)/i,
        },
      },

      santander: {
        name: 'Santander',
        code: '033',
        formats: ['csv', 'txt', 'xlsx'],
        csvConfig: {
          delimiter: ';',
          hasHeader: true,
          encoding: 'utf8',
          dateFormat: 'DD/MM/YYYY',
          columns: {
            date: 'Data Mov.',
            description: 'Descrição',
            amount: 'Valor',
            document: 'Documento',
            balance: 'Saldo',
          },
        },
        patterns: {
          creditPattern:
            /^(CREDITO|DEPOSITO|TED ENTRADA|PIX RECEBIDO|RECEBIMENTO)/i,
          debitPattern: /^(DEBITO|SAQUE|TED SAIDA|PIX ENVIADO|PAGAMENTO)/i,
        },
      },
    };

    // Configurações gerais
    this.config = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      supportedEncodings: ['utf8', 'latin1', 'iso-8859-1'],
      dateFormats: [
        'DD/MM/YYYY',
        'DD-MM-YYYY',
        'YYYY-MM-DD',
        'YYYY/MM/DD',
        'DD/MM/YY',
        'DD-MM-YY',
      ],
    };
  }

  /**
   * Auto-detecta o banco baseado no conteúdo do arquivo
   * @param {string} content - Conteúdo do arquivo
   * @param {string} filename - Nome do arquivo
   * @returns {Object} Informações do banco detectado
   */
  detectBank(content, filename = '') {
    const normalizedContent = content.toLowerCase();
    const normalizedFilename = filename.toLowerCase();

    // Detectar por nome do arquivo
    if (
      normalizedFilename.includes('itau') ||
      normalizedFilename.includes('itaú')
    ) {
      return { bank: 'itau', confidence: 0.8 };
    }
    if (normalizedFilename.includes('bradesco')) {
      return { bank: 'bradesco', confidence: 0.8 };
    }
    if (
      normalizedFilename.includes('bb') ||
      normalizedFilename.includes('bancobrasil')
    ) {
      return { bank: 'bb', confidence: 0.8 };
    }
    if (normalizedFilename.includes('santander')) {
      return { bank: 'santander', confidence: 0.8 };
    }

    // Detectar por conteúdo
    const bankSignatures = {
      itau: ['itau unibanco', 'banco itau', 'ag:', 'conta corrente:'],
      bradesco: ['banco bradesco', 'bradesco s.a', 'ag.:', 'conta:'],
      bb: ['banco do brasil', 'bb.com.br', 'agencia:', 'conta corrente:'],
      santander: ['santander', 'banco santander', 'ag.:', 'c/c:'],
    };

    for (const [bankCode, signatures] of Object.entries(bankSignatures)) {
      const matches = signatures.filter(sig =>
        normalizedContent.includes(sig)
      ).length;
      if (matches >= 2) {
        return { bank: bankCode, confidence: 0.6 + matches * 0.1 };
      }
    }

    return { bank: null, confidence: 0 };
  }

  /**
   * Detecta o formato do arquivo
   * @param {string} content - Conteúdo do arquivo
   * @param {string} filename - Nome do arquivo
   * @returns {string} Formato detectado
   */
  detectFormat(content, filename = '') {
    const extension = filename.split('.').pop()?.toLowerCase();

    // Por extensão
    if (['csv', 'txt', 'ofx', 'xlsx'].includes(extension)) {
      return extension;
    }

    // Por conteúdo
    if (
      content.trim().startsWith('<OFX>') ||
      content.includes('<BANKMSGSRSV1>')
    ) {
      return 'ofx';
    }

    // Verificar se é CSV/TXT
    const lines = content.split('\n').slice(0, 5);
    const csvDelimiters = [',', ';', '\t'];

    for (const delimiter of csvDelimiters) {
      const hasConsistentColumns = lines.every(line => {
        const columns = line.split(delimiter);
        return columns.length > 1;
      });

      if (hasConsistentColumns) {
        return 'csv';
      }
    }

    return 'txt';
  }

  /**
   * Parse principal do arquivo bancário
   * @param {File|string} file - Arquivo ou conteúdo
   * @param {Object} options - Opções de parsing
   * @returns {Promise<Object>} Dados parseados
   */
  async parseFile(file, options = {}) {
    try {
      // Ler conteúdo do arquivo
      let content, filename;

      if (typeof file === 'string') {
        content = file;
        filename = options.filename || '';
      } else {
        content = await this.readFile(file);
        filename = file.name || '';
      }

      // Validar tamanho do arquivo
      if (content.length > this.config.maxFileSize) {
        throw new Error('Arquivo muito grande. Máximo 10MB permitido.');
      }

      // Auto-detectar banco e formato se não fornecidos
      const bankDetection = options.bank
        ? { bank: options.bank, confidence: 1.0 }
        : this.detectBank(content, filename);

      const format = options.format || this.detectFormat(content, filename);

      if (!bankDetection.bank) {
        throw new Error(
          'Não foi possível detectar o banco. Especifique manualmente.'
        );
      }

      const bankConfig = this.bankConfigs[bankDetection.bank];
      if (!bankConfig) {
        throw new Error(`Banco ${bankDetection.bank} não suportado.`);
      }

      // Parse baseado no formato
      let transactions = [];

      switch (format) {
        case 'csv':
          transactions = await this.parseCSV(content, bankConfig, options);
          break;
        case 'ofx':
          transactions = await this.parseOFX(content, bankConfig, options);
          break;
        case 'txt':
          transactions = await this.parseTXT(content, bankConfig, options);
          break;
        default:
          throw new Error(`Formato ${format} não suportado.`);
      }

      return {
        success: true,
        bank: bankDetection.bank,
        bankName: bankConfig.name,
        format: format,
        confidence: bankDetection.confidence,
        totalTransactions: transactions.length,
        transactions: transactions,
        metadata: {
          filename: filename,
          parseDate: new Date().toISOString(),
          encoding: options.encoding || 'utf8',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        transactions: [],
      };
    }
  }

  /**
   * Parse de arquivo CSV
   * @param {string} content - Conteúdo CSV
   * @param {Object} bankConfig - Configuração do banco
   * @param {Object} options - Opções
   * @returns {Array} Array de transações
   */
  async parseCSV(content, bankConfig, options = {}) {
    const config = { ...bankConfig.csvConfig, ...options.csvConfig };
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      throw new Error('Arquivo CSV vazio.');
    }

    // Detectar delimitador se não especificado
    if (!config.delimiter) {
      config.delimiter = this.detectCSVDelimiter(lines[0]);
    }

    let startIndex = 0;
    let headers = [];

    // Processar header se existir
    if (config.hasHeader) {
      const headerLine = lines[0];
      headers = this.parseCSVLine(headerLine, config.delimiter);
      startIndex = 1;

      // Mapear colunas
      const columnMapping = {};
      Object.entries(config.columns).forEach(([key, expectedName]) => {
        const columnIndex = headers.findIndex(
          h =>
            h.toLowerCase().includes(expectedName.toLowerCase()) ||
            expectedName.toLowerCase().includes(h.toLowerCase())
        );
        if (columnIndex >= 0) {
          columnMapping[key] = columnIndex;
        }
      });
      config.columnMapping = columnMapping;
    }

    const transactions = [];

    // Processar linhas de dados
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const columns = this.parseCSVLine(line, config.delimiter);
        const transaction = this.parseCSVTransaction(
          columns,
          config,
          bankConfig
        );

        if (transaction) {
          transactions.push(transaction);
        }
      } catch {
        // Continue processing on error
      }
    }

    return transactions;
  }

  /**
   * Parse de linha CSV
   * @param {string} line - Linha CSV
   * @param {string} delimiter - Delimitador
   * @returns {Array} Colunas parseadas
   */
  parseCSVLine(line, delimiter) {
    const columns = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      } else if (char === delimiter && !inQuotes) {
        columns.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    columns.push(current.trim());
    return columns;
  }

  /**
   * Detecta delimitador CSV
   * @param {string} line - Primeira linha do CSV
   * @returns {string} Delimitador detectado
   */
  detectCSVDelimiter(line) {
    const delimiters = [';', ',', '\t', '|'];
    let bestDelimiter = ',';
    let maxColumns = 0;

    for (const delimiter of delimiters) {
      const columns = line.split(delimiter);
      if (columns.length > maxColumns) {
        maxColumns = columns.length;
        bestDelimiter = delimiter;
      }
    }

    return bestDelimiter;
  }

  /**
   * Parse de transação CSV
   * @param {Array} columns - Colunas da linha
   * @param {Object} config - Configuração
   * @param {Object} bankConfig - Configuração do banco
   * @returns {Object} Transação parseada
   */
  parseCSVTransaction(columns, config, bankConfig) {
    if (!config.columnMapping) {
      // Assumir ordem padrão: data, descrição, valor, documento, saldo
      config.columnMapping = {
        date: 0,
        description: 1,
        amount: 2,
        document: 3,
        balance: 4,
      };
    }

    const transaction = {};

    // Data
    const dateIndex = config.columnMapping.date;
    if (dateIndex !== undefined && columns[dateIndex]) {
      transaction.date = this.parseDate(columns[dateIndex], config.dateFormat);
    }

    // Descrição
    const descIndex = config.columnMapping.description;
    if (descIndex !== undefined && columns[descIndex]) {
      transaction.description = columns[descIndex].trim();
    }

    // Valor
    const amountIndex = config.columnMapping.amount;
    if (amountIndex !== undefined && columns[amountIndex]) {
      transaction.amount = this.parseAmount(columns[amountIndex]);
    }

    // Documento
    const docIndex = config.columnMapping.document;
    if (docIndex !== undefined && columns[docIndex]) {
      transaction.document = columns[docIndex].trim();
    }

    // Saldo
    const balanceIndex = config.columnMapping.balance;
    if (balanceIndex !== undefined && columns[balanceIndex]) {
      transaction.balance = this.parseAmount(columns[balanceIndex]);
    }

    // Determinar tipo (crédito/débito)
    if (transaction.description && transaction.amount !== undefined) {
      transaction.type = this.determineTransactionType(
        transaction.description,
        transaction.amount,
        bankConfig.patterns
      );
    }

    // Validar transação
    if (
      !transaction.date ||
      !transaction.description ||
      transaction.amount === undefined
    ) {
      return null;
    }

    // Adicionar metadados
    transaction.id = this.generateTransactionId(transaction);
    transaction.rawData = columns;

    return transaction;
  }

  /**
   * Parse de arquivo OFX
   * @param {string} content - Conteúdo OFX
   * @param {Object} bankConfig - Configuração do banco
   * @param {Object} options - Opções
   * @returns {Array} Array de transações
   */
  async parseOFX(content) {
    const transactions = [];

    // Regex para extrair transações OFX
    const transactionRegex = /<STMTTRN>(.*?)<\/STMTTRN>/gs;
    const matches = content.match(transactionRegex);

    if (!matches) {
      throw new Error('Nenhuma transação encontrada no arquivo OFX.');
    }

    for (const match of matches) {
      try {
        const transaction = this.parseOFXTransaction(match);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch {
        // Continue on error
      }
    }

    return transactions;
  }

  /**
   * Parse de transação OFX
   * @param {string} transactionXml - XML da transação
   * @returns {Object} Transação parseada
   */
  parseOFXTransaction(transactionXml) {
    const extractTag = (xml, tag) => {
      const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'i');
      const match = xml.match(regex);
      return match ? match[1].trim() : null;
    };

    const transaction = {
      type: extractTag(transactionXml, 'TRNTYPE'),
      date: this.parseOFXDate(extractTag(transactionXml, 'DTPOSTED')),
      amount: parseFloat(extractTag(transactionXml, 'TRNAMT')),
      fitid: extractTag(transactionXml, 'FITID'),
      description:
        extractTag(transactionXml, 'MEMO') ||
        extractTag(transactionXml, 'NAME'),
      document: extractTag(transactionXml, 'CHECKNUM'),
    };

    // Determinar tipo de transação
    transaction.type = transaction.amount >= 0 ? 'credit' : 'debit';
    transaction.amount = Math.abs(transaction.amount);

    // Gerar ID
    transaction.id = this.generateTransactionId(transaction);

    return transaction;
  }

  /**
   * Parse de data OFX (formato YYYYMMDD)
   * @param {string} dateStr - String de data OFX
   * @returns {string} Data no formato ISO
   */
  parseOFXDate(dateStr) {
    if (!dateStr) return null;

    const cleaned = dateStr.replace(/[^\d]/g, '');
    if (cleaned.length >= 8) {
      const year = cleaned.substring(0, 4);
      const month = cleaned.substring(4, 6);
      const day = cleaned.substring(6, 8);
      return `${year}-${month}-${day}`;
    }

    return null;
  }

  /**
   * Parse de arquivo TXT (formato fixo)
   * @param {string} content - Conteúdo TXT
   * @param {Object} bankConfig - Configuração do banco
   * @param {Object} options - Opções
   * @returns {Array} Array de transações
   */
  async parseTXT(content, bankConfig) {
    const lines = content.split('\n').filter(line => line.trim());
    const transactions = [];

    for (const line of lines) {
      try {
        const transaction = this.parseTXTLine(line, bankConfig);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch {
        // Continue on error
      }
    }

    return transactions;
  }

  /**
   * Parse de linha TXT
   * @param {string} line - Linha do arquivo TXT
   * @param {Object} bankConfig - Configuração do banco
   * @returns {Object} Transação parseada
   */
  parseTXTLine(line, bankConfig) {
    // Implementação básica - pode ser customizada por banco
    const parts = line.split(/\s+/);

    if (parts.length < 3) {
      return null;
    }

    const transaction = {
      date: this.parseDate(parts[0]),
      description: parts.slice(1, -1).join(' '),
      amount: this.parseAmount(parts[parts.length - 1]),
    };

    if (!transaction.date || transaction.amount === undefined) {
      return null;
    }

    transaction.type = this.determineTransactionType(
      transaction.description,
      transaction.amount,
      bankConfig.patterns
    );

    transaction.id = this.generateTransactionId(transaction);

    return transaction;
  }

  /**
   * Parse de data flexível
   * @param {string} dateStr - String de data
   * @param {string} expectedFormat - Formato esperado
   * @returns {string} Data no formato ISO
   */
  parseDate(dateStr, expectedFormat = null) {
    if (!dateStr) return null;

    // Limpar string
    const cleaned = dateStr.replace(/[^\d/-]/g, '');

    // Tentar formatos comuns
    const formats = expectedFormat
      ? [expectedFormat, ...this.config.dateFormats]
      : this.config.dateFormats;

    for (const format of formats) {
      try {
        const parsed = this.parseDateWithFormat(cleaned, format);
        if (parsed) return parsed;
      } catch {
        // Continue tentando outros formatos
      }
    }

    return null;
  }

  /**
   * Parse de data com formato específico
   * @param {string} dateStr - String de data
   * @param {string} format - Formato (DD/MM/YYYY, etc.)
   * @returns {string} Data ISO ou null
   */
  parseDateWithFormat(dateStr, format) {
    const formatRegexes = {
      'DD/MM/YYYY': /^(\d{2})\/(\d{2})\/(\d{4})$/,
      'DD-MM-YYYY': /^(\d{2})-(\d{2})-(\d{4})$/,
      'YYYY-MM-DD': /^(\d{4})-(\d{2})-(\d{2})$/,
      'YYYY/MM/DD': /^(\d{4})\/(\d{2})\/(\d{2})$/,
      'DD/MM/YY': /^(\d{2})\/(\d{2})\/(\d{2})$/,
      'DD-MM-YY': /^(\d{2})-(\d{2})-(\d{2})$/,
    };

    const regex = formatRegexes[format];
    if (!regex) return null;

    const match = dateStr.match(regex);
    if (!match) return null;

    let day, month, year;

    switch (format) {
      case 'DD/MM/YYYY':
      case 'DD-MM-YYYY':
        [, day, month, year] = match;
        break;
      case 'YYYY-MM-DD':
      case 'YYYY/MM/DD':
        [, year, month, day] = match;
        break;
      case 'DD/MM/YY':
      case 'DD-MM-YY':
        [, day, month, year] = match;
        year = year.length === 2 ? `20${year}` : year;
        break;
    }

    // Validar data
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (
      date.getFullYear() == year &&
      date.getMonth() == month - 1 &&
      date.getDate() == day
    ) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return null;
  }

  /**
   * Parse de valor monetário
   * @param {string} amountStr - String do valor
   * @returns {number} Valor numérico
   */
  parseAmount(amountStr) {
    if (!amountStr) return undefined;

    // Remover caracteres não numéricos exceto vírgula, ponto e sinal
    let cleaned = amountStr.toString().replace(/[^\d,.\-+]/g, '');

    // Tratar formatos brasileiros (vírgula como decimal)
    if (cleaned.includes(',') && cleaned.includes('.')) {
      // Formato: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      // Verificar se vírgula é separador decimal ou de milhares
      const commaIndex = cleaned.lastIndexOf(',');
      const afterComma = cleaned.substring(commaIndex + 1);

      if (afterComma.length <= 2) {
        // Vírgula como decimal
        cleaned = cleaned.replace(',', '.');
      } else {
        // Vírgula como separador de milhares
        cleaned = cleaned.replace(/,/g, '');
      }
    }

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Determina tipo de transação (crédito/débito)
   * @param {string} description - Descrição da transação
   * @param {number} amount - Valor da transação
   * @param {Object} patterns - Padrões do banco
   * @returns {string} Tipo da transação
   */
  determineTransactionType(description, amount, patterns) {
    if (!description) {
      return amount >= 0 ? 'credit' : 'debit';
    }

    const normalizedDesc = description.toUpperCase();

    if (patterns.creditPattern && patterns.creditPattern.test(normalizedDesc)) {
      return 'credit';
    }

    if (patterns.debitPattern && patterns.debitPattern.test(normalizedDesc)) {
      return 'debit';
    }

    // Fallback para valor
    return Math.abs(amount) === amount ? 'credit' : 'debit';
  }

  /**
   * Gera ID único para transação
   * @param {Object} transaction - Dados da transação
   * @returns {string} ID único
   */
  generateTransactionId(transaction) {
    const data = `${transaction.date || ''}_${transaction.amount || ''}_${(transaction.description || '').substring(0, 20)}`;
    return btoa(data)
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 16);
  }

  /**
   * 🛡️ CORREÇÃO BUG-006: Lê arquivo com detecção automática de encoding
   * @param {File} file - Arquivo
   * @param {string} [forceEncoding] - Encoding específico (opcional)
   * @returns {Promise<string>} Conteúdo do arquivo
   */
  async readFile(file, forceEncoding = null) {
    // ✅ Se encoding específico foi fornecido, usar diretamente
    if (forceEncoding) {
      return this.readFileWithEncoding(file, forceEncoding);
    }

    // ✅ Tentar detectar encoding automaticamente
    try {
      const encoding = await this.detectFileEncoding(file);
      return this.readFileWithEncoding(file, encoding);
    } catch {
      // ✅ Fallback: tentar encodings comuns para bancos brasileiros
      const fallbackEncodings = ['utf8', 'latin1', 'windows-1252'];

      for (const encoding of fallbackEncodings) {
        try {
          const content = await this.readFileWithEncoding(file, encoding);

          // ✅ Validar se o conteúdo parece correto (sem caracteres corrompidos)
          if (this.isValidTextContent(content)) {
            return content;
          }
        } catch {
          continue; // Tentar próximo encoding
        }
      }

      // ✅ Se nenhum encoding funcionou, usar UTF-8 como último recurso
      return this.readFileWithEncoding(file, 'utf8');
    }
  }

  /**
   * 🔧 CORREÇÃO BUG-006: Detecta encoding do arquivo
   * @param {File} file - Arquivo
   * @returns {Promise<string>} Encoding detectado
   * @private
   */
  async detectFileEncoding(file) {
    return new Promise(resolve => {
      const reader = new FileReader();

      reader.onload = event => {
        const buffer = new Uint8Array(event.target.result);
        const encoding = this.detectEncodingFromBOM(buffer);
        resolve(encoding);
      };

      // Ler apenas os primeiros 1024 bytes para detectar BOM
      const slice = file.slice(0, 1024);
      reader.readAsArrayBuffer(slice);
    });
  }

  /**
   * 🔧 CORREÇÃO BUG-006: Detecta encoding via BOM (Byte Order Mark)
   * @param {Uint8Array} buffer - Buffer do arquivo
   * @returns {string} Encoding detectado
   * @private
   */
  detectEncodingFromBOM(buffer) {
    // ✅ UTF-8 BOM
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xef &&
      buffer[1] === 0xbb &&
      buffer[2] === 0xbf
    ) {
      return 'utf8';
    }

    // ✅ UTF-16 Little Endian BOM
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
      return 'utf16le';
    }

    // ✅ UTF-16 Big Endian BOM
    if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
      return 'utf16be';
    }

    // ✅ Heurística para bancos brasileiros
    // Verificar se tem caracteres típicos de Latin1 (acentos)
    let hasLatinChars = false;
    for (let i = 0; i < Math.min(buffer.length, 500); i++) {
      // Caracteres acentuados em Latin1: À-ÿ (192-255)
      if (buffer[i] >= 192 && buffer[i] <= 255) {
        hasLatinChars = true;
        break;
      }
    }

    // ✅ Se tem caracteres latinos, provavelmente é Latin1 (comum no Bradesco)
    if (hasLatinChars) {
      return 'latin1';
    }

    // ✅ Default para UTF-8 (comum no Itaú, BB, Santander)
    return 'utf8';
  }

  /**
   * 🔧 CORREÇÃO BUG-006: Lê arquivo com encoding específico
   * @param {File} file - Arquivo
   * @param {string} encoding - Encoding
   * @returns {Promise<string>} Conteúdo do arquivo
   * @private
   */
  readFileWithEncoding(file, encoding) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = event => {
        resolve(event.target.result);
      };

      reader.onerror = error => {
        reject(
          new Error(
            `Erro ao ler arquivo com encoding ${encoding}: ${error.message}`
          )
        );
      };

      reader.readAsText(file, encoding);
    });
  }

  /**
   * 🔧 CORREÇÃO BUG-006: Valida se o conteúdo do texto está correto
   * @param {string} content - Conteúdo do arquivo
   * @returns {boolean} True se válido
   * @private
   */
  isValidTextContent(content) {
    // ✅ Verificar se não tem caracteres de controle inválidos
    // eslint-disable-next-line no-control-regex
    const invalidChars = /[\x00-\x08\x0E-\x1F\x7F]/g;
    if (invalidChars.test(content)) {
      return false;
    }

    // ✅ Verificar se não tem muitos caracteres de substituição (�)
    const replacementChars = (content.match(/�/g) || []).length;
    const totalChars = content.length;

    // Se mais de 1% são caracteres de substituição, provavelmente encoding errado
    if (totalChars > 0 && replacementChars / totalChars > 0.01) {
      return false;
    }

    // ✅ Conteúdo parece válido
    return true;
  }

  /**
   * Valida estrutura de dados parseados
   * @param {Array} transactions - Transações parseadas
   * @returns {Object} Resultado da validação
   */
  validateParsedData(transactions) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      statistics: {
        totalTransactions: transactions.length,
        validTransactions: 0,
        invalidTransactions: 0,
        creditsCount: 0,
        debitsCount: 0,
        totalCredits: 0,
        totalDebits: 0,
        dateRange: { start: null, end: null },
      },
    };

    const dates = [];

    transactions.forEach((transaction, index) => {
      let isValid = true;

      // Validar campos obrigatórios
      if (!transaction.date) {
        validation.errors.push(`Transação ${index + 1}: Data inválida`);
        isValid = false;
      } else {
        dates.push(new Date(transaction.date));
      }

      if (
        !transaction.description ||
        transaction.description.trim().length === 0
      ) {
        validation.errors.push(`Transação ${index + 1}: Descrição vazia`);
        isValid = false;
      }

      if (transaction.amount === undefined || isNaN(transaction.amount)) {
        validation.errors.push(`Transação ${index + 1}: Valor inválido`);
        isValid = false;
      }

      // Atualizar estatísticas
      if (isValid) {
        validation.statistics.validTransactions++;

        if (transaction.type === 'credit') {
          validation.statistics.creditsCount++;
          validation.statistics.totalCredits += Math.abs(transaction.amount);
        } else {
          validation.statistics.debitsCount++;
          validation.statistics.totalDebits += Math.abs(transaction.amount);
        }
      } else {
        validation.statistics.invalidTransactions++;
      }
    });

    // Calcular range de datas
    if (dates.length > 0) {
      dates.sort((a, b) => a - b);
      validation.statistics.dateRange.start = dates[0]
        .toISOString()
        .split('T')[0];
      validation.statistics.dateRange.end = dates[dates.length - 1]
        .toISOString()
        .split('T')[0];
    }

    // Marcar como inválido se há muitos erros
    if (validation.errors.length > transactions.length * 0.1) {
      validation.isValid = false;
      validation.warnings.push(
        'Muitos erros encontrados. Verifique o formato do arquivo.'
      );
    }

    return validation;
  }

  /**
   * Obtém configurações suportadas
   * @returns {Object} Configurações disponíveis
   */
  getSupportedConfigs() {
    return {
      banks: Object.keys(this.bankConfigs),
      formats: ['csv', 'ofx', 'txt', 'xlsx'],
      encodings: this.config.supportedEncodings,
      dateFormats: this.config.dateFormats,
    };
  }
}

// Exportar instância singleton
export const bankFileParser = new BankFileParser();

// Exportar classe para instanciação customizada
export default BankFileParser;
