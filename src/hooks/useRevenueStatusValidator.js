import { useEffect, useCallback } from 'react';
import financeiroService from '../services/financeiroService';

/**
 * Hook para validar e corrigir automaticamente o status de receitas
 *
 * Regra:
 * - Se expected_receipt_date <= data de hoje → status = 'Received'
 * - Se expected_receipt_date > data de hoje → status = 'Pending'
 *
 * Este hook é executado automaticamente quando a lista de receitas é carregada
 */
export const useRevenueStatusValidator = (receitas, onUpdate) => {
  const validateAndFixStatus = useCallback(async () => {
    if (!receitas || receitas.length === 0) return;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const receitasParaCorrigir = [];

    receitas.forEach(receita => {
      if (!receita.expected_receipt_date) return;

      const prevReceb = new Date(receita.expected_receipt_date + 'T00:00:00');
      const statusCorreto = prevReceb <= hoje ? 'Received' : 'Pending';

      if (receita.status !== statusCorreto) {
        receitasParaCorrigir.push({
          id: receita.id,
          statusAtual: receita.status,
          statusCorreto,
          expected_receipt_date: receita.expected_receipt_date,
        });
      }
    });

    if (receitasParaCorrigir.length > 0) {
      console.log(
        `⚠️ ${receitasParaCorrigir.length} receitas com status incorreto detectadas. Corrigindo...`
      );

      // Corrigir cada receita
      for (const receita of receitasParaCorrigir) {
        try {
          await financeiroService.updateReceita(receita.id, {
            status: receita.statusCorreto,
            ...(receita.statusCorreto === 'Received' && {
              actual_receipt_date: receita.expected_receipt_date,
            }),
          });
        } catch (error) {
          console.error(`❌ Erro ao corrigir receita ${receita.id}:`, error);
        }
      }

      console.log('✅ Status das receitas corrigidos com sucesso!');

      // Notificar componente pai para atualizar a lista
      if (onUpdate) {
        onUpdate();
      }
    }
  }, [receitas, onUpdate]);

  // Validar status ao montar e quando a lista mudar
  useEffect(() => {
    validateAndFixStatus();
  }, [validateAndFixStatus]);

  return { validateAndFixStatus };
};
