/**
 * RELATÓRIOS DTOs
 *
 * Data Transfer Objects para validação e transformação de dados de relatórios.
 * Segue os padrões Clean Architecture - DTO Pattern.
 */

/**
 * Utilitários de validação
 */
const isValidDate = date => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

const isValidMonth = month => {
  const num = Number(month);
  return Number.isInteger(num) && num >= 1 && num <= 12;
};

const isValidYear = year => {
  const num = Number(year);
  const currentYear = new Date().getFullYear();
  return Number.isInteger(num) && num >= 2020 && num <= currentYear + 1;
};

const isValidUuid = uuid => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof uuid === 'string' && uuidRegex.test(uuid);
};

/**
 * Base DTO para funcionalidades comuns
 */
class BaseDTO {
  constructor() {
    this.errors = [];
    this.isValidated = false;
  }

  isValid() {
    if (!this.isValidated) {
      this.validate();
      this.isValidated = true;
    }
    return this.errors.length === 0;
  }

  getErrors() {
    if (!this.isValidated) {
      this.validate();
      this.isValidated = true;
    }
    return this.errors;
  }

  getErrorMessage() {
    const errors = this.getErrors();
    return errors.length > 0 ? errors.join(', ') : null;
  }

  addError(message) {
    this.errors.push(message);
  }

  validate() {
    // Implementado pelas classes filhas
  }
}

/**
 * DTO para filtros de período
 */
export class PeriodFiltersDTO extends BaseDTO {
  constructor(data = {}) {
    super();
    this.month = data.month;
    this.year = data.year;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.period = data.period || 'mes-atual';
  }

  validate() {
    this.errors = [];

    // Validar período personalizado
    if (this.period === 'personalizado') {
      if (!this.startDate) {
        this.addError(
          'Data de início é obrigatória para período personalizado'
        );
      } else if (!isValidDate(this.startDate)) {
        this.addError('Data de início inválida');
      }

      if (!this.endDate) {
        this.addError('Data de fim é obrigatória para período personalizado');
      } else if (!isValidDate(this.endDate)) {
        this.addError('Data de fim inválida');
      }

      if (
        this.startDate &&
        this.endDate &&
        isValidDate(this.startDate) &&
        isValidDate(this.endDate)
      ) {
        if (new Date(this.startDate) > new Date(this.endDate)) {
          this.addError('Data de início deve ser anterior à data de fim');
        }
      }
    } else {
      // Validar mês e ano para outros períodos
      if (this.month !== undefined && this.month !== null) {
        if (!isValidMonth(this.month)) {
          this.addError('Mês deve estar entre 1 e 12');
        }
      }

      if (this.year !== undefined && this.year !== null) {
        if (!isValidYear(this.year)) {
          this.addError('Ano inválido');
        }
      }
    }
  }

  toRepositoryParams() {
    if (this.period === 'personalizado') {
      return {
        startDate: this.startDate,
        endDate: this.endDate,
        period: this.period,
      };
    }

    const now = new Date();
    let targetMonth, targetYear;

    switch (this.period) {
      case 'mes-anterior':
        targetMonth = now.getMonth(); // getMonth() retorna 0-11
        targetYear =
          targetMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();
        targetMonth = targetMonth === 0 ? 12 : targetMonth;
        break;
      case 'mes-atual':
      default:
        targetMonth = now.getMonth() + 1; // Converter para 1-12
        targetYear = now.getFullYear();
        break;
    }

    return {
      month: this.month || targetMonth,
      year: this.year || targetYear,
      period: this.period,
    };
  }

  getPeriodDisplayName() {
    const params = this.toRepositoryParams();

    if (this.period === 'personalizado') {
      return `${this.startDate} a ${this.endDate}`;
    }

    const monthNames = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    return `${monthNames[params.month - 1]} ${params.year}`;
  }
}

/**
 * DTO para filtros de unidade
 */
export class UnitFiltersDTO extends BaseDTO {
  constructor(data = {}) {
    super();
    this.unitId = data.unitId || data.unidade;
    this.includeInactive = Boolean(data.includeInactive);
    this.unitIds = data.unitIds || [];
  }

