/**
 * Exemplo de teste unitário com Vitest
 * Testa funções utilitárias e helpers
 */

import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from '@/utils/formatters';

describe('Utils - Formatters', () => {
  describe('formatCurrency', () => {
    it('deve formatar valor positivo corretamente', () => {
      const result = formatCurrency(1234.56);
      // Intl.NumberFormat pode usar espaço não-quebrável (NBSP)
      expect(result).toMatch(/R\$\s*1\.234,56/);
    });

    it('deve formatar valor negativo corretamente', () => {
      const result = formatCurrency(-999.99);
      expect(result).toMatch(/-R\$\s*999,99/);
    });

    it('deve formatar zero corretamente', () => {
      const result = formatCurrency(0);
      expect(result).toMatch(/R\$\s*0,00/);
    });

    it('deve lidar com valores undefined/null', () => {
      expect(formatCurrency(undefined)).toMatch(/R\$\s*0,00/);
      expect(formatCurrency(null)).toMatch(/R\$\s*0,00/);
    });
  });

  describe('formatDate', () => {
    it('deve formatar data ISO para formato brasileiro', () => {
      const result = formatDate('2025-11-07');
      expect(result).toBe('07/11/2025');
    });

    it('deve lidar com formato de data inválido', () => {
      const result = formatDate('invalid-date');
      // formatDate retorna '-' em caso de erro
      expect(result).toBe('-');
    });
  });
});
