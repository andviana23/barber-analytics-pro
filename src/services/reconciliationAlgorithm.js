/**
 * reconciliationAlgorithm.js
 * 
 * Algoritmo avançado de conciliação bancária com matching automático.
 * Utiliza tolerância de ±2 dias para datas e ±5% para valores.
 * Scoring de confiança baseado em party, descrição e proximidade de valores.
 * 
 * Autor: Sistema Barber Analytics Pro
 * Data: 2024
 */

/**
 * Classe para algoritmo de conciliação bancária
 */
export class ReconciliationAlgorithm {
  constructor() {
    // Configurações do algoritmo
    this.config = {
      // Tolerâncias
      dateTolerance: 2, // ±2 dias
      amountTolerance: 0.05, // ±5%
      
      // Pesos para scoring
      weights: {
        party: 0.35,        // 35% - Party match
        description: 0.25,  // 25% - Descrição similar
        amount: 0.25,       // 25% - Proximidade do valor
        date: 0.15          // 15% - Proximidade da data
      },
      
      // Limites de confiança
      confidenceThreshold: {
        high: 0.85,    // 85%+ = Alta confiança
        medium: 0.65,  // 65%+ = Média confiança
        low: 0.45      // 45%+ = Baixa confiança
      },
      
      // Configurações de matching
      maxMatches: 5,              // Máximo de matches por item
      minDescriptionLength: 3,    // Mínimo de caracteres para comparar descrição
      similarityThreshold: 0.6    // 60% similaridade mínima
    };
  }

  /**
   * Executa o matching automático entre extratos e transações
   * @param {Array} statements - Array de extratos bancários
   * @param {Array} transactions - Array de receitas/despesas
   * @param {Object} options - Opções adicionais
   * @returns {Array} Array de matches encontrados
   */
  async findMatches(statements, transactions, options = {}) {
    try {
      const matches = [];
      const usedStatements = new Set();
      const usedTransactions = new Set();

      // Aplicar filtros se fornecidos
      const filteredStatements = this.applyFilters(statements, options.statementFilters);
      const filteredTransactions = this.applyFilters(transactions, options.transactionFilters);

      // Processar cada extrato
      for (const statement of filteredStatements) {
        if (usedStatements.has(statement.id)) continue;

        const statementMatches = [];

        // Buscar possíveis matches para este extrato
        for (const transaction of filteredTransactions) {
          if (usedTransactions.has(transaction.id)) continue;

          const matchData = await this.calculateMatch(statement, transaction);
          
          if (matchData.confidence >= this.config.confidenceThreshold.low) {
            statementMatches.push({
              statementId: statement.id,
              transactionId: transaction.id,
              transactionType: transaction.type || 'revenue', // revenue ou expense
              ...matchData
            });
          }
        }

        // Ordenar matches por confiança
        statementMatches.sort((a, b) => b.confidence - a.confidence);

        // Pegar os melhores matches
        const bestMatches = statementMatches.slice(0, this.config.maxMatches);
        
        // Se existe match de alta confiança, marcar como usado automaticamente
        if (bestMatches.length > 0 && bestMatches[0].confidence >= this.config.confidenceThreshold.high) {
          const bestMatch = bestMatches[0];
          usedStatements.add(statement.id);
          usedTransactions.add(bestMatch.transactionId);
          bestMatch.autoMatched = true;
        }

        matches.push(...bestMatches);
      }

      // Agrupar matches por extrato
      const groupedMatches = this.groupMatchesByStatement(matches);

      return {
        matches: groupedMatches,
        statistics: this.calculateMatchingStatistics(matches, filteredStatements, filteredTransactions)
      };

    } catch (error) {
      throw new Error(`Erro no algoritmo de matching: ${error.message}`);
    }
  }

