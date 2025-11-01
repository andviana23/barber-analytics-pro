/**
 * @file listaDaVezDTO.js
 * @description DTOs para validação e transformação de dados do módulo Lista da Vez
 * @module dtos/listaDaVezDTO
 * @author AI Agent
 * @date 2024-10-18
 *
 * @description
 * DTOs responsáveis pela validação, sanitização e transformação
 * de dados do módulo Lista da Vez, seguindo o padrão DTO
 * da arquitetura Clean Architecture do Barber Analytics Pro.
 */

/**
 * DTO para validação de dados de inicialização da lista
 */
class InitializeTurnListDTO {
  constructor(data) {
    this.unitId = data.unitId;
    this.errors = [];
  }

  validate() {
    this.errors = [];

    // Validar unitId
    if (!this.unitId) {
      this.errors.push('ID da unidade é obrigatório');
    } else if (typeof this.unitId !== 'string') {
      this.errors.push('ID da unidade deve ser uma string');
    } else if (!this.isValidUUID(this.unitId)) {
      this.errors.push('ID da unidade deve ser um UUID válido');
    }

    return this.errors.length === 0;
  }

  isValidUUID(uuid) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  getErrors() {
    return this.errors;
  }

  toJSON() {
    return {
      unitId: this.unitId,
    };
  }
}

/**
 * DTO para validação de dados de adição de ponto
 */
class AddPointDTO {
  constructor(data) {
    this.unitId = data.unitId;
    this.professionalId = data.professionalId;
    this.errors = [];
  }

  validate() {
    this.errors = [];

    // Validar unitId
    if (!this.unitId) {
      this.errors.push('ID da unidade é obrigatório');
    } else if (typeof this.unitId !== 'string') {
      this.errors.push('ID da unidade deve ser uma string');
    } else if (!this.isValidUUID(this.unitId)) {
      this.errors.push('ID da unidade deve ser um UUID válido');
    }

    // Validar professionalId
    if (!this.professionalId) {
      this.errors.push('ID do profissional é obrigatório');
    } else if (typeof this.professionalId !== 'string') {
      this.errors.push('ID do profissional deve ser uma string');
    } else if (!this.isValidUUID(this.professionalId)) {
      this.errors.push('ID do profissional deve ser um UUID válido');
    }

    return this.errors.length === 0;
  }

  isValidUUID(uuid) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  getErrors() {
    return this.errors;
  }

  toJSON() {
    return {
      unitId: this.unitId,
      professionalId: this.professionalId,
    };
  }
}

/**
 * DTO para validação de dados de histórico mensal
 */
class MonthlyHistoryDTO {
  constructor(data) {
    this.unitId = data.unitId;
    this.month = data.month;
    this.year = data.year;
    this.errors = [];
  }

  validate() {
    this.errors = [];

    // Validar unitId
    if (!this.unitId) {
      this.errors.push('ID da unidade é obrigatório');
    } else if (typeof this.unitId !== 'string') {
      this.errors.push('ID da unidade deve ser uma string');
    } else if (!this.isValidUUID(this.unitId)) {
      this.errors.push('ID da unidade deve ser um UUID válido');
    }

    // Validar month
    if (!this.month) {
      this.errors.push('Mês é obrigatório');
    } else if (typeof this.month !== 'number') {
      this.errors.push('Mês deve ser um número');
    } else if (this.month < 1 || this.month > 12) {
      this.errors.push('Mês deve estar entre 1 e 12');
    }

    // Validar year
    if (!this.year) {
      this.errors.push('Ano é obrigatório');
    } else if (typeof this.year !== 'number') {
      this.errors.push('Ano deve ser um número');
    } else if (this.year < 2020 || this.year > new Date().getFullYear() + 1) {
      this.errors.push('Ano inválido');
    }

    return this.errors.length === 0;
  }

  isValidUUID(uuid) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  getErrors() {
    return this.errors;
  }

  toJSON() {
    return {
      unitId: this.unitId,
      month: this.month,
      year: this.year,
    };
  }
}

/**
 * DTO para validação de dados de relatório mensal
 */
class MonthlyReportDTO {
  constructor(data) {
    this.unitId = data.unitId;
    this.month = data.month;
    this.year = data.year;
    this.format = data.format || 'json'; // json, csv, pdf
    this.errors = [];
  }

  validate() {
    this.errors = [];

    // Validar unitId
    if (!this.unitId) {
      this.errors.push('ID da unidade é obrigatório');
    } else if (typeof this.unitId !== 'string') {
      this.errors.push('ID da unidade deve ser uma string');
    } else if (!this.isValidUUID(this.unitId)) {
      this.errors.push('ID da unidade deve ser um UUID válido');
    }

    // Validar month
    if (!this.month) {
      this.errors.push('Mês é obrigatório');
    } else if (typeof this.month !== 'number') {
      this.errors.push('Mês deve ser um número');
    } else if (this.month < 1 || this.month > 12) {
      this.errors.push('Mês deve estar entre 1 e 12');
    }

    // Validar year
    if (!this.year) {
      this.errors.push('Ano é obrigatório');
    } else if (typeof this.year !== 'number') {
      this.errors.push('Ano deve ser um número');
    } else if (this.year < 2020 || this.year > new Date().getFullYear() + 1) {
      this.errors.push('Ano inválido');
    }

    // Validar format
    if (!['json', 'csv', 'pdf'].includes(this.format)) {
      this.errors.push('Formato deve ser json, csv ou pdf');
    }

    return this.errors.length === 0;
  }

