/**
 * duplicateDetector.js
 *
 * Detector de duplicatas usando hash MD5 de campos-chave.
 * Prevenção de inserções duplicadas com validação inteligente.
 * Hash baseado em: date, amount, description, party_id, account_id.
 *
 * Autor: Sistema Barber Analytics Pro
 * Data: 2024
 */

import CryptoJS from 'crypto-js';

/**
 * Classe para detecção e prevenção de duplicatas
 */
export class DuplicateDetector {
  constructor() {
    // Configurações do detector
    this.config = {
      // Campos usados para hash
      hashFields: {
        primary: ['date', 'amount', 'description'],
        secondary: ['party_id', 'account_id', 'unit_id'],
        optional: ['document', 'category', 'type'],
      },

      // Tolerâncias para matching
      tolerance: {
        amount: 0.01, // R$ 0,01 de diferença
        date: 0, // 0 dias de diferença (exato)
        description: 0.9, // 90% de similaridade
      },

      // Configurações de cache
      cache: {
        enabled: true,
        ttl: 10 * 60 * 1000, // 10 minutos
        maxSize: 1000, // Máximo 1000 entradas
      },

      // Configurações de batch processing
      batch: {
        size: 100, // Processar 100 por vez
        delay: 100, // 100ms entre batches
      },
    };

    // Cache interno
    this.hashCache = new Map();
    this.similarityCache = new Map();
  }

  /**
   * Gera hash MD5 para uma transação
   * @param {Object} transaction - Dados da transação
   * @param {Object} options - Opções de configuração
   * @returns {string} Hash MD5 gerado
   */
  generateHash(transaction, options = {}) {
    try {
      const fields = options.fields || this.config.hashFields;
      const hashData = {};

      // Extrair campos primários
      fields.primary.forEach(field => {
        let value = transaction[field];

        // Normalizar valores
        if (field === 'date' && value) {
          // Normalizar data para YYYY-MM-DD
          const date = new Date(value);
          value = date.toISOString().split('T')[0];
        } else if (field === 'amount' && typeof value === 'number') {
          // Normalizar valor para 2 casas decimais
          value = Math.abs(value).toFixed(2);
        } else if (field === 'description' && value) {
          // Normalizar descrição
          value = this.normalizeString(value);
        }

        hashData[field] = value || '';
      });

      // Extrair campos secundários
      fields.secondary.forEach(field => {
        hashData[field] = transaction[field] || '';
      });

      // Extrair campos opcionais se fornecidos
      if (options.includeOptional) {
        fields.optional.forEach(field => {
          hashData[field] = transaction[field] || '';
        });
      }

      // Criar string para hash
      const hashString = Object.keys(hashData)
        .sort()
        .map(key => `${key}:${hashData[key]}`)
        .join('|');

      // Gerar hash MD5
      return CryptoJS.MD5(hashString).toString();
    } catch (error) {
      throw new Error(`Erro ao gerar hash: ${error.message}`);
    }
  }