  /**
   * Calcula o score de match entre um extrato e uma transação
   * @param {Object} statement - Extrato bancário
   * @param {Object} transaction - Transação (receita/despesa)
   * @returns {Object} Dados do match com score
   */
  async calculateMatch(statement, transaction) {
    try {
      const scores = {
        party: 0,
        description: 0,
        amount: 0,
        date: 0
      };

      const details = {
        partyMatch: false,
        descriptionSimilarity: 0,
        amountDifference: 0,
        dateDifference: 0
      };

      // 1. Score por Party (se aplicável)
      if (statement.party_id && transaction.party_id) {
        if (statement.party_id === transaction.party_id) {
          scores.party = 1.0;
          details.partyMatch = true;
        }
      } else if (statement.party_name && transaction.party_name) {
        const partySimilarity = this.calculateStringSimilarity(
          statement.party_name,
          transaction.party_name
        );
        if (partySimilarity >= this.config.similarityThreshold) {
          scores.party = partySimilarity;
          details.partyMatch = partySimilarity > 0.8;
        }
      }

      // 2. Score por Descrição
      if (statement.description && transaction.description) {
        const descSimilarity = this.calculateStringSimilarity(
          statement.description,
          transaction.description
        );
        scores.description = descSimilarity;
        details.descriptionSimilarity = descSimilarity;
      }

      // 3. Score por Valor
      const amountMatch = this.calculateAmountScore(statement.amount, transaction.value);
      scores.amount = amountMatch.score;
      details.amountDifference = amountMatch.difference;

      // 4. Score por Data
      const dateMatch = this.calculateDateScore(statement.date, transaction.date);
      scores.date = dateMatch.score;
      details.dateDifference = dateMatch.daysDifference;

      // Calcular confiança total
      const confidence = (
        scores.party * this.config.weights.party +
        scores.description * this.config.weights.description +
        scores.amount * this.config.weights.amount +
        scores.date * this.config.weights.date
      );

      // Determinar nível de confiança
      let confidenceLevel = 'low';
      if (confidence >= this.config.confidenceThreshold.high) {
        confidenceLevel = 'high';
      } else if (confidence >= this.config.confidenceThreshold.medium) {
        confidenceLevel = 'medium';
      }

      return {
        confidence: Math.round(confidence * 100) / 100,
        confidenceLevel,
        scores,
        details,
        explanation: this.generateMatchExplanation(scores, details, confidence)
      };

    } catch (error) {
      throw new Error(`Erro ao calcular match: ${error.message}`);
    }
  }

  /**
   * Calcula similaridade entre strings usando algoritmo de Levenshtein adaptado
   * @param {string} str1 - Primeira string
   * @param {string} str2 - Segunda string
   * @returns {number} Score de similaridade (0-1)
   */
  calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;

    // Normalizar strings
    const s1 = str1.toLowerCase().trim().replace(/[^\w\s]/g, '');
    const s2 = str2.toLowerCase().trim().replace(/[^\w\s]/g, '');

    if (s1 === s2) return 1;
    if (s1.length < this.config.minDescriptionLength || s2.length < this.config.minDescriptionLength) {
      return 0;
    }

    // Verificar substrings comuns
    if (s1.includes(s2) || s2.includes(s1)) {
      return 0.8;
    }