  isValidUUID(uuid) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  getErrors() {
    return this.errors;
  }

  toJSON() {
    return {
      unitId: this.unitId,
      month: this.month,
      year: this.year,
      format: this.format,
    };
  }
}

/**
 * DTO para transformação de dados da lista da vez
 */
class TurnListDTO {
  constructor(data) {
    this.id = data.id;
    this.unitId = data.unit_id;
    this.unitName = data.unit_name;
    this.professionalId = data.professional_id;
    this.professionalName = data.professional_name;
    this.points = data.points;
    this.position = data.position;
    this.lastUpdated = data.last_updated;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  toDisplayFormat() {
    return {
      id: this.id,
      unitId: this.unitId,
      unitName: this.unitName,
      professionalId: this.professionalId,
      professionalName: this.professionalName,
      points: this.points,
      position: this.position,
      pointsDisplay: `${this.points} ponto${this.points !== 1 ? 's' : ''}`,
      formattedLastUpdated: new Date(this.lastUpdated).toLocaleString('pt-BR'),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toJSON() {
    return {
      id: this.id,
      unitId: this.unitId,
      unitName: this.unitName,
      professionalId: this.professionalId,
      professionalName: this.professionalName,
      points: this.points,
      position: this.position,
      lastUpdated: this.lastUpdated,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

/**
 * DTO para transformação de dados do histórico
 */
class TurnHistoryDTO {
  constructor(data) {
    this.id = data.id;
    this.unitId = data.unit_id;
    this.unitName = data.unit_name;
    this.professionalId = data.professional_id;
    this.professionalName = data.professional_name;
    this.month = data.month;
    this.year = data.year;
    this.totalPoints = data.total_points;
    this.finalPosition = data.final_position;
    this.createdAt = data.created_at;
  }

  toDisplayFormat() {
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

    return {
      id: this.id,
      unitId: this.unitId,
      unitName: this.unitName,
      professionalId: this.professionalId,
      professionalName: this.professionalName,
      month: this.month,
      year: this.year,
      monthName: monthNames[this.month - 1],
      totalPoints: this.totalPoints,
      finalPosition: this.finalPosition,
      pointsDisplay: `${this.totalPoints} ponto${this.totalPoints !== 1 ? 's' : ''}`,
      formattedCreatedAt: new Date(this.createdAt).toLocaleString('pt-BR'),
      createdAt: this.createdAt,
    };
  }

  toJSON() {
    return {
      id: this.id,
      unitId: this.unitId,
      unitName: this.unitName,
      professionalId: this.professionalId,
      professionalName: this.professionalName,
      month: this.month,
      year: this.year,
      totalPoints: this.totalPoints,
      finalPosition: this.finalPosition,
      createdAt: this.createdAt,
    };
  }
}

/**
 * DTO para estatísticas da lista da vez
 */
class TurnListStatsDTO {
  constructor(data) {
    this.totalBarbers = data.totalBarbers || 0;
    this.totalPoints = data.totalPoints || 0;
    this.averagePoints = data.averagePoints || 0;
    this.barbersWithPoints = data.barbersWithPoints || 0;
    this.lastUpdated = data.lastUpdated;
  }

  toDisplayFormat() {
    return {
      totalBarbers: this.totalBarbers,
      totalPoints: this.totalPoints,
      averagePoints: Math.round(this.averagePoints * 100) / 100,
      barbersWithPoints: this.barbersWithPoints,
      barbersWithoutPoints: this.totalBarbers - this.barbersWithPoints,
      lastUpdated: this.lastUpdated
        ? new Date(this.lastUpdated).toLocaleString('pt-BR')
        : 'Nunca',
      formattedTotalPoints: `${this.totalPoints} ponto${this.totalPoints !== 1 ? 's' : ''}`,
      formattedAveragePoints: `${Math.round(this.averagePoints * 100) / 100} ponto${this.averagePoints !== 1 ? 's' : ''}`,
    };
  }

  toJSON() {
    return {
      totalBarbers: this.totalBarbers,
      totalPoints: this.totalPoints,
      averagePoints: this.averagePoints,
      barbersWithPoints: this.barbersWithPoints,
      lastUpdated: this.lastUpdated,
    };
  }
}

/**
 * DTO para dados de exportação
 */
class ExportDataDTO {
  constructor(data, format = 'csv') {
    this.data = data;
    this.format = format;
    this.filename = this.generateFilename();
    this.errors = [];
  }

  validate() {
    this.errors = [];

    if (!this.data || !Array.isArray(this.data)) {
      this.errors.push('Dados para exportação são obrigatórios');
    }

    if (!['csv', 'json', 'pdf'].includes(this.format)) {
      this.errors.push('Formato deve ser csv, json ou pdf');
    }

    return this.errors.length === 0;
  }

  generateFilename() {
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0];
    return `lista_da_vez_${timestamp}.${this.format}`;
  }

  getErrors() {
    return this.errors;
  }

  toJSON() {
    return {
      data: this.data,
      format: this.format,
      filename: this.filename,
    };
  }
}

// Exportar todos os DTOs
export {
  InitializeTurnListDTO,
  AddPointDTO,
  MonthlyHistoryDTO,
  MonthlyReportDTO,
  TurnListDTO,
  TurnHistoryDTO,
  TurnListStatsDTO,
  ExportDataDTO,
};
