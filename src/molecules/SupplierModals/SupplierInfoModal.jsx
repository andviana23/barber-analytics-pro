/**
 * Modal: Informações do Fornecedor
 */

import React from 'react';
import {
  X,
  Package,
  Mail,
  Phone,
  MapPin,
  FileText,
  Building,
} from 'lucide-react';

const SupplierInfoModal = ({ isOpen, onClose, supplier }) => {
  if (!isOpen || !supplier) return null;

  const formatCNPJ = cnpj => {
    if (!cnpj) return '';
    if (cnpj.length === 11) {
      return cnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cnpj.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5'
    );
  };

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <p className="text-base text-gray-900 dark:text-white mt-1">
          {value || '-'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Informações do Fornecedor
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Status Badge */}
          <div className="mb-6">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                supplier.is_active
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
              }`}
            >
              {supplier.is_active ? 'Ativo' : 'Inativo'}
            </span>
          </div>

          {/* Informações */}
          <div className="space-y-0">
            <InfoRow
              icon={Package}
              label="Nome/Descrição"
              value={supplier.nome}
            />
            <InfoRow
              icon={Building}
              label="Razão Social"
              value={supplier.razao_social}
            />
            <InfoRow
              icon={FileText}
              label="CNPJ"
              value={formatCNPJ(supplier.cpf_cnpj)}
            />
            <InfoRow icon={Mail} label="Email" value={supplier.email} />
            <InfoRow icon={Phone} label="Telefone" value={supplier.telefone} />
            <InfoRow icon={MapPin} label="Endereço" value={supplier.endereco} />
            <InfoRow
              icon={FileText}
              label="Observações"
              value={supplier.observacoes}
            />
          </div>

          {/* Metadados */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Cadastrado em:{' '}
              {new Date(supplier.created_at).toLocaleString('pt-BR')}
            </p>
            {supplier.updated_at && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Última atualização:{' '}
                {new Date(supplier.updated_at).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="btn-primary">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierInfoModal;
