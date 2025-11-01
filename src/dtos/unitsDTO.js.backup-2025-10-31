const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

const normalizeString = value =>
  typeof value === 'string' ? value.trim() : '';

const normalizeOptionalString = value => {
  if (value === undefined || value === null) return undefined;
  const trimmed = normalizeString(value);
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeBoolean = value => {
  if (value === undefined || value === null) return undefined;
  return Boolean(value);
};

export const isValidUuid = value =>
  typeof value === 'string' && UUID_REGEX.test(value.trim());

const nowIso = () => new Date().toISOString();

const clampMonth = month => {
  const parsed = Number(month);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(Math.max(parsed, 1), 12);
};

const parseYear = year => {
  const parsed = Number(year);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

const calculatePeriodRange = (month, year) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const format = date => date.toISOString().split('T')[0];

  return {
    startDate: format(start),
    endDate: format(end),
  };
};

export class UnitFiltersDTO {
  constructor(filters = {}) {
    this.includeInactive = Boolean(filters.includeInactive);
  }

  isValid() {
    this.errors = [];
    return this.errors.length === 0;
  }

  getErrors() {
    return this.errors || [];
  }

  getErrorMessage() {
    return this.getErrors().join(', ') || 'Filtros inválidos';
  }

  toRepositoryFilters() {
    return {
      includeInactive: this.includeInactive,
    };
  }
}

export class UnitIdentifierDTO {
  constructor(id) {
    this.id = normalizeOptionalString(id) || null;
  }

  isValid() {
    this.errors = [];

    if (!this.id || !isValidUuid(this.id)) {
      this.errors.push('ID da unidade inválido');
    }

    return this.errors.length === 0;
  }

  getErrors() {
    return this.errors || [];
  }

  getErrorMessage() {
    return this.getErrors().join(', ') || 'ID inválido';
  }

  value() {
    return this.id;
  }
}

export class CreateUnitDTO {
  constructor(input = {}) {
    this.name = normalizeString(input.name);
    const statusFlag =
      input.status !== undefined ? Boolean(input.status) : undefined;
    const isActiveFlag = normalizeBoolean(input.is_active);
    this.is_active =
      statusFlag !== undefined
        ? statusFlag
        : isActiveFlag !== undefined
          ? isActiveFlag
          : true;
    this.user_id = normalizeOptionalString(input.user_id) || null;
    this.created_at = input.created_at || nowIso();
    this.updated_at = input.updated_at || nowIso();
  }

  isValid() {
    this.errors = [];

    if (!this.name || this.name.length < 3) {
      this.errors.push('Nome da unidade deve ter pelo menos 3 caracteres');
    }

    if (this.user_id && !isValidUuid(this.user_id)) {
      this.errors.push('user_id inválido');
    }

    return this.errors.length === 0;
  }

  getErrors() {
    return this.errors || [];
  }

  getErrorMessage() {
    return this.getErrors().join(', ') || 'Dados inválidos para criação';
  }

  toDatabase() {
    return {
      name: this.name,
      is_active: this.is_active,
      user_id: this.user_id,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

export class UpdateUnitDTO {
  constructor(input = {}) {
    this.name =
      input.name !== undefined ? normalizeString(input.name) : undefined;
    const statusFlag =
      input.status !== undefined ? Boolean(input.status) : undefined;
    const isActiveFlag = normalizeBoolean(input.is_active);
    this.is_active =
      statusFlag !== undefined
        ? statusFlag
        : isActiveFlag !== undefined
          ? isActiveFlag
          : undefined;
    this.updated_at = input.updated_at || nowIso();
  }

  isValid() {
    this.errors = [];

    if (this.name !== undefined && this.name.length < 3) {
      this.errors.push('Nome da unidade deve ter pelo menos 3 caracteres');
    }

    return this.errors.length === 0;
  }

  getErrors() {
    return this.errors || [];
  }

  getErrorMessage() {
    return this.getErrors().join(', ') || 'Dados inválidos para atualização';
  }

  toDatabase() {
    const payload = {
      updated_at: this.updated_at,
    };

    if (this.name !== undefined) payload.name = this.name;
    if (this.is_active !== undefined) payload.is_active = this.is_active;

    return payload;
  }
}

export class UnitStatsParamsDTO {
  constructor(params = {}) {
    this.unitId = normalizeOptionalString(params.unitId || params.id) || null;
    const now = new Date();
    const rawMonth = params.month ?? params.mes ?? now.getMonth() + 1;
    const rawYear = params.year ?? params.ano ?? now.getFullYear();

    this.month = clampMonth(rawMonth);
    this.year = parseYear(rawYear);
  }

  isValid() {
    this.errors = [];

    if (!this.unitId || !isValidUuid(this.unitId)) {
      this.errors.push('ID da unidade inválido');
    }

    if (!this.month || this.month < 1 || this.month > 12) {
      this.errors.push('Mês inválido');
    }

    if (!this.year) {
      this.errors.push('Ano inválido');
    }

    return this.errors.length === 0;
  }

  getErrors() {
    return this.errors || [];
  }

  getErrorMessage() {
    return (
      this.getErrors().join(', ') ||
      'Parâmetros inválidos para cálculo de estatísticas'
    );
  }

  toRepositoryParams() {
    const { startDate, endDate } = calculatePeriodRange(this.month, this.year);
    return {
      unitId: this.unitId,
      month: this.month,
      year: this.year,
      startDate,
      endDate,
    };
  }
}

export class UnitsPeriodDTO {
  constructor(params = {}) {
    const now = new Date();
    const rawMonth = params.month ?? params.mes ?? now.getMonth() + 1;
    const rawYear = params.year ?? params.ano ?? now.getFullYear();

    this.month = clampMonth(rawMonth);
    this.year = parseYear(rawYear);
  }

  isValid() {
    this.errors = [];

    if (!this.month || this.month < 1 || this.month > 12) {
      this.errors.push('Mês inválido');
    }

    if (!this.year) {
      this.errors.push('Ano inválido');
    }

    return this.errors.length === 0;
  }

  getErrors() {
    return this.errors || [];
  }

  getErrorMessage() {
    return this.getErrors().join(', ') || 'Período inválido';
  }

  toPeriodRange() {
    const { startDate, endDate } = calculatePeriodRange(this.month, this.year);
    return {
      month: this.month,
      year: this.year,
      startDate,
      endDate,
    };
  }
}

export class UnitsRankingParamsDTO extends UnitsPeriodDTO {
  constructor(params = {}) {
    super(params);
    this.metric = normalizeString(params.metric || 'revenue').toLowerCase();
  }

  isValid() {
    const allowedMetrics = ['revenue', 'profit', 'attendances', 'efficiency'];
    const baseValid = super.isValid();
    this.errors = super.getErrors();

    if (!allowedMetrics.includes(this.metric)) {
      this.errors.push('Métrica de ranking inválida');
    }

    return baseValid && this.errors.length === 0;
  }

  getErrorMessage() {
    return (
      this.getErrors().join(', ') || 'Parâmetros inválidos para gerar ranking'
    );
  }
}

export class UnitEvolutionParamsDTO extends UnitIdentifierDTO {}

export class UnitResponseDTO {
  constructor(row = {}) {
    this.id = row.id || null;
    this.name = row.name || '';
    this.user_id = row.user_id || null;
    const isActive =
      row.is_active !== undefined
        ? Boolean(row.is_active)
        : row.status !== undefined
          ? Boolean(row.status)
          : true;
    this.is_active = isActive;
    this.status = isActive; // Compatibilidade com código legado
    this.created_at = row.created_at || null;
    this.updated_at = row.updated_at || null;
  }

  toObject() {
    return { ...this };
  }
}

export default {
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
};
