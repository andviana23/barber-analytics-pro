/**
 * DTOs (Data Transfer Objects) para Receitas
 * 
 * Define contratos explícitos entre camadas:
 * - Front-end → Service (CreateRevenueDTO)
 * - Service → Front-end (RevenueResponseDTO)
 * 
 * Benefícios:
 * - Type safety e validação
 * - Transformação consistente de dados
 * - Documentação clara de campos
 * - Prevenção de erros de schema
 */

/**
 * 🗺️ CONSTANTES DE STATUS
 * ✅ CONFIRMADO: PostgreSQL usa ENUM transaction_status em INGLÊS
 * Valores: Pending, Partial, Received, Paid, Cancelled, Overdue
 */

// Status válidos no banco (inglês)
export const VALID_DB_STATUSES = ['Pending', 'Partial', 'Received', 'Paid', 'Cancelled', 'Overdue', 'pending', 'partial', 'received', 'paid', 'cancelled', 'overdue'];

// Mapeamento para exibição em português (apenas para UI)
export const STATUS_DISPLAY = {
  'Pending': 'Pendente',
  'Partial': 'Parcial',
  'Received': 'Recebido',
  'Paid': 'Pago',
  'Cancelled': 'Cancelado',
  'Overdue': 'Atrasado'
};

/**
 * 🛡️ WHITELIST: COLUNAS PERMITIDAS NA TABELA REVENUES
 * ✅ BASEADO NO SCHEMA REAL DO SUPABASE (verified 2025-10-15)
 * 
 * Colunas AUTO_GENERATED (não enviar):
 * - id (UUID gerado automaticamente)
 * - created_at (timestamp NOW())
 * - date (default CURRENT_DATE, mas pode ser sobrescrito)
 * 
 * Colunas USER_INPUT (aceitas do front-end):
 */
export const ALLOWED_REVENUE_COLUMNS = [
  // Obrigatórios
  'type',           // income_type ENUM
  'value',          // numeric (valor principal)
  'date',           // date (pode ser sobrescrito)
  
  // Relacionamentos
  'unit_id',        // UUID
  'professional_id',// UUID
  'user_id',        // UUID
  'account_id',     // UUID
  'party_id',       // UUID
  
  // Informações básicas
  'source',         // text
  'observations',   // text
  
  // Valores financeiros
  'gross_amount',   // numeric
  'net_amount',     // numeric
  'fees',           // numeric (default 0)
  
  // Regime de competência
  'accrual_start_date',    // date
  'accrual_end_date',      // date
  'expected_receipt_date', // date
  'actual_receipt_date',   // date
  
  // Status
  'status'          // transaction_status ENUM (default 'Pending')
];

/**
 * 🚫 BLACKLIST: CAMPOS QUE NUNCA DEVEM SER ENVIADOS
 * 
 * Categoria 1: Campos em português (legado)
 * Categoria 2: Campos calculados/gerados pelo banco
 * Categoria 3: Campos de outras tabelas (joins)
 */
export const FORBIDDEN_REVENUE_FIELDS = [
  // Português (NUNCA foram válidos no banco atual)
  'valor',
  'data',
  'tipo',
  'observacoes',
  'origem',
  'valor_bruto',
  'valor_liquido',
  'taxas',
  'competencia_inicio',
  'competencia_fim',
  'data_recebimento',
  'data_prevista',
  
  // Calculados (gerados por VIEWs ou funções, não existem na tabela base)
  'profit',
  'net_profit',
  'profit_margin',
  'lucro',
  'lucro_liquido',
  'margem',
  
  // Auto-gerados (não aceitar do front)
  'id',
  'created_at',
  
  // Campos de joins/relacionamentos expandidos
  'unit_name',
  'professional_name',
  'party_name',
  'account_name'
];

/**
 * DTO para criação de receita
 * Define contrato explícito entre front-end e service
 * 
 * @class CreateRevenueDTO
 */
