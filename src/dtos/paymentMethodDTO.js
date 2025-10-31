/**
 * DTOs para Formas de Pagamento (Payment Methods)
 *
 * Padrão do projeto: Classes com validação e transformação, retornando erros descritivos.
 * Assunção: A tabela payment_methods possui as colunas fee_percentage (numeric) e receipt_days (integer),
 * conforme uso em diversas partes do sistema (DRE, importação, UI). Caso não existam no banco,
 * ajustar migrations para adicioná-las.
 */

const normalizeNumber = value => {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

export class CreatePaymentMethodDTO {
  constructor(input) {
    this.unit_id = input?.unit_id || null;
    this.name = typeof input?.name === 'string' ? input.name.trim() : '';
    this.type = input?.type || null; // opcional: 'PIX' | 'Cartão' | 'Dinheiro' | 'Transferência'
    this.fee_percentage = normalizeNumber(input?.fee_percentage ?? 0);
    this.receipt_days = normalizeNumber(input?.receipt_days ?? 0);
    this.is_active = input?.is_active !== undefined ? !!input.is_active : true;
  }

  isValid() {
    this.errors = [];

    if (!this.unit_id) this.errors.push('unit_id é obrigatório');
    if (!this.name) this.errors.push('name é obrigatório');

    if (this.fee_percentage !== undefined) {
      if (this.fee_percentage < 0 || this.fee_percentage > 100) {
        this.errors.push('fee_percentage deve estar entre 0 e 100');
      }
    }

    if (this.receipt_days !== undefined) {
      if (this.receipt_days < 0)
        this.errors.push('receipt_days não pode ser negativo');
    }

    return this.errors.length === 0;
  }

  getErrors() {
    return this.errors || [];
  }

  toDatabase() {
    return {
      unit_id: this.unit_id,
      name: this.name,
      type: this.type,
      fee_percentage: this.fee_percentage ?? 0,
      receipt_days: this.receipt_days ?? 0,
      is_active: this.is_active,
    };
  }
}

export class UpdatePaymentMethodDTO {
  constructor(input) {
    this.name =
      input?.name !== undefined ? String(input.name).trim() : undefined;
    this.type = input?.type !== undefined ? input.type : undefined;
    this.fee_percentage =
      input?.fee_percentage !== undefined
        ? normalizeNumber(input.fee_percentage)
        : undefined;
    this.receipt_days =
      input?.receipt_days !== undefined
        ? normalizeNumber(input.receipt_days)
        : undefined;
    this.is_active =
      input?.is_active !== undefined ? !!input.is_active : undefined;
  }

  isValid() {
    this.errors = [];

    if (this.name !== undefined && this.name === '') {
      this.errors.push('name não pode ser vazio');
    }

    if (this.fee_percentage !== undefined) {
      if (this.fee_percentage < 0 || this.fee_percentage > 100) {
        this.errors.push('fee_percentage deve estar entre 0 e 100');
      }
    }

    if (this.receipt_days !== undefined) {
      if (this.receipt_days < 0)
        this.errors.push('receipt_days não pode ser negativo');
    }

    return this.errors.length === 0;
  }

  getErrors() {
    return this.errors || [];
  }

  toDatabase() {
    const db = {};
    if (this.name !== undefined) db.name = this.name;
    if (this.type !== undefined) db.type = this.type;
    if (this.fee_percentage !== undefined)
      db.fee_percentage = this.fee_percentage;
    if (this.receipt_days !== undefined) db.receipt_days = this.receipt_days;
    if (this.is_active !== undefined) db.is_active = this.is_active;
    return db;
  }
}

export class PaymentMethodResponseDTO {
  constructor(row) {
    this.id = row?.id ?? null;
    this.unit_id = row?.unit_id ?? null;
    this.name = row?.name ?? '';
    this.type = row?.type ?? null;
    this.fee_percentage = normalizeNumber(row?.fee_percentage ?? 0) ?? 0;
    this.receipt_days = normalizeNumber(row?.receipt_days ?? 0) ?? 0;
    this.is_active = !!row?.is_active;
    this.created_at = row?.created_at ?? null;
    this.updated_at = row?.updated_at ?? null;
    this.units = row?.units || undefined; // quando vem via select com join
  }

  toObject() {
    return { ...this };
  }
}

export default {
  CreatePaymentMethodDTO,
  UpdatePaymentMethodDTO,
  PaymentMethodResponseDTO,
};
