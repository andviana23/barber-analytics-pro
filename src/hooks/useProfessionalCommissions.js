import { useState, useCallback } from 'react';
import {
  getProfessionalCommissions,
  updateProfessionalCommission,
} from '../services/professionalCommissionService';

/**
 * Hook para buscar e editar comissões do profissional por serviço
 * @param {string} professionalId
 * @param {string} unitId
 */
export function useProfessionalCommissions(professionalId, unitId) {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCommissions = useCallback(async () => {
    // Validação: não tentar buscar sem professionalId ou unitId
    if (!professionalId || !unitId) {
      setError('Profissional ou unidade não informados');
      setCommissions([]);
      return;
    }

    setLoading(true);
    const { data, error } = await getProfessionalCommissions(
      professionalId,
      unitId
    );
    setCommissions(data || []);
    setError(error);
    setLoading(false);
  }, [professionalId, unitId]);

  const saveCommission = useCallback(
    async (serviceId, commission) => {
      setLoading(true);
      const { error } = await updateProfessionalCommission({
        professionalId,
        unitId,
        serviceId,
        commission,
      });
      if (!error) await fetchCommissions();
      setLoading(false);
      setError(error);
    },
    [professionalId, unitId, fetchCommissions]
  );

  return { commissions, loading, error, fetchCommissions, saveCommission };
}