export class CreateRevenueDTO {
  /**
   * Construtor do DTO
   * @param {Object} data - Dados da receita vindos do front-end
   */
  constructor(data) {
    // Handle null/undefined data gracefully
    const safeData = data || {};
    
    // ==========================================
    // CAMPOS OBRIGATÓRIOS
    // ==========================================
    
    /**
     * Tipo da receita (income_type ENUM)
     * Valores aceitos: 'service', 'subscription', 'servico', 'produto', 'assinatura', 'outros'
     * @type {string}
     */
    this.type = safeData.type;
    
    /**
     * Valor da receita (deve ser > 0)
     * @type {number}
     */
    this.value = this._convertToNumber(safeData.value);
    
    /**
     * Data da receita (formato YYYY-MM-DD)
     * @type {string}
     */
    this.date = safeData.date || this._getCurrentDate();
    
    // ==========================================
    // CAMPOS OPCIONAIS - INFORMAÇÕES BÁSICAS
    // ==========================================
    
    /**
     * Origem/fonte da receita
     * @type {string|null}
     */
    this.source = safeData.source || null;
    
    /**
     * Observações adicionais
     * @type {string|null}
     */
    this.observations = safeData.observations || null;
    
    // ==========================================
    // CAMPOS OPCIONAIS - RELACIONAMENTOS
    // ==========================================
    
    /**
     * ID da unidade (UUID)
     * @type {string|null}
     */
    this.unit_id = safeData.unit_id || null;
    
    /**
     * ID da conta bancária (UUID)
     * @type {string|null}
     */
    this.account_id = safeData.account_id || null;
    
    /**
     * ID da parte/cliente (UUID)
     * @type {string|null}
     */
    this.party_id = safeData.party_id || null;
    
    /**
     * ID do profissional (UUID)
     * @type {string|null}
     */
    this.professional_id = safeData.professional_id || null;
    
    /**
     * ID do usuário (UUID) - geralmente preenchido automaticamente
     * @type {string|null}
     */
    this.user_id = safeData.user_id || null;
    
    // ==========================================
    // CAMPOS OPCIONAIS - VALORES FINANCEIROS
    // ==========================================
    
    /**
     * Valor bruto (antes de taxas)
     * Se não fornecido, usa o valor principal
     * @type {number}
     */
    this.gross_amount = safeData.gross_amount || safeData.value;
    
    /**
     * Valor líquido (após taxas)
     * Se não fornecido, usa o valor principal
     * @type {number}
     */
    this.net_amount = safeData.net_amount || safeData.value;
    
    /**
     * Taxas descontadas
     * @type {number}
     */
    this.fees = safeData.fees || 0;
    
    // ==========================================
    // CAMPOS OPCIONAIS - REGIME DE COMPETÊNCIA
    // ==========================================
    
    /**
     * Data de início da competência
     * @type {string|null}
     */
    this.accrual_start_date = safeData.accrual_start_date || null;
    
    /**
     * Data de fim da competência
     * @type {string|null}
     */
    this.accrual_end_date = safeData.accrual_end_date || null;
    
    /**
     * Data prevista de recebimento
     * @type {string|null}
     */
    this.expected_receipt_date = safeData.expected_receipt_date || this._calculateSettlementDate(safeData.payment_method);
    
    /**
     * Data efetiva de recebimento
     * @type {string|null}
     */
    this.actual_receipt_date = safeData.actual_receipt_date || null;
    
    // ==========================================
    // CAMPOS OPCIONAIS - STATUS
    // ==========================================
    
    /**
     * Status da transação (transaction_status ENUM PostgreSQL)
     * ✅ Banco usa INGLÊS: Pending, Partial, Received, Paid, Cancelled, Overdue
     * @type {string}
     */
    this.status = safeData.status || 'pending';
  }
  