    // Algoritmo de distância de Levenshtein
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
            matrix[i - 1][j - 1] + 1, // Substituição
            matrix[i][j - 1] + 1,     // Inserção
            matrix[i - 1][j] + 1      // Deleção
          );
        }
      }
    }

    const maxLength = Math.max(len1, len2);
    const similarity = (maxLength - matrix[len2][len1]) / maxLength;
    
    return Math.max(0, similarity);
  }

  /**
   * Calcula score de proximidade de valores
   * @param {number} amount1 - Valor do extrato
   * @param {number} amount2 - Valor da transação
   * @returns {Object} Score e diferença
   */
  calculateAmountScore(amount1, amount2) {
    if (!amount1 || !amount2) return { score: 0, difference: Infinity };

    const abs1 = Math.abs(amount1);
    const abs2 = Math.abs(amount2);
    const difference = Math.abs(abs1 - abs2);
    const averageAmount = (abs1 + abs2) / 2;
    
    // Verificar se está dentro da tolerância
    const tolerance = averageAmount * this.config.amountTolerance;
    
    if (difference <= tolerance) {
      // Score baseado na proximidade dentro da tolerância
      const proximityScore = 1 - (difference / tolerance);
      return {
        score: Math.max(0.7, proximityScore), // Mínimo 0.7 se dentro da tolerância
        difference: difference,
        withinTolerance: true
      };
    }

    // Fora da tolerância - score degradado
    const degradationFactor = Math.min(5, difference / tolerance); // Máximo penalidade x5
    const score = Math.max(0, 0.5 / degradationFactor);

    return {
      score: score,
      difference: difference,
      withinTolerance: false
    };
  }

  /**
   * Calcula score de proximidade de datas
   * @param {string|Date} date1 - Data do extrato
   * @param {string|Date} date2 - Data da transação
   * @returns {Object} Score e diferença em dias
   */
  calculateDateScore(date1, date2) {
    if (!date1 || !date2) return { score: 0, daysDifference: Infinity };

    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    const timeDiff = Math.abs(d1.getTime() - d2.getTime());
    const daysDifference = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDifference <= this.config.dateTolerance) {
      // Dentro da tolerância
      const proximityScore = 1 - (daysDifference / this.config.dateTolerance);
      return {
        score: Math.max(0.7, proximityScore),
        daysDifference: daysDifference,
        withinTolerance: true
      };
    }

    // Fora da tolerância - degradar score
    const maxDays = 30; // Máximo 30 dias para ter algum score
    if (daysDifference > maxDays) {
      return { score: 0, daysDifference: daysDifference, withinTolerance: false };
    }

    const score = Math.max(0, 0.3 * (1 - daysDifference / maxDays));
    return {
      score: score,
      daysDifference: daysDifference,
      withinTolerance: false
    };
  }

  /**
   * Aplica filtros aos arrays de dados
   * @param {Array} data - Dados para filtrar
   * @param {Object} filters - Filtros a aplicar
   * @returns {Array} Dados filtrados
   */
  applyFilters(data, filters = {}) {
    if (!filters || Object.keys(filters).length === 0) return data;

    return data.filter(item => {
      // Filtro por data
      if (filters.startDate && new Date(item.date) < new Date(filters.startDate)) {
        return false;
      }
      if (filters.endDate && new Date(item.date) > new Date(filters.endDate)) {
        return false;
      }

      // Filtro por valor mínimo/máximo
      if (filters.minAmount && Math.abs(item.amount || item.value) < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount && Math.abs(item.amount || item.value) > filters.maxAmount) {
        return false;
      }

      // Filtro por party
      if (filters.partyId && item.party_id !== filters.partyId) {
        return false;
      }

      // Filtro por status
      if (filters.status && item.status !== filters.status) {
        return false;
      }

      // Filtro para apenas não conciliados
      if (filters.unreconciled && item.reconciled) {
        return false;
      }

      return true;
    });
  }

  /**
   * Agrupa matches por extrato bancário
   * @param {Array} matches - Array de matches
   * @returns {Array} Matches agrupados por extrato
   */
  groupMatchesByStatement(matches) {
    const grouped = {};

    matches.forEach(match => {
      if (!grouped[match.statementId]) {
        grouped[match.statementId] = {
          statementId: match.statementId,
          matches: [],
          bestMatch: null,
          autoMatched: false
        };
      }

      grouped[match.statementId].matches.push(match);
      
      // Atualizar melhor match
      if (!grouped[match.statementId].bestMatch || 
          match.confidence > grouped[match.statementId].bestMatch.confidence) {
        grouped[match.statementId].bestMatch = match;
      }

      // Marcar se foi auto-matched
      if (match.autoMatched) {
        grouped[match.statementId].autoMatched = true;
      }
    });

    return Object.values(grouped);
  }

  /**
   * Calcula estatísticas do matching
   * @param {Array} matches - Array de matches
   * @param {Array} statements - Extratos originais
   * @param {Array} transactions - Transações originais
   * @returns {Object} Estatísticas
   */
  calculateMatchingStatistics(matches, statements, transactions) {
    const stats = {
      totalStatements: statements.length,
      totalTransactions: transactions.length,
      totalMatches: matches.length,
      autoMatches: matches.filter(m => m.autoMatched).length,
      confidenceDistribution: {
        high: matches.filter(m => m.confidenceLevel === 'high').length,
        medium: matches.filter(m => m.confidenceLevel === 'medium').length,
        low: matches.filter(m => m.confidenceLevel === 'low').length
      },
      averageConfidence: 0,
      matchRate: 0,
      autoMatchRate: 0
    };

    if (matches.length > 0) {
      const totalConfidence = matches.reduce((sum, m) => sum + m.confidence, 0);
      stats.averageConfidence = Math.round((totalConfidence / matches.length) * 100) / 100;
    }

    if (statements.length > 0) {
      const uniqueMatchedStatements = new Set(matches.map(m => m.statementId));
      stats.matchRate = Math.round((uniqueMatchedStatements.size / statements.length) * 100) / 100;
      stats.autoMatchRate = Math.round((stats.autoMatches / statements.length) * 100) / 100;
    }

    return stats;
  }

  /**
   * Gera explicação textual do match
   * @param {Object} scores - Scores individuais
   * @param {Object} details - Detalhes do matching
   * @param {number} confidence - Confiança total
   * @returns {string} Explicação do match
   */
  generateMatchExplanation(scores, details, confidence) {
    const explanations = [];

    if (details.partyMatch) {
      explanations.push('Same party/person');
    }

    if (details.descriptionSimilarity > 0.7) {
      explanations.push(`Description ${Math.round(details.descriptionSimilarity * 100)}% similar`);
    }

    if (details.amountDifference === 0) {
      explanations.push('Exact amount match');
    } else if (scores.amount > 0.7) {
      explanations.push(`Amount within tolerance (diff: $${details.amountDifference.toFixed(2)})`);
    }

    if (details.dateDifference === 0) {
      explanations.push('Same date');
    } else if (scores.date > 0.7) {
      explanations.push(`Date within ${details.dateDifference} days`);
    }

    if (explanations.length === 0) {
      explanations.push('Low confidence match');
    }

    return explanations.join(', ');
  }

  /**
   * Recalcula matches com novas configurações
   * @param {Object} newConfig - Nova configuração
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig,
      weights: {
        ...this.config.weights,
        ...(newConfig.weights || {})
      },
      confidenceThreshold: {
        ...this.config.confidenceThreshold,
        ...(newConfig.confidenceThreshold || {})
      }
    };
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
export const reconciliationAlgorithm = new ReconciliationAlgorithm();

// Exportar classe para instanciação customizada
export default ReconciliationAlgorithm;