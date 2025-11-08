/**
 * 🎨 Modal: Informações do Fornecedor - 100% REFATORADO COM DESIGN SYSTEM
 *
 * Modal premium de visualização de detalhes do fornecedor
 *
 * Features:
 * - ✅ Design System completo aplicado
 * - ✅ Layout otimizado com cards e ícones
 * - ✅ Badge de status com gradiente
 * - ✅ Formatação automática (CNPJ, datas)
 * - ✅ Dark mode completo
 * - ✅ Animações suaves
 * - ✅ Separação visual por seções
 * - ✅ Metadados de auditoria
 * - ✅ Responsivo e acessível
 */

import React from 'react';
import {
  X,
  Package,
  Mail,
  Phone,
  MapPin,
  FileText,
  Building2,
  Calendar,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
const SupplierInfoModal = ({ isOpen, onClose, supplier }) => {
  // Debug log
  React.useEffect(() => {
    if (isOpen) {
      console.log('📋 SupplierInfoModal - Modal aberto');
      console.log('📦 SupplierInfoModal - Dados do fornecedor:', supplier);
    }
  }, [isOpen, supplier]);
  if (!isOpen) return null;
  if (!supplier) {
    console.warn('⚠️ SupplierInfoModal - Fornecedor não fornecido!');
    // Mostrar modal vazio com mensagem
    return (
      <div
        className="fixed inset-0 z-50 flex animate-fadeIn items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="card-theme w-full max-w-md rounded-2xl p-8 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="text-center">
            <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h3 className="text-theme-primary mb-2 text-xl font-bold">
              Erro ao Carregar Fornecedor
            </h3>
            <p className="text-theme-secondary mb-6">
              Não foi possível carregar os dados do fornecedor.
            </p>
            <button
              onClick={onClose}
              className="text-dark-text-primary rounded-xl bg-gradient-primary px-6 py-2.5 font-semibold transition-all hover:opacity-90"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Garantir valores padrão para evitar erros
  const supplierData = {
    nome: supplier?.nome || '',
    cpf_cnpj: supplier?.cpf_cnpj || '',
    razao_social: supplier?.razao_social || '',
    email: supplier?.email || '',
    telefone: supplier?.telefone || '',
    endereco: supplier?.endereco || '',
    observacoes: supplier?.observacoes || '',
    is_active: supplier?.is_active ?? true,
    created_at: supplier?.created_at || new Date().toISOString(),
    updated_at: supplier?.updated_at || null,
  };
  const formatCNPJ = cnpj => {
    if (!cnpj) return '';
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cleaned.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5'
    );
  };
  const formatPhone = phone => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };
  const formatDate = date => {
    try {
      return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", {
        locale: ptBR,
      });
    } catch {
      return '-';
    }
  };
  const InfoRow = ({ icon: Icon, label, value, multiline = false }) => (
    <div className="dark:hover:bg-gray-750/50 flex items-start gap-4 rounded-lg border-b-2 border-gray-100 px-4 py-4 transition-colors last:border-0 hover:bg-light-bg dark:border-dark-border dark:bg-dark-bg/50">
      <div className="flex-shrink-0 rounded-lg bg-blue-100 p-2.5 dark:bg-blue-900/30">
        <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-theme-secondary mb-1 text-xs font-bold uppercase tracking-wide">
          {label}
        </p>
        <p
          className={`text-theme-primary text-sm font-medium ${multiline ? 'whitespace-pre-wrap' : ''}`}
        >
          {value || (
            <span className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary italic">
              Não informado
            </span>
          )}
        </p>
      </div>
    </div>
  );
  return (
    <div
      className="fixed inset-0 z-50 flex animate-fadeIn items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card-theme animate-slideUp max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 🎯 Header Premium - DESIGN SYSTEM */}
        <div className="border-b-2 border-light-border bg-blue-50 px-6 py-5 dark:border-dark-border dark:bg-blue-900/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-gradient-primary p-3 shadow-lg">
                <Info className="text-dark-text-primary h-6 w-6" />
              </div>
              <div>
                <h2 className="text-theme-primary text-2xl font-bold">
                  Detalhes do Fornecedor
                </h2>
                <p className="text-theme-secondary mt-1 text-sm">
                  Informações completas do cadastro
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-lg p-2 transition-colors hover:bg-light-surface focus:outline-none focus:ring-2 focus:ring-primary/50 dark:hover:bg-dark-surface"
              aria-label="Fechar modal"
            >
              <X className="text-theme-secondary hover:text-theme-primary h-6 w-6 transition-colors" />
            </button>
          </div>
        </div>

        {/* 📊 Conteúdo Scrollável - DESIGN SYSTEM */}
        <div className="max-h-[calc(90vh-180px)] flex-1 overflow-y-auto px-6 py-6">
          {/* Badge de Status Premium */}
          <div className="mb-6 flex items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-lg transition-all duration-200 ${supplierData.is_active ? 'bg-gradient-success text-white shadow-green-500/30' : 'bg-gradient-danger text-white shadow-red-500/30'}`}
            >
              {supplierData.is_active ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Fornecedor Ativo
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" />
                  Fornecedor Inativo
                </>
              )}
            </div>
          </div>

          {/* Seção: Dados Cadastrais */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-light-border pb-3 dark:border-dark-border">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-theme-primary text-lg font-bold">
                Dados Cadastrais
              </h3>
            </div>

            <div className="space-y-1">
              <InfoRow
                icon={Package}
                label="Nome/Descrição"
                value={supplierData.nome}
              />
              <InfoRow
                icon={Building2}
                label="Razão Social"
                value={supplierData.razao_social}
              />
              <InfoRow
                icon={FileText}
                label="CNPJ/CPF"
                value={formatCNPJ(supplierData.cpf_cnpj)}
              />
            </div>
          </div>

          {/* Seção: Contato */}
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-light-border pb-3 dark:border-dark-border">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-theme-primary text-lg font-bold">
                Informações de Contato
              </h3>
            </div>

            <div className="space-y-1">
              <InfoRow
                icon={Mail}
                label="Email"
                value={
                  supplierData.email ? (
                    <a
                      href={`mailto:${supplierData.email}`}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {supplierData.email}
                    </a>
                  ) : (
                    <span className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary italic">
                      Não informado
                    </span>
                  )
                }
              />
              <InfoRow
                icon={Phone}
                label="Telefone"
                value={
                  supplierData.telefone ? (
                    <a
                      href={`tel:${supplierData.telefone}`}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {formatPhone(supplierData.telefone)}
                    </a>
                  ) : (
                    <span className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary italic">
                      Não informado
                    </span>
                  )
                }
              />
              <InfoRow
                icon={MapPin}
                label="Endereço"
                value={
                  supplierData.endereco || (
                    <span className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary italic">
                      Não informado
                    </span>
                  )
                }
                multiline
              />
            </div>
          </div>

          {/* Seção: Observações - SEMPRE VISÍVEL */}
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-light-border pb-3 dark:border-dark-border">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-theme-primary text-lg font-bold">
                Observações
              </h3>
            </div>

            {supplierData.observacoes ? (
              <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/10">
                <p className="text-theme-primary whitespace-pre-wrap text-sm">
                  {supplierData.observacoes}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-light-border bg-gray-50 p-4 dark:border-dark-border dark:bg-gray-800/30">
                <p className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary text-center text-sm italic">
                  Nenhuma observação cadastrada para este fornecedor
                </p>
              </div>
            )}
          </div>

          {/* Seção: Auditoria */}
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-light-border pb-3 dark:border-dark-border">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-theme-primary text-lg font-bold">
                Informações de Auditoria
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="dark:to-gray-750 rounded-xl border-2 border-light-border bg-gradient-light p-4 dark:border-dark-border dark:from-gray-800">
                <p className="text-theme-secondary mb-2 text-xs font-bold uppercase tracking-wide">
                  Cadastrado em
                </p>
                <p className="text-theme-primary text-sm font-semibold">
                  {formatDate(supplierData.created_at)}
                </p>
              </div>

              {supplierData.updated_at && (
                <div className="dark:to-gray-750 rounded-xl border-2 border-light-border bg-gradient-light p-4 dark:border-dark-border dark:from-gray-800">
                  <p className="text-theme-secondary mb-2 text-xs font-bold uppercase tracking-wide">
                    Última Atualização
                  </p>
                  <p className="text-theme-primary text-sm font-semibold">
                    {formatDate(supplierData.updated_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🎬 Footer com Ações - DESIGN SYSTEM */}
        <div className="border-t-2 border-light-border bg-light-bg px-6 py-4 dark:border-dark-border dark:bg-dark-surface">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="text-dark-text-primary flex transform items-center gap-2 rounded-xl bg-gradient-primary px-6 py-2.5 font-semibold shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-105 hover:opacity-90 hover:shadow-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-dark-bg"
            >
              <X className="h-5 w-5" />
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SupplierInfoModal;