  /**
   * Helper para normalizar status (primeira letra maiúscula)
   * @private
   * @param {string} status 
   * @returns {string|null}
   */
  _normalizeStatus(status) {
    if (!status) return null;
    // Converte para formato com primeira letra maiúscula (ex: "Pending")
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  /**
   * Calcula data de settlement baseado no payment_method
   * Compatível com DateHelpers.daysFromNow() 
   * @private
   * @param {string} paymentMethod 
   * @returns {string|null}
   */
  _calculateSettlementDate(paymentMethod) {
    if (!paymentMethod) return null;

    let daysToAdd = 0;

    // Regras baseadas nos testes
    switch (paymentMethod) {
      case 'cash':
        daysToAdd = 0; // D+0 - Imediato
        break;
      case 'pix':
        daysToAdd = 0; // D+0 - Imediato
        break;
      case 'debit_card':
        daysToAdd = 1; // D+1 - 1 dia útil
        break;
      case 'credit_card':
        daysToAdd = 30; // D+30 - conforme teste
        break;
      case 'bank_transfer':
        daysToAdd = 1; // D+1 - 1 dia útil
        break;
      case 'monthly_plan':
        daysToAdd = 30; // D+30 - mensal
        break;
      default:
        return null;
    }

    // Simular DateHelpers.daysFromNow()
    const today = new Date();
    const settlementDate = new Date(today);
    settlementDate.setDate(today.getDate() + daysToAdd);

    // Retorna no formato YYYY-MM-DD
    return settlementDate.toISOString().split('T')[0];
  }

  /**
   * Valida os dados do DTO
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];
    
    // ==========================================
    // VALIDAÇÃO: CAMPOS OBRIGATÓRIOS
    // ==========================================
    
    if (!this.type) {
      errors.push('Campo "type" é obrigatório');
    }
    
    if (this.value === null || this.value === undefined) {
      errors.push('Campo "value" é obrigatório');
    } else if (typeof this.value !== 'number' || isNaN(this.value)) {
      errors.push('Campo "value" deve ser um número');
    } else if (this.value <= 0) {
      errors.push('Campo "value" deve ser maior que zero');
    } else if (this.value > 999999.99) {
      errors.push('Campo "value" não pode ser maior que 999999.99');
    }
    
    if (!this.date) {
      errors.push('Campo "date" é obrigatório');
    } else if (!this._isValidDate(this.date)) {
      errors.push('Campo "date" deve estar no formato YYYY-MM-DD');
    }
    
    // ==========================================
    // VALIDAÇÃO: DATA FUTURA MUITO DISTANTE
    // ==========================================
    
    if (this.date && this._isValidDate(this.date)) {
      const inputDate = new Date(this.date);
      const now = new Date();
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      if (inputDate > oneYearFromNow) {
        errors.push('Data não pode ser superior a 1 ano no futuro');
      }
    }
    
    // ==========================================
    // VALIDAÇÃO: ENUM TYPE
    // ==========================================
    
    const validTypes = ['service', 'product', 'commission', 'other'];
    
    if (this.type && !validTypes.includes(this.type)) {
      errors.push('Campo "type" deve ser um dos valores válidos: service, product, commission, other');
    }
    
    // ==========================================
    // VALIDAÇÃO: ENUM STATUS (PostgreSQL transaction_status)
    // ==========================================
    
    // Validar contra valores do banco (português)
    if (this.status && !VALID_DB_STATUSES.includes(this.status)) {
      errors.push(
        `Status inválido: "${this.status}". ` +
        `Valores aceitos no DB: ${VALID_DB_STATUSES.join(', ')}`
      );
    }
    
    // ==========================================
    // VALIDAÇÃO: VALORES FINANCEIROS
    // ==========================================
    
    if (this.gross_amount && this.gross_amount <= 0) {
      errors.push('Campo "gross_amount" deve ser maior que zero');
    }
    
    if (this.net_amount && this.net_amount <= 0) {
      errors.push('Campo "net_amount" deve ser maior que zero');
    }
    
    if (this.fees && this.fees < 0) {
      errors.push('Campo "fees" não pode ser negativo');
    }
    
    // Validar coerência: net_amount = gross_amount - fees
    if (this.gross_amount && this.fees && this.net_amount) {
      const expectedNet = this.gross_amount - this.fees;
      const difference = Math.abs(this.net_amount - expectedNet);
      
      if (difference > 0.01) { // Tolerância de 1 centavo por arredondamento
        errors.push(
          `Valores inconsistentes: net_amount (${this.net_amount}) ` +
          `deveria ser gross_amount (${this.gross_amount}) - fees (${this.fees}) = ${expectedNet}`
        );
      }
    }
    
    // ==========================================
    // VALIDAÇÃO: DATAS DE COMPETÊNCIA
    // ==========================================
    
    if (this.accrual_start_date && !this._isValidDate(this.accrual_start_date)) {
      errors.push('Campo "accrual_start_date" deve estar no formato YYYY-MM-DD');
    }
    
    if (this.accrual_end_date && !this._isValidDate(this.accrual_end_date)) {
      errors.push('Campo "accrual_end_date" deve estar no formato YYYY-MM-DD');
    }
    
    // Validar que data de fim >= data de início
    if (this.accrual_start_date && this.accrual_end_date) {
      const startDate = new Date(this.accrual_start_date);
      const endDate = new Date(this.accrual_end_date);
      
      // Validar se as datas são válidas antes da comparação
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        errors.push('Datas de competência devem ser válidas para comparação');
      } else if (endDate < startDate) {
        errors.push(
          'Data de fim da competência (accrual_end_date) ' +
          'deve ser maior ou igual à data de início (accrual_start_date)'
        );
      }
    }
    
    if (this.expected_receipt_date && !this._isValidDate(this.expected_receipt_date)) {
      errors.push('Campo "expected_receipt_date" deve estar no formato YYYY-MM-DD');
    }
    
    if (this.actual_receipt_date && !this._isValidDate(this.actual_receipt_date)) {
      errors.push('Campo "actual_receipt_date" deve estar no formato YYYY-MM-DD');
    }
    
    // ==========================================
    // VALIDAÇÃO: UUIDs
    // ==========================================
    
    const uuidFields = [
      'unit_id', 
      'account_id', 
      'party_id', 
      'professional_id', 
      'user_id'
    ];
    
    for (const field of uuidFields) {
      if (this[field] && !this._isValidUUID(this[field])) {
        errors.push(`Campo "${field}" deve estar no formato UUID válido`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
  
  /**
   * Converte o DTO para formato do banco de dados
   * ✅ DESCOBERTA: O banco usa nomes em INGLÊS! Não precisa mapear!
   * 🛡️ APLICA WHITELIST + BLACKLIST para prevenir campos inválidos
   * 
   * @returns {Object} Objeto limpo para inserção no banco
   */
  toDatabase() {
    const dbObject = {};
    const warnings = [];
    
    // Iterar sobre todas as propriedades do DTO
    for (const [key, value] of Object.entries(this)) {
      // 🚫 BLACKLIST: Bloquear campos proibidos
      if (FORBIDDEN_REVENUE_FIELDS.includes(key)) {
        warnings.push(`Campo proibido bloqueado: "${key}"`);
        continue;
      }
      
      // 🛡️ WHITELIST: Aceitar apenas campos permitidos
      if (!ALLOWED_REVENUE_COLUMNS.includes(key)) {
        warnings.push(`Campo não reconhecido ignorado: "${key}"`);
        continue;
      }
      
      // ✅ Campo válido: incluir se não for null/undefined
      if (value !== null && value !== undefined) {
        dbObject[key] = value;
      }
    }

    // [FIX] Removido campo 'profit' do payload (campo gerado automaticamente no BD)
    // [EMERGENCY FIX] Proteção extra contra campos calculados que não devem ser inseridos
    const calculatedFields = ['profit', 'net_profit', 'profit_margin', 'lucro', 'margem_lucro'];
    calculatedFields.forEach(field => {
      if (field in dbObject) {
        delete dbObject[field];
        warnings.push(`Campo calculado removido: "${field}"`);
      }
    });
    
    // [EMERGENCY FIX] Proteção final - sempre remove profit mesmo se não detectado
    delete dbObject.profit;
    delete dbObject.net_profit;
    delete dbObject.profit_margin;
    
    // Log de avisos se houver
    if (warnings.length > 0) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ DTO.toDatabase() - Avisos de sanitização:', warnings);
    }
    
    // Log para debug
    // eslint-disable-next-line no-console
    console.log('📦 DTO.toDatabase() - Campos aprovados:', Object.keys(dbObject));
    
    return dbObject;
  }
  