  /**
   * Verifica se uma transação é duplicata
   * @param {Object} transaction - Nova transação
   * @param {Array} existingTransactions - Transações existentes
   * @param {Object} options - Opções de verificação
   * @returns {Object} Resultado da verificação
   */
  async checkDuplicate(transaction, existingTransactions, options = {}) {
    try {
      const newHash = this.generateHash(transaction, options);

      // Verificar cache primeiro
      const cacheKey = `dup_${newHash}`;
      if (this.config.cache.enabled && this.hashCache.has(cacheKey)) {
        const cached = this.hashCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.config.cache.ttl) {
          return cached.result;
        }
      }

      const duplicates = [];
      const similarities = [];

      // Verificar contra transações existentes
      for (const existing of existingTransactions) {
        // Hash exato
        const existingHash = this.generateHash(existing, options);

        if (newHash === existingHash) {
          duplicates.push({
            id: existing.id,
            type: 'exact',
            confidence: 1.0,
            hash: existingHash,
            matchedFields: this.getMatchedFields(transaction, existing),
            transaction: existing,
          });
          continue;
        }

        // Verificação de similaridade
        const similarity = await this.calculateSimilarity(
          transaction,
          existing,
          options
        );

        if (similarity.score >= (options.similarityThreshold || 0.85)) {
          similarities.push({
            id: existing.id,
            type: 'similar',
            confidence: similarity.score,
            details: similarity.details,
            transaction: existing,
          });
        }
      }

      const result = {
        isDuplicate: duplicates.length > 0,
        isSimilar: similarities.length > 0,
        hash: newHash,
        exactMatches: duplicates,
        similarMatches: similarities,
        confidence:
          duplicates.length > 0
            ? 1.0
            : similarities.length > 0
              ? Math.max(...similarities.map(s => s.confidence))
              : 0,
        checkedAt: new Date().toISOString(),
      };

      // Armazenar no cache
      if (this.config.cache.enabled) {
        this.manageCacheSize();
        this.hashCache.set(cacheKey, {
          result: result,
          timestamp: Date.now(),
        });
      }

      return result;
    } catch (error) {
      return {
        isDuplicate: false,
        isSimilar: false,
        error: error.message,
        checkedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Verifica duplicatas em lote
   * @param {Array} newTransactions - Novas transações
   * @param {Array} existingTransactions - Transações existentes
   * @param {Object} options - Opções de verificação
   * @returns {Array} Resultados da verificação
   */
  async checkBatchDuplicates(
    newTransactions,
    existingTransactions,
    options = {}
  ) {
    const results = [];
    const batchSize = options.batchSize || this.config.batch.size;

    // Processar em batches para performance
    for (let i = 0; i < newTransactions.length; i += batchSize) {
      const batch = newTransactions.slice(i, i + batchSize);

      const batchPromises = batch.map(transaction =>
        this.checkDuplicate(transaction, existingTransactions, options)
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Delay entre batches se configurado
      if (
        this.config.batch.delay > 0 &&
        i + batchSize < newTransactions.length
      ) {
        await new Promise(resolve =>
          setTimeout(resolve, this.config.batch.delay)
        );
      }
    }

    return results;
  }

  /**
   * Calcula similaridade entre duas transações
   * @param {Object} transaction1 - Primeira transação
   * @param {Object} transaction2 - Segunda transação
   * @param {Object} options - Opções de cálculo
   * @returns {Object} Score de similaridade e detalhes
   */
  async calculateSimilarity(transaction1, transaction2, options = {}) {
    const cacheKey = `sim_${transaction1.id || 'new'}_${transaction2.id}`;

    // Verificar cache
    if (this.config.cache.enabled && this.similarityCache.has(cacheKey)) {
      const cached = this.similarityCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cache.ttl) {
        return cached.result;
      }
    }

    const scores = {
      date: 0,
      amount: 0,
      description: 0,
      party: 0,
      account: 0,
    };

    const details = {};

    // 1. Score de data
    if (transaction1.date && transaction2.date) {
      const dateSimilarity = this.calculateDateSimilarity(
        transaction1.date,
        transaction2.date
      );
      scores.date = dateSimilarity.score;
      details.date = dateSimilarity;
    }

    // 2. Score de valor
    if (transaction1.amount && transaction2.amount) {
      const amountSimilarity = this.calculateAmountSimilarity(
        transaction1.amount,
        transaction2.amount
      );
      scores.amount = amountSimilarity.score;
      details.amount = amountSimilarity;
    }

    // 3. Score de descrição
    if (transaction1.description && transaction2.description) {
      const descSimilarity = this.calculateStringSimilarity(
        transaction1.description,
        transaction2.description
      );
      scores.description = descSimilarity;
      details.description = { similarity: descSimilarity };
    }

    // 4. Score de party
    if (transaction1.party_id && transaction2.party_id) {
      scores.party = transaction1.party_id === transaction2.party_id ? 1.0 : 0;
      details.party = { match: scores.party === 1.0 };
    }

    // 5. Score de conta
    if (transaction1.account_id && transaction2.account_id) {
      scores.account =
        transaction1.account_id === transaction2.account_id ? 1.0 : 0;
      details.account = { match: scores.account === 1.0 };
    }

    // Calcular score total ponderado
    const weights = options.weights || {
      date: 0.25,
      amount: 0.35,
      description: 0.25,
      party: 0.1,
      account: 0.05,
    };

    const totalScore = Object.keys(scores).reduce((sum, key) => {
      return sum + scores[key] * (weights[key] || 0);
    }, 0);

    const result = {
      score: Math.round(totalScore * 100) / 100,
      scores: scores,
      details: details,
      calculatedAt: new Date().toISOString(),
    };

    // Armazenar no cache
    if (this.config.cache.enabled) {
      this.manageCacheSize();
      this.similarityCache.set(cacheKey, {
        result: result,
        timestamp: Date.now(),
      });
    }

    return result;
  }

  /**
   * Calcula similaridade de datas
   * @param {string|Date} date1 - Primeira data
   * @param {string|Date} date2 - Segunda data
   * @returns {Object} Score e diferença
   */
  calculateDateSimilarity(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    const diffTime = Math.abs(d1.getTime() - d2.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= this.config.tolerance.date) {
      return { score: 1.0, daysDifference: diffDays, exact: true };
    }

    // Score degradado baseado na diferença
    const maxDays = 7; // Máximo 7 dias para ter algum score
    if (diffDays > maxDays) {
      return { score: 0, daysDifference: diffDays, exact: false };
    }

    const score = Math.max(0, 1 - diffDays / maxDays);
    return { score: score, daysDifference: diffDays, exact: false };
  }

  /**
   * Calcula similaridade de valores
   * @param {number} amount1 - Primeiro valor
   * @param {number} amount2 - Segundo valor
   * @returns {Object} Score e diferença
   */
  calculateAmountSimilarity(amount1, amount2) {
    const abs1 = Math.abs(amount1);
    const abs2 = Math.abs(amount2);
    const difference = Math.abs(abs1 - abs2);

    if (difference <= this.config.tolerance.amount) {
      return { score: 1.0, difference: difference, exact: true };
    }

    // Score baseado na diferença percentual
    const maxAmount = Math.max(abs1, abs2);
    const percentDiff = difference / maxAmount;

    if (percentDiff > 0.1) {
      // Mais de 10% de diferença = score 0
      return { score: 0, difference: difference, exact: false };
    }

    const score = Math.max(0, 1 - percentDiff / 0.1);
    return { score: score, difference: difference, exact: false };
  }

  /**
   * Calcula similaridade de strings (Levenshtein adaptado)
   * @param {string} str1 - Primeira string
   * @param {string} str2 - Segunda string
   * @returns {number} Score de similaridade (0-1)
   */
  calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;

    const s1 = this.normalizeString(str1);
    const s2 = this.normalizeString(str2);

    if (s1 === s2) return 1;
    if (s1.length < 3 || s2.length < 3) return 0;

    // Verificar substrings comuns
    if (s1.includes(s2) || s2.includes(s1)) {
      return 0.85;
    }

    // Distância de Levenshtein
    const matrix = [];
    const len1 = s1.length;
    const len2 = s2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLength = Math.max(len1, len2);
    const similarity = (maxLength - matrix[len2][len1]) / maxLength;

    return Math.max(0, similarity);
  }

  /**
   * Normaliza string para comparação
   * @param {string} str - String para normalizar
   * @returns {string} String normalizada
   */
  normalizeString(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Múltiplos espaços -> um espaço
      .replace(/[^\w\s]/g, '') // Remove pontuação
      .replace(/\d+/g, '#'); // Números -> #
  }

  /**
   * Identifica campos que fazem match entre transações
   * @param {Object} transaction1 - Primeira transação
   * @param {Object} transaction2 - Segunda transação
   * @returns {Array} Array de campos que fazem match
   */
  getMatchedFields(transaction1, transaction2) {
    const matchedFields = [];
    const fieldsToCheck = [
      'date',
      'amount',
      'description',
      'party_id',
      'account_id',
      'unit_id',
      'category',
      'type',
    ];

    fieldsToCheck.forEach(field => {
      let match = false;

      if (field === 'amount') {
        const diff = Math.abs(
          (transaction1[field] || 0) - (transaction2[field] || 0)
        );
        match = diff <= this.config.tolerance.amount;
      } else if (field === 'date') {
        match =
          new Date(transaction1[field]).toDateString() ===
          new Date(transaction2[field]).toDateString();
      } else if (field === 'description') {
        const similarity = this.calculateStringSimilarity(
          transaction1[field] || '',
          transaction2[field] || ''
        );
        match = similarity >= this.config.tolerance.description;
      } else {
        match = transaction1[field] === transaction2[field];
      }

      if (match) {
        matchedFields.push(field);
      }
    });

    return matchedFields;
  }

  /**
   * Gerencia tamanho do cache para evitar uso excessivo de memória
   */
  manageCacheSize() {
    if (this.hashCache.size > this.config.cache.maxSize) {
      // Remover entradas mais antigas
      const entries = Array.from(this.hashCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = entries.slice(
        0,
        Math.floor(this.config.cache.maxSize * 0.2)
      );
      toRemove.forEach(([key]) => this.hashCache.delete(key));
    }

    if (this.similarityCache.size > this.config.cache.maxSize) {
      const entries = Array.from(this.similarityCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = entries.slice(
        0,
        Math.floor(this.config.cache.maxSize * 0.2)
      );
      toRemove.forEach(([key]) => this.similarityCache.delete(key));
    }
  }

  /**
   * Remove duplicatas de um array de transações
   * @param {Array} transactions - Array de transações
   * @param {Object} options - Opções de remoção
   * @returns {Object} Resultado da remoção
   */
  async removeDuplicates(transactions, options = {}) {
    const unique = [];
    const duplicates = [];
    const processedHashes = new Set();

    for (const transaction of transactions) {
      const hash = this.generateHash(transaction, options);

      if (processedHashes.has(hash)) {
        duplicates.push({
          transaction: transaction,
          hash: hash,
          reason: 'duplicate_hash',
        });
      } else {
        // Verificar similaridade com transações únicas existentes
        if (options.checkSimilarity) {
          let isDuplicate = false;

          for (const uniqueTransaction of unique) {
            const similarity = await this.calculateSimilarity(
              transaction,
              uniqueTransaction,
              options
            );

            if (similarity.score >= (options.similarityThreshold || 0.9)) {
              duplicates.push({
                transaction: transaction,
                hash: hash,
                similarTo: uniqueTransaction,
                similarity: similarity,
                reason: 'similar_transaction',
              });
              isDuplicate = true;
              break;
            }
          }

          if (!isDuplicate) {
            unique.push(transaction);
            processedHashes.add(hash);
          }
        } else {
          unique.push(transaction);
          processedHashes.add(hash);
        }
      }
    }

    return {
      original: transactions.length,
      unique: unique.length,
      duplicates: duplicates.length,
      uniqueTransactions: unique,
      duplicateTransactions: duplicates,
      removalRate: duplicates.length / transactions.length,
    };
  }

  /**
   * Limpa todos os caches
   */
  clearCache() {
    this.hashCache.clear();
    this.similarityCache.clear();
  }

  /**
   * Obtém estatísticas do cache
   * @returns {Object} Estatísticas do cache
   */
  getCacheStats() {
    return {
      hashCache: {
        size: this.hashCache.size,
        maxSize: this.config.cache.maxSize,
      },
      similarityCache: {
        size: this.similarityCache.size,
        maxSize: this.config.cache.maxSize,
      },
      enabled: this.config.cache.enabled,
      ttl: this.config.cache.ttl,
    };
  }

  /**
   * Atualiza configurações do detector
   * @param {Object} newConfig - Novas configurações
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig,
      hashFields: {
        ...this.config.hashFields,
        ...(newConfig.hashFields || {}),
      },
      tolerance: {
        ...this.config.tolerance,
        ...(newConfig.tolerance || {}),
      },
      cache: {
        ...this.config.cache,
        ...(newConfig.cache || {}),
      },
    };

    // Limpar cache se configurações mudaram
    if (newConfig.hashFields || newConfig.tolerance) {
      this.clearCache();
    }
  }

  /**
   * Obtém configuração atual
   * @returns {Object} Configuração atual
   */
  getConfig() {
    return { ...this.config };
  }
}

// Exportar instância singleton
export const duplicateDetector = new DuplicateDetector();

// Exportar classe para instanciação customizada
export default DuplicateDetector;
