/**
 * autoCategorization.js
 *
 * Serviço de auto-categorização inteligente de transações bancárias
 * Analisa a descrição da transação e sugere uma categoria baseada nas categorias
 * cadastradas no sistema pelo usuário
 */

import categoriesService from './categoriesService';

/**
 * Cache de categorias para evitar múltiplas chamadas ao banco
 */
let cachedCategories = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Categoria padrão quando não há match
 */
const DEFAULT_CATEGORY = 'Despesas sem Identificação';

/**
 * Busca e cacheia categorias do banco de dados
 * @returns {Promise<Array>} - Lista de categorias ativas
 */
async function fetchCategories() {
  const now = Date.now();

  // Retornar cache se ainda válido
  if (cachedCategories && cacheTimestamp && now - cacheTimestamp < CACHE_TTL) {
    return cachedCategories;
  }

  try {
    // Buscar categorias de despesas ativas
    const { data, error } = await categoriesService.getExpenseCategories();

    if (error || !data) {
      // eslint-disable-next-line no-console
      console.warn('[AutoCategorization] Erro ao buscar categorias:', error);
      return [];
    }

    // Atualizar cache
    cachedCategories = data;
    cacheTimestamp = now;

    return data;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[AutoCategorization] Erro ao buscar categorias:', err);
    return [];
  }
}

/**
 * Normaliza texto removendo acentos, pontuação e convertendo para lowercase
 * @param {string} text - Texto para normalizar
 * @returns {string} - Texto normalizado
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, ' ') // Remove pontuação
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
}

/**
 * Extrai palavras-chave relevantes da descrição
 * @param {string} description - Descrição da transação
 * @returns {Array<string>} - Array de palavras-chave
 */
function extractKeywords(description) {
  const normalized = normalizeText(description);

  // Palavras muito comuns que devem ser ignoradas
  const stopWords = new Set([
    'de',
    'da',
    'do',
    'para',
    'em',
    'com',
    'por',
    'a',
    'o',
    'e',
    'ou',
    'no',
    'na',
    'ao',
    'dos',
    'das',
    'um',
    'uma',
  ]);

  return normalized
    .split(' ')
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Calcula score de similaridade entre descrição e nome da categoria
 * @param {string} description - Descrição da transação
 * @param {string} categoryName - Nome da categoria
 * @returns {number} - Score de 0 a 100
 */
function calculateSimilarityScore(description, categoryName) {
  const descKeywords = extractKeywords(description);
  const catKeywords = extractKeywords(categoryName);

  if (descKeywords.length === 0 || catKeywords.length === 0) {
    return 0;
  }

  let matches = 0;

  // Verificar correspondência exata de palavras
  for (const descWord of descKeywords) {
    for (const catWord of catKeywords) {
      if (descWord === catWord) {
        matches += 10; // Match exato vale mais
      } else if (descWord.includes(catWord) || catWord.includes(descWord)) {
        matches += 5; // Match parcial vale menos
      }
    }
  }

  // Normalizar score para 0-100
  const maxPossible = Math.max(descKeywords.length, catKeywords.length) * 10;
  return Math.min(100, Math.round((matches / maxPossible) * 100));
}

/**
 * Auto-categoriza uma transação baseada na descrição
 * Usa as categorias cadastradas no sistema
 *
 * @param {string} description - Descrição da transação
 * @param {string} type - Tipo da transação ('Credit' ou 'Debit')
 * @returns {Promise<string>} - Nome da categoria sugerida
 */
export async function autoCategorizeBankStatement(description, type = 'Debit') {
  if (!description || typeof description !== 'string') {
    // eslint-disable-next-line no-console
    console.warn('[AutoCategorization] Descrição inválida:', description);
    return DEFAULT_CATEGORY;
  }

  try {
    // eslint-disable-next-line no-console
    console.log('[AutoCategorization] 🔍 Processando:', {
      description: description.substring(0, 60),
      type,
    });

    // Buscar categorias do sistema
    const categories = await fetchCategories();

    if (!categories || categories.length === 0) {
      // eslint-disable-next-line no-console
      console.warn(
        '[AutoCategorization] ⚠️ Nenhuma categoria de DESPESA encontrada no sistema!'
      );
      return DEFAULT_CATEGORY;
    }

    // eslint-disable-next-line no-console
    console.log(
      `[AutoCategorization] 📋 ${categories.length} categorias de DESPESA carregadas:`,
      categories.map(c => c.name).slice(0, 5)
    );

    // Calcular score de similaridade para cada categoria
    const scores = categories.map(category => ({
      category,
      score: calculateSimilarityScore(description, category.name),
    }));

    // Ordenar por score (maior primeiro)
    scores.sort((a, b) => b.score - a.score);

    // Se o melhor score for acima de 30, usar essa categoria
    if (scores[0].score >= 30) {
      // eslint-disable-next-line no-console
      console.log(`[AutoCategorization] ✅ Match encontrado:`, {
        description: description.substring(0, 50),
        category: scores[0].category.name,
        score: scores[0].score,
        top3: scores
          .slice(0, 3)
          .map(s => ({ name: s.category.name, score: s.score })),
      });
      return scores[0].category.name;
    }

    // Nenhum match bom encontrado
    // eslint-disable-next-line no-console
    console.log(`[AutoCategorization] ⚠️ Nenhum match bom:`, {
      description: description.substring(0, 50),
      bestScore: scores[0]?.score || 0,
      bestCategory: scores[0]?.category?.name || 'N/A',
    });
    return DEFAULT_CATEGORY;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[AutoCategorization] Erro:', err);
    return DEFAULT_CATEGORY;
  }
}

/**
 * Auto-categoriza múltiplas transações em batch
 *
 * @param {Array} transactions - Array de transações
 * @returns {Promise<Array>} - Array de transações com categoria sugerida
 */
export async function autoCategorizeBatch(transactions) {
  const results = [];

  for (const transaction of transactions) {
    const suggestedCategory = await autoCategorizeBankStatement(
      transaction.description || transaction.descricao,
      transaction.type || transaction.tipo
    );

    results.push({
      ...transaction,
      suggestedCategory,
    });
  }

  return results;
}

/**
 * Obter estatísticas de categorização
 *
 * @param {Array} transactions - Array de transações categorizadas
 * @returns {Object} - Estatísticas de categorização
 */
export function getCategorizationStats(transactions) {
  const stats = {
    total: transactions.length,
    categorized: 0,
    uncategorized: 0,
    byCategory: {},
  };

  transactions.forEach(t => {
    const category = t.suggestedCategory || DEFAULT_CATEGORY;

    if (category === DEFAULT_CATEGORY) {
      stats.uncategorized++;
    } else {
      stats.categorized++;
    }

    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
  });

  return stats;
}

/**
 * Limpa o cache de categorias
 * Útil quando categorias são atualizadas
 */
export function clearCategoriesCache() {
  cachedCategories = null;
  cacheTimestamp = null;
}

export default {
  autoCategorizeBankStatement,
  autoCategorizeBatch,
  getCategorizationStats,
  clearCategoriesCache,
  DEFAULT_CATEGORY,
};
