/**
 * UNITS SERVICE
 * Serviço responsável por orquestrar regras de negócio das unidades usando DTOs e repositories
 */

import { supabase } from './supabase';
import { unitsRepository } from '../repositories/unitsRepository';
import { professionalRepository } from '../repositories/professionalRepository';
import {
  UnitFiltersDTO,
  UnitIdentifierDTO,
  CreateUnitDTO,
  UpdateUnitDTO,
  UnitStatsParamsDTO,
  UnitsPeriodDTO,
  UnitsRankingParamsDTO,
  UnitEvolutionParamsDTO,
  UnitResponseDTO,
  isValidUuid,
} from '../dtos/unitsDTO';

const buildError = message => ({ message });

const toNumber = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toUnitResponse = record =>
  record ? new UnitResponseDTO(record).toObject() : null;

const aggregateRevenueMetrics = (revenues = []) => {
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
    ...base,
    averageTicket,
  };
};

const aggregateExpenseTotal = (expenses = []) =>
  expenses.reduce((sum, expense) => sum + toNumber(expense.value), 0);

const aggregateAttendanceMetrics = (attendances = []) => {
  if (!Array.isArray(attendances) || attendances.length === 0) {
    return {
      count: 0,
      revenue: 0,
      averageTicket: 0,
      averageDuration: 0,
    };
  }

  const totals = attendances.reduce(
    (acc, attendance) => {
      acc.count += 1;
      acc.revenue += toNumber(attendance.valor_servico);
      acc.duration += toNumber(attendance.duracao_minutos);
      return acc;
    },
    { count: 0, revenue: 0, duration: 0 }
  );

  return {
    count: totals.count,
    revenue: totals.revenue,
    averageTicket: totals.count > 0 ? totals.revenue / totals.count : 0,
    averageDuration: totals.count > 0 ? totals.duration / totals.count : 0,
  };
};

const calculatePerformanceMetrics = (
  totalRevenue,
  attendancesCount,
  professionalsCount
) => {
  if (!professionalsCount || professionalsCount <= 0) {
    return {
      revenuePerProfessional: 0,
      attendancesPerProfessional: 0,
    };
  }

  return {
    revenuePerProfessional: totalRevenue / professionalsCount,
    attendancesPerProfessional: attendancesCount / professionalsCount,
  };
};

class UnitsService {
  resolveIncludeInactiveFlag(param) {
    if (typeof param === 'boolean') {
      return param;
    }

    if (
      param &&
      typeof param === 'object' &&
      param.includeInactive !== undefined
    ) {
      return Boolean(param.includeInactive);
    }

    return false;
  }

  async resolveCurrentUserId(fallbackId) {
    if (fallbackId && isValidUuid(fallbackId)) {
      return { data: fallbackId, error: null };
    }

    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        return { data: null, error };
      }

      const userId = data?.user?.id;

      if (!userId) {
        return { data: null, error: buildError('Usuário não autenticado') };
      }