  /**
   * Converte valor para número e trunca para 2 casas decimais
   * @private
   * @param {any} value - Valor a ser convertido
   * @returns {number|null}
   */
  _convertToNumber(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    const num = Number(value);
    if (isNaN(num)) {
      return null;
    }
    
    // Truncar para 2 casas decimais
    return Math.floor(num * 100) / 100;
  }

  /**
   * Retorna a data atual no formato YYYY-MM-DD
   * @private
   * @returns {string}
   */
  _getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Validador auxiliar: verifica se é uma data válida no formato YYYY-MM-DD
   * @private
   * @param {string} dateString - String de data para validar
   * @returns {boolean}
   */
  _isValidDate(dateString) {
    if (typeof dateString !== 'string') return false;
    
    // Regex para formato YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    
    // Parse parts to validate ranges
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    
    // Validate month and day ranges
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    
    // Verificar se é uma data válida criando e comparando com string original
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    
    // Garantir que a data criada corresponde à string original
    const recreatedString = date.toISOString().split('T')[0];
    return recreatedString === dateString;
  }
  
  /**
   * Validador auxiliar: verifica se é um UUID válido
   * @private
   * @param {string} uuid - String UUID para validar
   * @returns {boolean}
   */
  _isValidUUID(uuid) {
    if (typeof uuid !== 'string') return false;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

/**
 * DTO para resposta de receita (vinda do banco)
 * Transforma registro do banco em objeto estruturado
 * 
 * @class RevenueResponseDTO
 */
export class RevenueResponseDTO {
  /**
   * Construtor do DTO de resposta
   * @param {Object} dbRecord - Registro do banco de dados
   */
  constructor(dbRecord) {
    // Campos básicos
    this.id = dbRecord.id;
    this.type = dbRecord.type;
    this.value = this._parseNumber(dbRecord.value);
    this.date = dbRecord.date;
    this.source = dbRecord.source;
    this.observations = dbRecord.observations;
    
    // Relacionamentos
    this.unit_id = dbRecord.unit_id;
    this.account_id = dbRecord.account_id;
    this.party_id = dbRecord.party_id;
    this.professional_id = dbRecord.professional_id;
    this.user_id = dbRecord.user_id;
    
    // ✅ Objetos relacionados (populados pelo repository)
    this.unit = dbRecord.unit;
    this.bank_account = dbRecord.bank_account;
    
    // Valores financeiros
    this.gross_amount = this._parseNumber(dbRecord.gross_amount);
    this.net_amount = this._parseNumber(dbRecord.net_amount);
    this.fees = this._parseNumber(dbRecord.fees) || 0;
    
    // Datas de competência
    this.accrual_start_date = dbRecord.accrual_start_date;
    this.accrual_end_date = dbRecord.accrual_end_date;
    this.expected_receipt_date = dbRecord.expected_receipt_date;
    this.actual_receipt_date = dbRecord.actual_receipt_date;
    
    // Status e metadados
    this.status = dbRecord.status;
    this.created_at = dbRecord.created_at;
    
    // Calcular campos derivados
    this.is_received = dbRecord.status === 'Received';
    this.is_overdue = dbRecord.status === 'Overdue';
    this.is_pending = dbRecord.status === 'Pending';
  }
  
  /**
   * Converte para objeto plano (para compatibilidade com testes)
   * @returns {Object}
   */
  toPlainObject() {
    // Retorna apenas campos essenciais para compatibilidade com testes
    const baseFields = {
      id: this.id,
      type: this.type,
      value: this.value,
      date: this.date,
      unit_id: this.unit_id,
      account_id: this.account_id,
      professional_id: this.professional_id,
      user_id: this.user_id,
      status: this._normalizeStatus(this.status), // Normalizar status para consistência
      created_at: this.created_at,
      updated_at: this.updated_at || this.created_at, // Fallback para created_at se updated_at não existir
      expected_receipt_date: this.expected_receipt_date, // ✅ Adicionar data prevista de recebimento
      // ✅ Adicionar objetos relacionados
      unit: this.unit,
      bank_account: this.bank_account
    };

    // Adiciona actual_receipt_date se existir  
    if (this.actual_receipt_date !== undefined && this.actual_receipt_date !== null) {
      baseFields.actual_receipt_date = this.actual_receipt_date;
    }

    return baseFields;
  }
  
  /**
   * Converte valores numéricos do banco (que vêm como string)
   * @private
   * @param {any} value - Valor a ser convertido
   * @returns {number|null}
   */
  _parseNumber(value) {
    if (value === null || value === undefined) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  
  /**
   * Retorna representação formatada da receita
   * Útil para exibição em UI
   * @returns {Object}
   */
  toDisplay() {
    return {
      id: this.id,
      tipo: this._translateType(this.type),
      valor: this._formatCurrency(this.value),
      valorBruto: this.gross_amount ? this._formatCurrency(this.gross_amount) : null,
      valorLiquido: this.net_amount ? this._formatCurrency(this.net_amount) : null,
      taxas: this._formatCurrency(this.fees),
      data: this._formatDate(this.date),
      origem: this.source || 'Não especificada',
      status: this._translateStatus(this.status),
      recebida: this.is_received,
      atrasada: this.is_overdue,
      pendente: this.is_pending
    };
  }
  
  /**
   * Traduz tipo de receita para português
   * @private
   */
  _translateType(type) {
    const translations = {
      'service': 'Serviço',
      'subscription': 'Assinatura',
      'servico': 'Serviço',
      'produto': 'Produto',
      'assinatura': 'Assinatura',
      'outros': 'Outros'
    };
    return translations[type] || type;
  }
  
  /**
   * Normaliza status para capitalização consistente
   * @private
   */
  _normalizeStatus(status) {
    if (!status) return status;
    
    const normalized = status.toLowerCase();
    switch (normalized) {
      case 'pending': return 'Pending';
      case 'received': return 'Received';
      case 'overdue': return 'Overdue';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  /**
   * Traduz status para português
   * @private
   */
  _translateStatus(status) {
    const translations = {
      'Pending': 'Pendente',
      'Received': 'Recebida',
      'Overdue': 'Atrasada',
      'Cancelled': 'Cancelada'
    };
    return translations[status] || status;
  }
  
  /**
   * Formata valor monetário
   * @private
   */
  _formatCurrency(value) {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
  
  /**
   * Formata data
   * @private
   */
  _formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  }
}
