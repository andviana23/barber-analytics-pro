import { professionalRepository } from '../repositories/professionalRepository';
import {
  ProfessionalFiltersDTO,
  ProfessionalSearchDTO,
  ProfessionalStatsParamsDTO,
  ProfessionalPeriodDTO,
  isValidUuid,
} from '../dtos/professionalDTO';

const buildError = message => ({ message });

const toNumber = value => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const aggregateRevenueMetrics = revenues => {
  const base = {
    totalRevenue: 0,
    receivedRevenue: 0,
    pendingRevenue: 0,
    serviceRevenue: 0,
    productRevenue: 0,
    transactionCount: revenues.length,
  };

  revenues.forEach(revenue => {
    const value = toNumber(revenue.value);
    base.totalRevenue += value;

    const status = String(revenue.status || '').toLowerCase();
    if (status === 'received') {
      base.receivedRevenue += value;
    }
    if (status === 'pending') {
      base.pendingRevenue += value;
    }

    const type = String(revenue.type || '').toLowerCase();
    if (type === 'service') {
      base.serviceRevenue += value;
    }
    if (type === 'product') {
      base.productRevenue += value;
    }
  });

  const averageTicket =
    base.transactionCount > 0 ? base.totalRevenue / base.transactionCount : 0;

  return {
    totalRevenue: base.totalRevenue,
    receivedRevenue: base.receivedRevenue,
    pendingRevenue: base.pendingRevenue,
    serviceRevenue: base.serviceRevenue,
    productRevenue: base.productRevenue,
    transactionCount: base.transactionCount,
    averageTicket,
  };
};

class ProfessionalService {
  async listProfessionals(filters = {}) {
    try {
      const filtersDTO = new ProfessionalFiltersDTO(filters);

      if (!filtersDTO.isValid()) {
        return {
          data: null,
          error: buildError(filtersDTO.getErrorMessage()),
        };
      }

      const { data, error } = await professionalRepository.findByFilters(
        filtersDTO.toRepositoryFilters()
      );

      if (error) {
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: buildError(`Falha ao carregar profissionais: ${error.message}`),
      };
    }
  }

  async getProfessionalById(professionalId) {
    if (!isValidUuid(professionalId)) {
      return { data: null, error: buildError('ID do profissional inválido') };
    }

    try {
      const { data, error } =
        await professionalRepository.findById(professionalId);

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: buildError(`Profissional não encontrado: ${error.message}`),
      };
    }
  }

  async getProfessionalsByUnit(unitId, activeOnly = true) {
    return this.listProfessionals({ unitId, activeOnly });
  }

  async searchProfessionals(searchTerm, unitId = null) {
    if (!searchTerm || String(searchTerm).trim().length === 0) {
      return this.listProfessionals({ unitId, activeOnly: true });
    }

    try {
      const searchDTO = new ProfessionalSearchDTO({
        search: searchTerm,
        unitId,
      });

      if (!searchDTO.isValid()) {
        return {
          data: null,
          error: buildError(searchDTO.getErrorMessage()),
        };
      }

      const { data, error } = await professionalRepository.search(
        searchDTO.toRepositoryParams()
      );

      if (error) {
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: buildError(`Falha na busca: ${error.message}`),
      };
    }
  }

  async getProfessionalStats(professionalId, startDate, endDate) {
    const statsDTO = new ProfessionalStatsParamsDTO({
      professionalId,
      startDate,
      endDate,
    });

    if (!statsDTO.isValid()) {
      return {
        data: null,
        error: buildError(statsDTO.getErrorMessage()),
      };
    }

    const params = statsDTO.toParams();

    try {
      const { data: revenues, error } =
        await professionalRepository.getRevenuesForProfessional(params);

      if (error) {
        return { data: null, error };
      }

      const metrics = aggregateRevenueMetrics(revenues || []);

      return {
        data: {
          professionalId: params.professionalId,
          period: {
            startDate: params.startDate,
            endDate: params.endDate,
          },
          ...metrics,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: buildError(`Falha ao calcular estatísticas: ${error.message}`),
      };
    }
  }

  async getProfessionalsWithStats(unitId, startDate, endDate) {
    const periodDTO = new ProfessionalPeriodDTO({ startDate, endDate });

    if (!periodDTO.isValid()) {
      return {
        data: null,
        error: buildError(periodDTO.getErrorMessage()),
      };
    }

    const period = periodDTO.toParams();
    const filtersDTO = new ProfessionalFiltersDTO({
      unitId,
      activeOnly: true,
    });

    if (!filtersDTO.isValid()) {
      return {
        data: null,
        error: buildError(filtersDTO.getErrorMessage()),
      };
    }

    try {
      const { data: professionals, error } =
        await professionalRepository.findByFilters(
          filtersDTO.toRepositoryFilters()
        );

      if (error) {
        return { data: null, error };
      }

      const professionalsWithStats = await Promise.all(
        (professionals || []).map(async professional => {
          const { data: revenues, error: revenuesError } =
            await professionalRepository.getRevenuesForProfessional({
              professionalId: professional.id,
              ...period,
            });

          if (revenuesError) {
            throw revenuesError;
          }

          const metrics = aggregateRevenueMetrics(revenues || []);

          return {
            ...professional,
            stats: {
              professionalId: professional.id,
              period,
              ...metrics,
            },
          };
        })
      );

      professionalsWithStats.sort(
        (a, b) => (b.stats?.totalRevenue || 0) - (a.stats?.totalRevenue || 0)
      );

      return { data: professionalsWithStats, error: null };
    } catch (error) {
      return {
        data: null,
        error: error?.message
          ? error
          : buildError(`Falha ao carregar dados: ${error}`),
      };
    }
  }

  async getProfessionalsRanking(unitId = null, startDate, endDate, limit = 10) {
    const periodDTO = new ProfessionalPeriodDTO({ startDate, endDate });

    if (!periodDTO.isValid()) {
      return {
        data: null,
        error: buildError(periodDTO.getErrorMessage()),
      };
    }

    const safeLimit = (() => {
      const parsed = Number(limit);
      if (!Number.isFinite(parsed) || parsed <= 0) return 10;
      return Math.min(Math.floor(parsed), 50);
    })();

    const { data, error } = await this.getProfessionalsWithStats(
      unitId,
      periodDTO.startDate,
      periodDTO.endDate
    );

    if (error) {
      return { data: null, error };
    }

    const professionalsWithStats = data || [];

    const ranking = professionalsWithStats
      .slice(0, safeLimit)
      .map((prof, index) => ({
        ...prof,
        ranking: {
          position: index + 1,
          percentageOfTotal: 0,
        },
      }));

    return { data: ranking, error: null };
  }

  async getProfessionalsCountByUnit() {
    const { data, error } = await professionalRepository.countActiveByUnit();

    if (error) {
      return { data: null, error };
    }

    const grouped = (data || []).reduce((acc, prof) => {
      const unitId = prof.unit_id;
      const unitName = prof.units?.name || 'Sem unidade';

      if (!acc[unitId]) {
        acc[unitId] = {
          unitId,
          unitName,
          count: 0,
        };
      }

      acc[unitId].count += 1;
      return acc;
    }, {});

    const result = Object.values(grouped).sort((a, b) => b.count - a.count);

    return { data: result, error: null };
  }
}

const professionalService = new ProfessionalService();

export default professionalService;
