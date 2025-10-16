/* eslint-disable no-console */
/**
 * 🛡️ CORREÇÃO BUG-002: Sistema de Log Sanitization Global
 * 
 * Logger seguro que remove automaticamente dados sensíveis dos logs
 * Evita vazamento de informações pessoais/financeiras em produção
 * 
 * @author AI Security Engineer
 * @date 2025-10-15
 */

/**
 * Campos considerados sensíveis que devem ser sanitizados
 */
const SENSITIVE_FIELDS = [
  // Dados pessoais
  'password', 'senha', 'pass', 'pwd',
  'email', 'e-mail', 'mail',
  'cpf', 'cnpj', 'rg', 'documento',
  'phone', 'telefone', 'celular',
  'address', 'endereco', 'rua',
  
  // Dados financeiros
  'value', 'valor', 'amount', 'quantia',
  'balance', 'saldo', 'receita', 'despesa',
  'card', 'cartao', 'account', 'conta',
  
  // Dados de autenticação
  'token', 'jwt', 'auth', 'session',
  'user_metadata', 'metadata', 'payload',
  'authorization', 'bearer',
  
  // Dados bancários
  'bank_account', 'conta_bancaria', 'agencia',
  'pix', 'ted', 'doc', 'boleto'
];

/**
 * Padrões de texto que devem ser mascarados
 */
const SENSITIVE_PATTERNS = [
  // CPF: 123.456.789-00
  /\d{3}\.\d{3}\.\d{3}-\d{2}/g,
  // CNPJ: 12.345.678/0001-90
  /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g,
  // Email: user@domain.com
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // Telefone: (11) 99999-9999
  /\(\d{2}\)\s?\d{4,5}-?\d{4}/g,
  // Cartão de crédito: 1234 5678 9012 3456
  /\d{4}\s?\d{4}\s?\d{4}\s?\d{4}/g
];

/**
 * Classe principal do logger seguro
 */
export class SecureLogger {
  
