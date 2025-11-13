/**
 * @fileoverview Unit tests for Supplier DTOs
 * @module lib/dtos/__tests__/supplierDTO.test
 * @description Tests validation, formatting, and transformation in DTOs
 *
 * @author Andrey Viana
 * @version 2.0.0
 * @created 2025-11-13
 */

import { describe, it, expect } from 'vitest';
import {
  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierResponseDTO,
  SupplierFiltersDTO,
} from '../supplierDTO.js';

// ============================================================
// CREATE SUPPLIER DTO TESTS
// ============================================================

describe('CreateSupplierDTO', () => {
  const validInput = {
    unit_id: '123e4567-e89b-42d3-a456-426614174000', // Valid UUID v4
    name: 'Fornecedor Teste Ltda',
    cnpj_cpf: '12345678901234',
    email: 'contato@fornecedor.com.br',
    phone: '31987654321',
    city: 'Belo Horizonte',
    state: 'MG',
    zip_code: '30000-000',
    address: 'Rua Teste, 123',
    status: 'ATIVO',
    payment_terms: 'A vista',
    notes: 'Fornecedor preferencial',
  };

  describe('validate()', () => {
    it('should validate correct data', () => {
      const dto = new CreateSupplierDTO(validInput);
      const result = dto.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing unit_id', () => {
      const input = { ...validInput };
      delete input.unit_id;

      const dto = new CreateSupplierDTO(input);
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'unit_id é obrigatório e deve ser um UUID válido'
      );
    });

    it('should reject invalid unit_id format', () => {
      const dto = new CreateSupplierDTO({
        ...validInput,
        unit_id: 'invalid-uuid',
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'unit_id é obrigatório e deve ser um UUID válido'
      );
    });

    it('should reject name with less than 2 chars', () => {
      const dto = new CreateSupplierDTO({
        ...validInput,
        name: 'A',
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Nome deve ter no mínimo 2 caracteres');
    });

    it('should reject missing name', () => {
      const input = { ...validInput };
      delete input.name;

      const dto = new CreateSupplierDTO(input);
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Nome deve ter no mínimo 2 caracteres');
    });

    it('should reject invalid CNPJ format', () => {
      const dto = new CreateSupplierDTO({
        ...validInput,
        cnpj_cpf: '123456', // Too short
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'CNPJ/CPF inválido (deve ter 11 ou 14 dígitos)'
      );
    });

    it('should accept valid CPF format (11 digits)', () => {
      const dto = new CreateSupplierDTO({
        ...validInput,
        cnpj_cpf: '12345678901',
      });
      const result = dto.validate();

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid email format', () => {
      const dto = new CreateSupplierDTO({
        ...validInput,
        email: 'invalid-email',
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('E-mail inválido');
    });

    it('should reject phone with less than 10 digits', () => {
      const dto = new CreateSupplierDTO({
        ...validInput,
        phone: '319876543', // 9 digits
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Telefone inválido (deve ter 10 ou 11 dígitos)'
      );
    });

    it('should accept phone with 10 digits (landline)', () => {
      const dto = new CreateSupplierDTO({
        ...validInput,
        phone: '3138765432',
      });
      const result = dto.validate();

      expect(result.isValid).toBe(true);
    });

    it('should accept phone with 11 digits (mobile)', () => {
      const dto = new CreateSupplierDTO({
        ...validInput,
        phone: '31987654321',
      });
      const result = dto.validate();

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid state code', () => {
      const dto = new CreateSupplierDTO({
        ...validInput,
        state: 'XX',
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Estado inválido (use sigla UF: MG, SP, etc.)'
      );
    });

    it('should reject invalid status', () => {
      const dto = new CreateSupplierDTO({
        ...validInput,
        status: 'INVALIDO',
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Status inválido (ATIVO, INATIVO ou BLOQUEADO)'
      );
    });

    it('should normalize CNPJ (remove formatting)', () => {
      const dto = new CreateSupplierDTO({
        ...validInput,
        cnpj_cpf: '12.345.678/9012-34',
      });

      expect(dto.cnpj_cpf).toBe('12345678901234');
    });

    it('should normalize phone (remove formatting)', () => {
      const dto = new CreateSupplierDTO({
        ...validInput,
        phone: '(31) 98765-4321',
      });

      expect(dto.phone).toBe('31987654321');
    });

    it('should normalize email (lowercase)', () => {
      const dto = new CreateSupplierDTO({
        ...validInput,
        email: 'CONTATO@FORNECEDOR.COM.BR',
      });

      expect(dto.email).toBe('contato@fornecedor.com.br');
    });

    it('should normalize state (uppercase)', () => {
      const dto = new CreateSupplierDTO({
        ...validInput,
        state: 'mg',
      });

      expect(dto.state).toBe('MG');
    });

    it('should trim whitespace from fields', () => {
      const dto = new CreateSupplierDTO({
        ...validInput,
        name: '  Fornecedor Teste  ',
        city: '  Belo Horizonte  ',
      });

      expect(dto.name).toBe('Fornecedor Teste');
      expect(dto.city).toBe('Belo Horizonte');
    });
  });

  describe('toObject()', () => {
    it('should convert to database-ready object', () => {
      const dto = new CreateSupplierDTO(validInput);
      const obj = dto.toObject();

      expect(obj).toHaveProperty('unit_id', validInput.unit_id);
      expect(obj).toHaveProperty('name', validInput.name);
      expect(obj).toHaveProperty('cnpj_cpf', '12345678901234');
      expect(obj).toHaveProperty('email', 'contato@fornecedor.com.br');
      expect(obj).toHaveProperty('phone', '31987654321');
      expect(obj).toHaveProperty('is_active', true);
      expect(obj).toHaveProperty('created_at');
      expect(obj).toHaveProperty('updated_at');
    });

    it('should set optional fields to null when empty', () => {
      const dto = new CreateSupplierDTO({
        unit_id: validInput.unit_id,
        name: 'Fornecedor',
      });
      const obj = dto.toObject();

      expect(obj.cnpj_cpf).toBeNull();
      expect(obj.email).toBeNull();
      expect(obj.phone).toBeNull();
      expect(obj.city).toBeNull();
      expect(obj.state).toBeNull();
      expect(obj.notes).toBeNull();
    });

    it('should default status to ATIVO', () => {
      const input = { ...validInput };
      delete input.status;

      const dto = new CreateSupplierDTO(input);
      const obj = dto.toObject();

      expect(obj.status).toBe('ATIVO');
    });
  });
});

// ============================================================
// UPDATE SUPPLIER DTO TESTS
// ============================================================

describe('UpdateSupplierDTO', () => {
  describe('validate()', () => {
    it('should validate partial update', () => {
      const dto = new UpdateSupplierDTO({
        name: 'Novo Nome',
      });
      const result = dto.validate();

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid name', () => {
      const dto = new UpdateSupplierDTO({
        name: 'A',
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Nome deve ter no mínimo 2 caracteres');
    });

    it('should reject invalid email', () => {
      const dto = new UpdateSupplierDTO({
        email: 'invalid-email',
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('E-mail inválido');
    });

    it('should reject invalid CNPJ', () => {
      const dto = new UpdateSupplierDTO({
        cnpj_cpf: '123',
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'CNPJ/CPF inválido (deve ter 11 ou 14 dígitos)'
      );
    });

    it('should accept undefined fields (no update)', () => {
      const dto = new UpdateSupplierDTO({
        name: 'Novo Nome',
        // email not provided
      });

      expect(dto.email).toBeUndefined();
      expect(dto.validate().isValid).toBe(true);
    });

    it('should normalize provided fields', () => {
      const dto = new UpdateSupplierDTO({
        cnpj_cpf: '12.345.678/9012-34',
        email: 'NOVO@EMAIL.COM',
        state: 'sp',
      });

      expect(dto.cnpj_cpf).toBe('12345678901234');
      expect(dto.email).toBe('novo@email.com');
      expect(dto.state).toBe('SP');
    });
  });

  describe('toObject()', () => {
    it('should only include defined fields', () => {
      const dto = new UpdateSupplierDTO({
        name: 'Novo Nome',
        email: 'novo@email.com',
        // Other fields not provided
      });
      const obj = dto.toObject();

      expect(obj).toHaveProperty('name', 'Novo Nome');
      expect(obj).toHaveProperty('email', 'novo@email.com');
      expect(obj).toHaveProperty('updated_at');
      expect(obj).not.toHaveProperty('phone');
      expect(obj).not.toHaveProperty('city');
    });

    it('should set null for empty strings', () => {
      const dto = new UpdateSupplierDTO({
        email: '',
        notes: '',
      });
      const obj = dto.toObject();

      expect(obj.email).toBeNull();
      expect(obj.notes).toBeNull();
    });
  });
});

// ============================================================
// SUPPLIER RESPONSE DTO TESTS
// ============================================================

describe('SupplierResponseDTO', () => {
  const mockSupplier = {
    id: '123e4567-e89b-42d3-a456-426614174000',
    unit_id: '987fcdeb-51a2-43f7-8c9e-123456789abc',
    unit: { name: 'Unidade Nova Lima' },
    name: 'Fornecedor Teste Ltda',
    cnpj_cpf: '12345678901234',
    email: 'contato@fornecedor.com.br',
    phone: '31987654321',
    city: 'Belo Horizonte',
    state: 'MG',
    zip_code: '30000-000',
    address: 'Rua Teste, 123',
    status: 'ATIVO',
    payment_terms: 'A vista',
    notes: 'Fornecedor preferencial',
    is_active: true,
    created_at: '2025-11-13T10:00:00Z',
    updated_at: '2025-11-13T12:00:00Z',
    contacts: [
      {
        id: 'contact-1',
        contact_name: 'João Silva',
        phone: '31987654321',
        email: 'joao@fornecedor.com',
        role: 'Gerente',
        is_primary: true,
        is_active: true,
      },
    ],
    files: [
      {
        id: 'file-1',
        file_name: 'contrato.pdf',
        file_type: 'CONTRATO',
        file_size: 2048000,
        uploaded_at: '2025-11-13T11:00:00Z',
        is_active: true,
      },
    ],
  };

  it('should format CNPJ correctly', () => {
    const dto = new SupplierResponseDTO(mockSupplier);
    expect(dto.cnpj_cpf_formatted).toBe('12.345.678/9012-34');
  });

  it('should format CPF correctly', () => {
    const dto = new SupplierResponseDTO({
      ...mockSupplier,
      cnpj_cpf: '12345678901',
    });
    expect(dto.cnpj_cpf_formatted).toBe('123.456.789-01');
  });

  it('should format mobile phone correctly', () => {
    const dto = new SupplierResponseDTO(mockSupplier);
    expect(dto.phone_formatted).toBe('(31) 98765-4321');
  });

  it('should format landline phone correctly', () => {
    const dto = new SupplierResponseDTO({
      ...mockSupplier,
      phone: '3138765432',
    });
    expect(dto.phone_formatted).toBe('(31) 3876-5432');
  });

  it('should build full address', () => {
    const dto = new SupplierResponseDTO(mockSupplier);
    expect(dto.full_address).toBe(
      'Rua Teste, 123, Belo Horizonte, MG, CEP: 30000-000'
    );
  });

  it('should format status label', () => {
    const dto = new SupplierResponseDTO(mockSupplier);
    expect(dto.status_label).toBe('Ativo');

    const dto2 = new SupplierResponseDTO({
      ...mockSupplier,
      status: 'INATIVO',
    });
    expect(dto2.status_label).toBe('Inativo');

    const dto3 = new SupplierResponseDTO({
      ...mockSupplier,
      status: 'BLOQUEADO',
    });
    expect(dto3.status_label).toBe('Bloqueado');
  });

  it('should include active contacts', () => {
    const dto = new SupplierResponseDTO(mockSupplier);
    expect(dto.contacts).toHaveLength(1);
    expect(dto.contacts[0].contact_name).toBe('João Silva');
  });

  it('should filter out inactive contacts', () => {
    const dto = new SupplierResponseDTO({
      ...mockSupplier,
      contacts: [{ ...mockSupplier.contacts[0], is_active: false }],
    });
    expect(dto.contacts).toHaveLength(0);
  });

  it('should format file size in KB', () => {
    const dto = new SupplierResponseDTO({
      ...mockSupplier,
      files: [
        {
          ...mockSupplier.files[0],
          file_size: 512000, // 500 KB
        },
      ],
    });
    expect(dto.files[0].file_size_formatted).toBe('500.0 KB');
  });

  it('should format file size in MB', () => {
    const dto = new SupplierResponseDTO(mockSupplier);
    expect(dto.files[0].file_size_formatted).toBe('2.0 MB');
  });

  it('should handle missing contacts and files', () => {
    const dto = new SupplierResponseDTO({
      ...mockSupplier,
      contacts: undefined,
      files: undefined,
    });

    expect(dto.contacts).toEqual([]);
    expect(dto.files).toEqual([]);
  });
});

// ============================================================
// SUPPLIER FILTERS DTO TESTS
// ============================================================

describe('SupplierFiltersDTO', () => {
  describe('validate()', () => {
    it('should validate empty filters (defaults)', () => {
      const dto = new SupplierFiltersDTO({});
      const result = dto.validate();

      expect(result.isValid).toBe(true);
      expect(dto.offset).toBe(0);
      expect(dto.limit).toBe(50);
    });

    it('should reject invalid status', () => {
      const dto = new SupplierFiltersDTO({ status: 'INVALIDO' });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Status inválido (ATIVO, INATIVO ou BLOQUEADO)'
      );
    });

    it('should reject negative offset', () => {
      const dto = new SupplierFiltersDTO({ offset: -1 });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('offset não pode ser negativo');
    });

    it('should reject limit < 1', () => {
      const dto = new SupplierFiltersDTO({ limit: 0 });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('limit deve estar entre 1 e 100');
    });

    it('should reject limit > 100', () => {
      const dto = new SupplierFiltersDTO({ limit: 101 });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('limit deve estar entre 1 e 100');
    });

    it('should parse string numbers', () => {
      const dto = new SupplierFiltersDTO({
        offset: '10',
        limit: '25',
      });

      expect(dto.offset).toBe(10);
      expect(dto.limit).toBe(25);
    });

    it('should trim search string', () => {
      const dto = new SupplierFiltersDTO({
        search: '  Fornecedor  ',
      });

      expect(dto.search).toBe('Fornecedor');
    });
  });

  describe('toObject()', () => {
    it('should only include provided filters', () => {
      const dto = new SupplierFiltersDTO({
        status: 'ATIVO',
        offset: 10,
        limit: 25,
      });
      const obj = dto.toObject();

      expect(obj).toEqual({
        status: 'ATIVO',
        offset: 10,
        limit: 25,
      });
    });

    it('should not include undefined filters', () => {
      const dto = new SupplierFiltersDTO({
        offset: 0,
        limit: 50,
      });
      const obj = dto.toObject();

      expect(obj).not.toHaveProperty('status');
      expect(obj).not.toHaveProperty('search');
      expect(obj).toHaveProperty('offset', 0);
      expect(obj).toHaveProperty('limit', 50);
    });
  });
});