  validate() {
    this.errors = [];

    if (this.unitId && this.unitId !== 'todas' && !isValidUuid(this.unitId)) {
      this.addError('ID da unidade inválido');
    }

    if (this.unitIds && Array.isArray(this.unitIds)) {
      const invalidIds = this.unitIds.filter(id => !isValidUuid(id));
      if (invalidIds.length > 0) {
        this.addError('IDs de unidades inválidos');
      }
    }
  }

  isAllUnits() {
    return !this.unitId || this.unitId === 'todas';
  }

  getTargetUnits() {
    if (this.isAllUnits()) {
      return this.unitIds;
    }
    return [this.unitId];
  }

  toRepositoryParams() {
    return {
      unitId: this.isAllUnits() ? null : this.unitId,
      includeInactive: this.includeInactive,
      unitIds: this.getTargetUnits(),
    };
  }
}

/**
 * DTO para parâmetros de comparativo entre unidades
 */
export class UnitsComparisonFiltersDTO extends BaseDTO {
  constructor(data = {}) {
    super();
    this.period = new PeriodFiltersDTO(data);
    this.units = new UnitFiltersDTO(data);
    this.metrics = data.metrics || ['revenue', 'profit', 'attendances'];
    this.includeGrowth = Boolean(data.includeGrowth);
    this.format = data.format || 'visual';
  }

  validate() {
    this.errors = [];

    // Validar sub-DTOs
    if (!this.period.isValid()) {
      this.errors.push(...this.period.getErrors());
    }

    if (!this.units.isValid()) {
      this.errors.push(...this.units.getErrors());
    }

    // Validar métricas
    const validMetrics = [
      'revenue',
      'profit',
      'attendances',
      'professionals',
      'averageTicket',
    ];
    if (!Array.isArray(this.metrics) || this.metrics.length === 0) {
      this.addError('Pelo menos uma métrica deve ser selecionada');
    } else {
      const invalidMetrics = this.metrics.filter(
        metric => !validMetrics.includes(metric)
      );
      if (invalidMetrics.length > 0) {
        this.addError(`Métricas inválidas: ${invalidMetrics.join(', ')}`);
      }
    }

    // Validar formato
    const validFormats = ['visual', 'tabela', 'excel', 'pdf'];
    if (!validFormats.includes(this.format)) {
      this.addError('Formato de saída inválido');
    }
  }

  toRepositoryParams() {
    return {
      ...this.period.toRepositoryParams(),
      ...this.units.toRepositoryParams(),
      metrics: this.metrics,
      includeGrowth: this.includeGrowth,
      format: this.format,
    };
  }

  getDisplayTitle() {
    const periodName = this.period.getPeriodDisplayName();
    if (this.units.isAllUnits()) {
      return `Comparativo entre Unidades - ${periodName}`;
    }
    return `Relatório da Unidade - ${periodName}`;
  }
}

/**
 * DTO para parâmetros de ranking de unidades
 */
export class UnitsRankingFiltersDTO extends BaseDTO {
  constructor(data = {}) {
    super();
    this.period = new PeriodFiltersDTO(data);
    this.metric = data.metric || 'revenue';
    this.limit = data.limit || 10;
    this.order = data.order || 'desc';
  }

  validate() {
    this.errors = [];

    // Validar período
    if (!this.period.isValid()) {
      this.errors.push(...this.period.getErrors());
    }

    // Validar métrica
    const validMetrics = [
      'revenue',
      'profit',
      'attendances',
      'professionals',
      'averageTicket',
      'growth',
    ];
    if (!validMetrics.includes(this.metric)) {
      this.addError('Métrica de ranking inválida');
    }

    // Validar limite
    if (!Number.isInteger(this.limit) || this.limit < 1 || this.limit > 100) {
      this.addError('Limite deve ser um número entre 1 e 100');
    }

    // Validar ordem
    if (!['asc', 'desc'].includes(this.order)) {
      this.addError('Ordem deve ser "asc" ou "desc"');
    }
  }

  toRepositoryParams() {
    return {
      ...this.period.toRepositoryParams(),
      metric: this.metric,
      limit: this.limit,
      order: this.order,
    };
  }

  getMetricDisplayName() {
    const metricNames = {
      revenue: 'Receita',
      profit: 'Lucro',
      attendances: 'Atendimentos',
      professionals: 'Profissionais',
      averageTicket: 'Ticket Médio',
      growth: 'Crescimento',
    };

    return metricNames[this.metric] || this.metric;
  }
}

/**
 * DTO para resposta de comparativo de unidades
 */