      return { data: userId, error: null };
    } catch (error) {
      return { data: null, error: buildError(error.message) };
    }
  }

  async getUnits(params = {}) {
    const includeInactive = this.resolveIncludeInactiveFlag(params);
    const filtersDTO = new UnitFiltersDTO({ includeInactive });

    if (!filtersDTO.isValid()) {
      return {
        data: null,
        error: buildError(filtersDTO.getErrorMessage()),
      };
    }

    try {
      const { data, error } = await unitsRepository.findAll(
        filtersDTO.toRepositoryFilters()
      );

      if (error) {
        return { data: null, error };
      }

      const units = (data || []).map(toUnitResponse);

      return { data: units, error: null };
    } catch (error) {
      return {
        data: null,
        error: buildError(`Falha ao carregar unidades: ${error.message}`),
      };
    }
  }

  async getUnitById(unitId) {
    const idDTO = new UnitIdentifierDTO(unitId);

    if (!idDTO.isValid()) {
      return { data: null, error: buildError(idDTO.getErrorMessage()) };
    }

    try {
      const { data, error } = await unitsRepository.findById(idDTO.value());

      if (error) {
        return { data: null, error };
      }

      if (!data) {
        return {
          data: null,
          error: buildError('Unidade não encontrada'),
        };
      }

      return { data: toUnitResponse(data), error: null };
    } catch (error) {
      return {
        data: null,
        error: buildError(`Unidade não encontrada: ${error.message}`),
      };
    }
  }

  async createUnit(unitData = {}) {
    const createDTO = new CreateUnitDTO(unitData);

    if (!createDTO.isValid()) {
      return {
        data: null,
        error: buildError(createDTO.getErrorMessage()),
      };
    }

    const payload = createDTO.toDatabase();

    if (!payload.user_id) {
      const { data: userId, error: userError } =
        await this.resolveCurrentUserId();

      if (userError) {
        return { data: null, error: userError };
      }

      payload.user_id = userId;
    }

    try {
      const { data, error } = await unitsRepository.create(payload);

      if (error) {
        return { data: null, error };
      }

      return { data: toUnitResponse(data), error: null };
    } catch (error) {
      return {
        data: null,
        error: buildError(`Falha ao criar unidade: ${error.message}`),
      };
    }
  }

  async updateUnit(unitId, updates = {}) {
    const idDTO = new UnitIdentifierDTO(unitId);

    if (!idDTO.isValid()) {
      return { data: null, error: buildError(idDTO.getErrorMessage()) };
    }

    const updateDTO = new UpdateUnitDTO(updates);

    if (!updateDTO.isValid()) {
      return {
        data: null,
        error: buildError(updateDTO.getErrorMessage()),
      };
    }

    const payload = updateDTO.toDatabase();

    try {
      const { data, error } = await unitsRepository.update(
        idDTO.value(),
        payload
      );

      if (error) {
        return { data: null, error };
      }

      return { data: toUnitResponse(data), error: null };
    } catch (error) {
      return {
        data: null,
        error: buildError(`Falha ao atualizar unidade: ${error.message}`),
      };
    }
  }

  async toggleUnitStatus(unitId) {
    const currentUnit = await this.getUnitById(unitId);

    if (currentUnit.error) {
      return currentUnit;
    }

    const nextStatus = !currentUnit.data.is_active;

    return this.updateUnit(unitId, { is_active: nextStatus });
  }

  async deleteUnit(unitId) {
    const dependenciesResult = await this.checkUnitDependencies(unitId);

    if (dependenciesResult.error) {
      return dependenciesResult;
    }

    const { hasDependencies, dependencies, unitName } = dependenciesResult.data;

    if (hasDependencies) {
      return {
        data: null,
        error: buildError(
          `Unidade possui dados vinculados: ${dependencies.join(', ')}`
        ),
      };
    }

    const updateResult = await this.updateUnit(unitId, {
      is_active: false,
      name: `[EXCLUÍDA] ${unitName}`,
    });

    if (updateResult.error) {
      return updateResult;
    }

    return { data: true, error: null };
  }

  async checkUnitDependencies(unitId) {
    const idDTO = new UnitIdentifierDTO(unitId);

    if (!idDTO.isValid()) {
      return { data: null, error: buildError(idDTO.getErrorMessage()) };
    }

    try {
      const [unitResult, professionalsResult, revenuesResult, expensesResult] =
        await Promise.all([
          unitsRepository.findById(idDTO.value()),
          professionalRepository.findByFilters({
            unitId: idDTO.value(),
            isActive: true,
            includeUnits: false,
          }),
          unitsRepository.hasRevenues(idDTO.value()),
          unitsRepository.hasActiveExpenses(idDTO.value()),
        ]);

      const dependencies = [];

      if (professionalsResult.error) {
        return { data: null, error: professionalsResult.error };
      }

      if ((professionalsResult.data || []).length > 0) {
        dependencies.push(
          `${(professionalsResult.data || []).length} profissionais ativos`
        );
      }

      if (revenuesResult.error) {
        return { data: null, error: revenuesResult.error };
      }

      if (revenuesResult.data) {
        dependencies.push('registros financeiros');
      }

      if (expensesResult.error) {
        return { data: null, error: expensesResult.error };
      }

      if (expensesResult.data) {
        dependencies.push('registros de despesas');
      }

      const unitName = unitResult?.data?.name || 'Unidade';

      return {
        data: {
          hasDependencies: dependencies.length > 0,
          dependencies,
          unitName,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: {
          hasDependencies: false,
          dependencies: [],
          unitName: 'Unidade',
        },
        error: buildError(`Falha ao verificar dependências: ${error.message}`),
      };
    }
  }

  async getUnitStats(unitId, month = null, year = null) {
    const statsDTO = new UnitStatsParamsDTO({ unitId, month, year });

    if (!statsDTO.isValid()) {
      return {
        data: null,
        error: buildError(statsDTO.getErrorMessage()),
      };
    }

    const params = statsDTO.toRepositoryParams();

    try {
      const [
        unitResult,
        professionalsResult,
        revenuesResult,
        expensesResult,
        attendancesResult,
      ] = await Promise.all([
        unitsRepository.findById(params.unitId),
        professionalRepository.findByFilters({
          unitId: params.unitId,
          isActive: true,
          includeUnits: false,
        }),
        unitsRepository.listRevenuesByPeriod(params),
        unitsRepository.listExpensesByPeriod(params),
        unitsRepository.listAttendancesByPeriod(params),
      ]);

      if (unitResult.error) {
        return { data: null, error: unitResult.error };
      }

      if (professionalsResult.error) {
        return { data: null, error: professionalsResult.error };
      }

      if (revenuesResult.error) {
        return { data: null, error: revenuesResult.error };
      }

      if (expensesResult.error) {
        return { data: null, error: expensesResult.error };
      }

      if (attendancesResult.error) {
        return { data: null, error: attendancesResult.error };
      }

      const professionalsList = (professionalsResult.data || []).map(
        professional => ({
          id: professional.id,
          name: professional.name,
          role: professional.role,
        })
      );

      const professionalsCount = professionalsList.length;

      const revenueMetrics = aggregateRevenueMetrics(revenuesResult.data || []);

      const monthlyExpenses = aggregateExpenseTotal(expensesResult.data || []);
      const profit = revenueMetrics.totalRevenue - monthlyExpenses;
      const profitMargin =
        revenueMetrics.totalRevenue > 0
          ? (profit / revenueMetrics.totalRevenue) * 100
          : 0;

      const attendanceMetrics = aggregateAttendanceMetrics(
        attendancesResult.data || []
      );

      const performanceMetrics = calculatePerformanceMetrics(
        revenueMetrics.totalRevenue,
        attendanceMetrics.count,
        professionalsCount
      );

      return {
        data: {
          unit: toUnitResponse(unitResult.data),
          unitId: params.unitId,
          month: params.month,
          year: params.year,
          professionals: {
            total: professionalsCount,
            list: professionalsList,
          },
          financial: {
            monthlyRevenue: revenueMetrics.totalRevenue,
            receivedRevenue: revenueMetrics.receivedRevenue,
            pendingRevenue: revenueMetrics.pendingRevenue,
            serviceRevenue: revenueMetrics.serviceRevenue,
            productRevenue: revenueMetrics.productRevenue,
            transactionCount: revenueMetrics.transactionCount,
            averageTicket: revenueMetrics.averageTicket,
            monthlyExpenses,
            profit,
            profitMargin,
          },
          attendances: attendanceMetrics,
          performance: performanceMetrics,
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

  async getUnitsComparison(month = null, year = null) {
    const periodDTO = new UnitsPeriodDTO({ month, year });

    if (!periodDTO.isValid()) {
      return {
        data: null,
        error: buildError(periodDTO.getErrorMessage()),
      };
    }

    const { month: targetMonth, year: targetYear } = periodDTO;

    const unitsResult = await this.getUnits({ includeInactive: false });

    if (unitsResult.error) {
      return unitsResult;
    }

    try {
      const statsResults = await Promise.all(
        (unitsResult.data || []).map(unit =>
          this.getUnitStats(unit.id, targetMonth, targetYear)
        )
      );

      for (const result of statsResults) {
        if (result.error) {
          return result;
        }
      }

      const comparison = statsResults.map(result => ({
        ...result.data.unit,
        stats: result.data,
      }));

      comparison.sort(
        (a, b) =>
          (b.stats?.financial?.monthlyRevenue || 0) -
          (a.stats?.financial?.monthlyRevenue || 0)
      );

      return { data: comparison, error: null };
    } catch (error) {
      return {
        data: null,
        error: buildError(`Falha ao gerar comparativo: ${error.message}`),
      };
    }
  }

  async getUnitsRanking(metric = 'revenue', month = null, year = null) {
    const rankingDTO = new UnitsRankingParamsDTO({ metric, month, year });

    if (!rankingDTO.isValid()) {
      return {
        data: null,
        error: buildError(rankingDTO.getErrorMessage()),
      };
    }

    const { month: targetMonth, year: targetYear } = rankingDTO;

    const comparisonResult = await this.getUnitsComparison(
      targetMonth,
      targetYear
    );

    if (comparisonResult.error) {
      return comparisonResult;
    }

    const units = comparisonResult.data || [];

    const sortedUnits = [...units].sort((a, b) => {
      const valueA = this.getRankingValue(a.stats, rankingDTO.metric);
      const valueB = this.getRankingValue(b.stats, rankingDTO.metric);
      return valueB - valueA;
    });

    const ranking = sortedUnits.map((unit, index) => ({
      ...unit,
      ranking: {
        position: index + 1,
        metric: rankingDTO.metric,
        value: this.getRankingValue(unit.stats, rankingDTO.metric),
      },
    }));

    return { data: ranking, error: null };
  }

  getRankingValue(stats, metric) {
    if (!stats) return 0;

    switch (metric) {
      case 'profit':
        return stats.financial?.profit || 0;
      case 'attendances':
        return stats.attendances?.count || 0;
      case 'efficiency':
        return stats.performance?.revenuePerProfessional || 0;
      case 'revenue':
      default:
        return stats.financial?.monthlyRevenue || 0;
    }
  }

  async getUnitEvolution(unitId) {
    const idDTO = new UnitEvolutionParamsDTO(unitId);

    if (!idDTO.isValid()) {
      return {
        data: null,
        error: buildError(idDTO.getErrorMessage()),
      };
    }

    try {
      const evolution = [];
      const currentDate = new Date();

      for (let i = 5; i >= 0; i -= 1) {
        const date = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );

        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        const statsResult = await this.getUnitStats(idDTO.value(), month, year);

        if (statsResult.error) {
          return statsResult;
        }

        evolution.push({
          month: `${String(month).padStart(2, '0')}/${year}`,
          monthNumber: month,
          year,
          stats: statsResult.data,
        });
      }

      return { data: evolution, error: null };
    } catch (error) {
      return {
        data: null,
        error: buildError(`Falha ao buscar evolução: ${error.message}`),
      };
    }
  }
}

const unitsService = new UnitsService();

export default unitsService;
