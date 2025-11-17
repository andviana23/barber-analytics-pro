/**
 * Products API Client
 * Barber Analytics Pro - v2.0.0
 *
 * @description Client wrapper para API de produtos (frontend)
 * @author Andrey Viana
 * @created 2025-11-13
 * @architecture Frontend → API Express (port 3001) → Service → Repository
 */

import { supabase } from './supabase';

const API_URL = 'http://localhost:3001/api/products';

/**
 * Obter token de autenticação do Supabase
 * @returns {Promise<string|null>}
 */
async function getAuthToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Criar headers com autenticação
 * @returns {Promise<Object>}
 */
async function getHeaders() {
  const token = await getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

/**
 * Buscar lista de produtos com filtros
 * @param {Object} filters - Filtros de busca
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getProducts(filters = {}) {
  try {
    const params = new URLSearchParams();

    if (filters.unit_id) params.append('unit_id', filters.unit_id);
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.brand) params.append('brand', filters.brand);
    if (filters.is_active !== undefined)
      params.append('is_active', filters.is_active);
    if (filters.page) params.append('page', filters.page);
    if (filters.page_size) params.append('page_size', filters.page_size);
    if (filters.stock_status)
      params.append('stock_status', filters.stock_status);

    const headers = await getHeaders();
    const response = await fetch(`${API_URL}?${params.toString()}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      return { data: null, error: result.error || 'Erro ao buscar produtos' };
    }

    return { data: result.data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Buscar produto por ID
 * @param {string} id - ID do produto
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getProductById(id) {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      return { data: null, error: result.error || 'Erro ao buscar produto' };
    }

    return { data: result.data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Criar novo produto
 * @param {Object} productData - Dados do produto
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function createProduct(productData) {
  try {
    const headers = await getHeaders();
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(productData),
    });

    const result = await response.json();

    if (!response.ok) {
      return { data: null, error: result.error || 'Erro ao criar produto' };
    }

    return { data: result.data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Atualizar produto
 * @param {string} id - ID do produto
 * @param {Object} updates - Campos a atualizar
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updateProduct(id, updates) {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    const result = await response.json();

    if (!response.ok) {
      return { data: null, error: result.error || 'Erro ao atualizar produto' };
    }

    return { data: result.data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Deletar produto (soft delete)
 * @param {string} id - ID do produto
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function deleteProduct(id) {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      return { data: null, error: result.error || 'Erro ao deletar produto' };
    }

    return { data: result.data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Buscar estatísticas de produtos
 * @param {string} unitId - ID da unidade
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getProductStatistics(unitId) {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/stats?unit_id=${unitId}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: result.error || 'Erro ao buscar estatísticas',
      };
    }

    return { data: result.data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Ajustar estoque manualmente
 * @param {string} id - ID do produto
 * @param {number} quantity - Quantidade
 * @param {string} operation - Operação: 'SET', 'ADD', 'SUBTRACT'
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function adjustStock(id, quantity, operation = 'SET') {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/${id}/stock`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify({ quantity, operation }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { data: null, error: result.error || 'Erro ao ajustar estoque' };
    }

    return { data: result.data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Produtos com estoque baixo
 * @param {string} unitId - ID da unidade
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getLowStockProducts(unitId) {
  try {
    const headers = await getHeaders();
    const response = await fetch(
      `${API_URL}?unit_id=${unitId}&stock_status=low`,
      {
        method: 'GET',
        headers,
        credentials: 'include',
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: result.error || 'Erro ao buscar produtos com estoque baixo',
      };
    }

    return { data: result.data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Produtos sem estoque
 * @param {string} unitId - ID da unidade
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getOutOfStockProducts(unitId) {
  try {
    const headers = await getHeaders();
    const response = await fetch(
      `${API_URL}?unit_id=${unitId}&stock_status=out`,
      {
        method: 'GET',
        headers,
        credentials: 'include',
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: result.error || 'Erro ao buscar produtos sem estoque',
      };
    }

    return { data: result.data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Restaurar produto deletado
 * @param {string} id - ID do produto
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function restoreProduct(id) {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/${id}/restore`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      return { data: null, error: result.error || 'Erro ao restaurar produto' };
    }

    return { data: result.data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}