  static isDevelopment = typeof window !== 'undefined' && 
    (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1');
  static isProduction = !SecureLogger.isDevelopment;
  
  /**
   * 🔒 Sanitiza objeto removendo dados sensíveis
   * @param {any} data - Dados para sanitizar
   * @param {number} maxDepth - Profundidade máxima (previne loop infinito)
   * @returns {any} Dados sanitizados
   */
  static sanitize(data, maxDepth = 5) {
    // Prevenir loop infinito
    if (maxDepth <= 0) {
      return '[Max depth reached]';
    }
    
    // Primitivos
    if (data === null || data === undefined) {
      return data;
    }
    
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }
    
    if (typeof data === 'number' || typeof data === 'boolean') {
      return data;
    }
    
    // Arrays
    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item, maxDepth - 1));
    }
    
    // Objetos
    if (typeof data === 'object') {
      return this.sanitizeObject(data, maxDepth);
    }
    
    // Outros tipos
    return String(data);
  }
  
  /**
   * 🔒 Sanitiza objeto recursivamente
   * @param {Object} obj - Objeto para sanitizar
   * @param {number} maxDepth - Profundidade máxima
   * @returns {Object} Objeto sanitizado
   * @private
   */
  static sanitizeObject(obj, maxDepth) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // ✅ Verificar se a chave é sensível
      const isSensitiveKey = SENSITIVE_FIELDS.some(field => 
        lowerKey.includes(field.toLowerCase()) || 
        field.toLowerCase().includes(lowerKey)
      );
      
      if (isSensitiveKey) {
        sanitized[key] = '***REDACTED***';
      } else {
        sanitized[key] = this.sanitize(value, maxDepth - 1);
      }
    }
    
    return sanitized;
  }
  
  /**
   * 🔒 Sanitiza string mascarando dados sensíveis
   * @param {string} str - String para sanitizar
   * @returns {string} String sanitizada
   * @private
   */
  static sanitizeString(str) {
    if (typeof str !== 'string') {
      return str;
    }
    
    let sanitized = str;
    
    // ✅ Aplicar padrões de mascaramento
    for (const pattern of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, '***MASKED***');
    }
    
    return sanitized;
  }
  
  /**
   * 📝 Log de debug - apenas em desenvolvimento
   * @param {string} message - Mensagem
   * @param {any} data - Dados opcionais
   */
  static debug(message, data = null) {
    if (this.isDevelopment && data !== null) {
      console.log(`🔍 DEBUG: ${message}`, this.sanitize(data));
    } else if (this.isDevelopment) {
      console.log(`🔍 DEBUG: ${message}`);
    }
  }
  
  /**
   * ℹ️ Log de informação - sanitizado em produção
   * @param {string} message - Mensagem
   * @param {any} data - Dados opcionais
   */
  static info(message, data = null) {
    if (data !== null) {
      console.info(`ℹ️ INFO: ${message}`, this.isProduction ? this.sanitize(data) : data);
    } else {
      console.info(`ℹ️ INFO: ${message}`);
    }
  }
  
  /**
   * ⚠️ Log de aviso - sanitizado em produção
   * @param {string} message - Mensagem
   * @param {any} data - Dados opcionais
   */
  static warn(message, data = null) {
    if (data !== null) {
      console.warn(`⚠️ WARN: ${message}`, this.isProduction ? this.sanitize(data) : data);
    } else {
      console.warn(`⚠️ WARN: ${message}`);
    }
  }
  
  /**
   * ❌ Log de erro - sempre sanitizado
   * @param {string} message - Mensagem
   * @param {any} error - Erro ou dados
   */
  static error(message, error = null) {
    if (error !== null) {
      console.error(`❌ ERROR: ${message}`, this.sanitize(error));
    } else {
      console.error(`❌ ERROR: ${message}`);
    }
  }
  
  /**
   * 🎯 Log de sucesso - sanitizado em produção
   * @param {string} message - Mensagem
   * @param {any} data - Dados opcionais
   */
  static success(message, data = null) {
    if (data !== null) {
      console.log(`✅ SUCCESS: ${message}`, this.isProduction ? this.sanitize(data) : data);
    } else {
      console.log(`✅ SUCCESS: ${message}`);
    }
  }
  
  /**
   * 🔐 Log de autenticação - sempre sanitizado
   * @param {string} message - Mensagem
   * @param {any} data - Dados de autenticação
   */
  static auth(message, data = null) {
    // Sempre sanitizar dados de autenticação
    if (data !== null) {
      console.log(`🔐 AUTH: ${message}`, this.sanitize(data));
    } else {
      console.log(`🔐 AUTH: ${message}`);
    }
  }
  
  /**
   * 💰 Log financeiro - sempre sanitizado
   * @param {string} message - Mensagem
   * @param {any} data - Dados financeiros
   */
  static financial(message, data = null) {
    // Sempre sanitizar dados financeiros
    if (data !== null) {
      console.log(`💰 FINANCIAL: ${message}`, this.sanitize(data));
    } else {
      console.log(`💰 FINANCIAL: ${message}`);
    }
  }
}

/**
 * Logger padrão para compatibilidade
 * Pode ser usado como drop-in replacement para console.log
 */
export const logger = SecureLogger;

/**
 * Função utilitária para sanitizar dados manualmente
 * @param {any} data - Dados para sanitizar
 * @returns {any} Dados sanitizados
 */
export const sanitizeData = (data) => SecureLogger.sanitize(data);

/**
 * Verifica se está em ambiente de produção
 * @returns {boolean} True se produção
 */
export const isProduction = () => SecureLogger.isProduction;

/**
 * Verifica se está em ambiente de desenvolvimento
 * @returns {boolean} True se desenvolvimento
 */
export const isDevelopment = () => SecureLogger.isDevelopment;

export default SecureLogger;