export class UnitsComparisonResponseDTO {
  constructor(data) {
    this.raw = data;
    this.processed = this.processData(data);
  }

  processData(unitsData) {
    if (!Array.isArray(unitsData)) return [];

    return unitsData.map(unitData => {
      const { unit, financial, attendance, professionals, growth } = unitData;

      // Calcular métricas financeiras
      const totalRevenue = (financial?.revenues || []).reduce(
        (sum, revenue) => sum + (revenue.value || 0),
        0
      );

      const totalExpenses = (financial?.expenses || []).reduce(
        (sum, expense) => sum + (expense.value || 0),
        0
      );

      const profit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

      // Calcular métricas de atendimento
      const attendanceCount = (attendance || []).length;
      const averageTicket =
        attendanceCount > 0 ? totalRevenue / attendanceCount : 0;

      // Métricas de profissionais
      const professionalsCount = (professionals || []).length;
      const revenuePerProfessional =
        professionalsCount > 0 ? totalRevenue / professionalsCount : 0;

      // Calcular crescimento
      let growthPercentage = 0;
      if (growth?.current && growth?.previous) {
        const currentRevenue = (growth.current.revenues || []).reduce(
          (sum, revenue) => sum + (revenue.value || 0),
          0
        );
        const previousRevenue = (growth.previous.revenues || []).reduce(
          (sum, revenue) => sum + (revenue.value || 0),
          0
        );

        if (previousRevenue > 0) {
          growthPercentage =
            ((currentRevenue - previousRevenue) / previousRevenue) * 100;
        }
      }

      return {
        id: unit.id,
        name: unit.name,
        metrics: {
          revenue: totalRevenue,
          profit,
          profitMargin,
          attendances: attendanceCount,
          averageTicket,
          professionals: professionalsCount,
          revenuePerProfessional,
          growth: growthPercentage,
        },
        rawData: unitData,
      };
    });
  }

  toChartData() {
    return this.processed.map(unit => ({
      name: unit.name,
      receita: unit.metrics.revenue,
      lucro: unit.metrics.profit,
      atendimentos: unit.metrics.attendances,
      profissionais: unit.metrics.professionals,
    }));
  }

  toTableData() {
    return this.processed.map(unit => ({
      unidade: unit.name,
      receita: unit.metrics.revenue,
      lucro: unit.metrics.profit,
      margemLucro: unit.metrics.profitMargin,
      atendimentos: unit.metrics.attendances,
      ticketMedio: unit.metrics.averageTicket,
      profissionais: unit.metrics.professionals,
      receitaPorProfissional: unit.metrics.revenuePerProfessional,
      crescimento: unit.metrics.growth,
    }));
  }

  getTopPerformer(metric = 'revenue') {
    if (this.processed.length === 0) return null;

    return this.processed.reduce((top, unit) => {
      return (unit.metrics[metric] || 0) > (top.metrics[metric] || 0)
        ? unit
        : top;
    });
  }

  getTotalMetrics() {
    return this.processed.reduce(
      (totals, unit) => ({
        revenue: totals.revenue + unit.metrics.revenue,
        profit: totals.profit + unit.metrics.profit,
        attendances: totals.attendances + unit.metrics.attendances,
        professionals: totals.professionals + unit.metrics.professionals,
      }),
      { revenue: 0, profit: 0, attendances: 0, professionals: 0 }
    );
  }

  toObject() {
    return {
      units: this.processed,
      chartData: this.toChartData(),
      tableData: this.toTableData(),
      totals: this.getTotalMetrics(),
      summary: {
        totalUnits: this.processed.length,
        topPerformer: this.getTopPerformer('revenue'),
        totalRevenue: this.getTotalMetrics().revenue,
        totalProfit: this.getTotalMetrics().profit,
      },
    };
  }
}

/**
 * DTOs específicos para requests
 */
export class ComparativoUnidadesRequestDTO extends UnitsComparisonFiltersDTO {}
export class RankingUnidadesRequestDTO extends UnitsRankingFiltersDTO {}

export default {
  PeriodFiltersDTO,
  UnitFiltersDTO,
  UnitsComparisonFiltersDTO,
  UnitsRankingFiltersDTO,
  UnitsComparisonResponseDTO,
  ComparativoUnidadesRequestDTO,
  RankingUnidadesRequestDTO,
};
