/**
 * SupplierDetailsView Component
 * @module components/suppliers/SupplierDetailsView
 * @description Visualização completa dos detalhes do fornecedor
 * @author Andrey Viana
 * @version 1.0.0
 * @date 2025-11-13
 */

import React from 'react';
import {
  X,
  Edit,
  Archive,
  Building2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  FileText,
  ShoppingCart,
} from 'lucide-react';
import PropTypes from 'prop-types';
import { StatusBadge } from './SuppliersTable';

/**
 * SupplierDetailsView Component
 */
export default function SupplierDetailsView({
  supplier,
  purchases = [],
  isOpen,
  onClose,
  onEdit,
  onArchive,
  onAddContact,
  onAddFile,
}) {
  if (!isOpen || !supplier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card-theme max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-light-border p-6 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-light-bg p-2 dark:bg-dark-hover">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-theme-primary text-xl font-bold">
                {supplier.name}
              </h2>
              <p className="text-theme-secondary text-sm">
                {supplier.cnpj_cpf_formatted || 'Sem CNPJ/CPF'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={supplier.status} />
            <button
              onClick={onClose}
              className="text-theme-secondary hover:text-theme-primary rounded p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex gap-2 border-b border-light-border p-4 dark:border-dark-border">
          <button
            onClick={() => onEdit(supplier)}
            className="btn-theme-primary"
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </button>
          <button
            onClick={() => onArchive(supplier)}
            className="btn-theme-secondary"
          >
            <Archive className="mr-2 h-4 w-4" />
            Arquivar
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Contact Info */}
          <section>
            <h3 className="text-theme-primary mb-3 text-lg font-semibold">
              Informações de Contato
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {supplier.email && (
                <div className="flex items-start gap-3">
                  <Mail className="text-theme-secondary mt-0.5 h-5 w-5" />
                  <div>
                    <p className="text-theme-secondary text-xs">E-mail</p>
                    <p className="text-theme-primary text-sm">
                      {supplier.email}
                    </p>
                  </div>
                </div>
              )}
              {supplier.phone_formatted && (
                <div className="flex items-start gap-3">
                  <Phone className="text-theme-secondary mt-0.5 h-5 w-5" />
                  <div>
                    <p className="text-theme-secondary text-xs">Telefone</p>
                    <p className="text-theme-primary text-sm">
                      {supplier.phone_formatted}
                    </p>
                  </div>
                </div>
              )}
              {supplier.full_address && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <MapPin className="text-theme-secondary mt-0.5 h-5 w-5" />
                  <div>
                    <p className="text-theme-secondary text-xs">Endereço</p>
                    <p className="text-theme-primary text-sm">
                      {supplier.full_address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Payment Terms */}
          {supplier.payment_terms && (
            <section>
              <h3 className="text-theme-primary mb-3 text-lg font-semibold">
                Condições de Pagamento
              </h3>
              <div className="flex items-start gap-3">
                <DollarSign className="text-theme-secondary mt-0.5 h-5 w-5" />
                <p className="text-theme-primary text-sm">
                  {supplier.payment_terms}
                </p>
              </div>
            </section>
          )}

          {/* Notes */}
          {supplier.notes && (
            <section>
              <h3 className="text-theme-primary mb-3 text-lg font-semibold">
                Observações
              </h3>
              <div className="flex items-start gap-3">
                <FileText className="text-theme-secondary mt-0.5 h-5 w-5" />
                <p className="text-theme-primary whitespace-pre-wrap text-sm">
                  {supplier.notes}
                </p>
              </div>
            </section>
          )}

          {/* Purchase History */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-theme-primary text-lg font-semibold">
                Histórico de Compras
              </h3>
              <ShoppingCart className="text-theme-secondary h-5 w-5" />
            </div>
            {purchases.length > 0 ? (
              <div className="space-y-2">
                {purchases.map((purchase, idx) => (
                  <div key={idx} className="card-theme rounded-lg border p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-theme-primary text-sm font-medium">
                          {purchase.product_name || 'Produto'}
                        </p>
                        <p className="text-theme-secondary text-xs">
                          {purchase.date}
                        </p>
                      </div>
                      <p className="text-theme-primary text-sm font-semibold">
                        {purchase.total_formatted}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-theme-secondary text-sm">
                Nenhuma compra registrada
              </p>
            )}
          </section>

          {/* Contacts */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-theme-primary text-lg font-semibold">
                Contatos
              </h3>
              <button
                onClick={onAddContact}
                className="btn-theme-secondary text-sm"
              >
                Adicionar
              </button>
            </div>
            {supplier.contacts && supplier.contacts.length > 0 ? (
              <div className="space-y-2">
                {supplier.contacts.map(contact => (
                  <div
                    key={contact.id}
                    className="card-theme rounded-lg border p-3"
                  >
                    <p className="text-theme-primary text-sm font-medium">
                      {contact.contact_name}
                    </p>
                    {contact.role && (
                      <p className="text-theme-secondary text-xs">
                        {contact.role}
                      </p>
                    )}
                    {contact.phone && (
                      <p className="text-theme-secondary text-xs">
                        📞 {contact.phone}
                      </p>
                    )}
                    {contact.email && (
                      <p className="text-theme-secondary text-xs">
                        ✉️ {contact.email}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-theme-secondary text-sm">
                Nenhum contato cadastrado
              </p>
            )}
          </section>

          {/* Files */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-theme-primary text-lg font-semibold">
                Arquivos
              </h3>
              <button
                onClick={onAddFile}
                className="btn-theme-secondary text-sm"
              >
                Upload
              </button>
            </div>
            {supplier.files && supplier.files.length > 0 ? (
              <div className="space-y-2">
                {supplier.files.map(file => (
                  <div
                    key={file.id}
                    className="card-theme flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-theme-primary text-sm font-medium">
                        {file.file_name}
                      </p>
                      <p className="text-theme-secondary text-xs">
                        {file.file_size_formatted}
                      </p>
                    </div>
                    <a
                      href={file.file_path}
                      download
                      className="btn-theme-secondary text-xs"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-theme-secondary text-sm">
                Nenhum arquivo anexado
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

SupplierDetailsView.propTypes = {
  supplier: PropTypes.object,
  purchases: PropTypes.array,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onAddContact: PropTypes.func,
  onAddFile: PropTypes.func,
};
