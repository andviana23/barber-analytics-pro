/**
 * @file StockMovementTable.jsx
 * @description Componente para tabela de movimentações de estoque
 * @module Components/Stock
 * @author Andrey Viana
 * @date 13/11/2025
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Eye,
  Edit3,
  RotateCcw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * Badge para tipo de movimentação
 */
const MovementTypeBadge = ({ type }) => {
  const isEntry = type === 'ENTRADA';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isEntry
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      }`}
    >
      {isEntry ? (
        <ArrowUpCircle className="h-3 w-3" />
      ) : (
        <ArrowDownCircle className="h-3 w-3" />
      )}
      {type}
    </span>
  );
};

MovementTypeBadge.propTypes = {
  type: PropTypes.oneOf(['ENTRADA', 'SAIDA']).isRequired,
};

/**
 * Badge para motivo da movimentação
 */
const ReasonBadge = ({ reason }) => {
  const reasons = {
    COMPRA: { color: 'blue', label: 'Compra' },
    VENDA: { color: 'purple', label: 'Venda' },
    AJUSTE: { color: 'yellow', label: 'Ajuste' },
    DEVOLUCAO: { color: 'indigo', label: 'Devolução' },
    SERVICO: { color: 'pink', label: 'Serviço' },
    PERDA: { color: 'orange', label: 'Perda' },
  };

  const config = reasons[reason] || { color: 'gray', label: reason };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-${config.color}-100 text-${config.color}-800 dark:bg-${config.color}-900/30 dark:text-${config.color}-400`}
    >
      {config.label}
    </span>
  );
};

ReasonBadge.propTypes = {
  reason: PropTypes.string.isRequired,
};

/**
 * Tabela de movimentações de estoque
 * Design System compliant com suporte a dark mode
 */
const StockMovementTable = ({
  movements = [],
  isLoading = false,
  currentPage = 1,
  pageSize = 20,
  totalCount = 0,
  onPageChange,
  onViewDetails,
  onEditNotes,
  onRevert,
  canRevert = false,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filtrar movimentações localmente
  const filteredMovements = movements.filter(movement => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      movement.product_name?.toLowerCase().includes(search) ||
      movement.performed_by_name?.toLowerCase().includes(search) ||
      movement.reason?.toLowerCase().includes(search)
    );
  });

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  if (isLoading) {
    return (
      <div className="card-theme p-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-theme-muted">Carregando movimentações...</p>
        </div>
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="card-theme p-8 text-center">
        <p className="text-theme-muted">Nenhuma movimentação encontrada</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header com busca e filtros */}
      <div className="card-theme p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Busca */}
          <div className="relative max-w-md flex-1">
            <Search className="text-theme-muted absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por produto, profissional ou motivo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-theme w-full pl-10"
            />
          </div>

          {/* Botão filtros */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter className="h-4 w-4" />}
          >
            Filtros
          </Button>
        </div>

        {/* Área de filtros (colapsável) */}
        {showFilters && (
          <div className="border-theme-border mt-4 grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-3">
            {/* Aqui entrariam filtros adicionais como período, tipo, etc */}
            <p className="text-theme-muted col-span-full text-sm">
              Filtros avançados em desenvolvimento
            </p>
          </div>
        )}
      </div>

      {/* Tabela Desktop */}
      <div className="card-theme hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-theme-border border-b bg-light-bg dark:bg-dark-surface/50">
              <tr>
                <th className="text-theme-muted px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Produto
                </th>
                <th className="text-theme-muted px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                  Tipo
                </th>
                <th className="text-theme-muted px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                  Motivo
                </th>
                <th className="text-theme-muted px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="text-theme-muted px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                  Custo Unit.
                </th>
                <th className="text-theme-muted px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                  Total
                </th>
                <th className="text-theme-muted px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Responsável
                </th>
                <th className="text-theme-muted px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Data
                </th>
                <th className="text-theme-muted px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-theme-border divide-y">
              {filteredMovements.map(movement => (
                <tr
                  key={movement.id}
                  className="transition-colors hover:bg-light-bg dark:hover:bg-dark-surface/30"
                >
                  {/* Produto */}
                  <td className="px-4 py-3">
                    <div className="text-theme-primary text-sm font-medium">
                      {movement.product_name}
                    </div>
                    {movement.notes && (
                      <div className="text-theme-muted mt-0.5 max-w-xs truncate text-xs">
                        {movement.notes}
                      </div>
                    )}
                  </td>

                  {/* Tipo */}
                  <td className="px-4 py-3 text-center">
                    <MovementTypeBadge type={movement.movement_type} />
                  </td>

                  {/* Motivo */}
                  <td className="px-4 py-3 text-center">
                    <ReasonBadge reason={movement.reason} />
                  </td>

                  {/* Quantidade */}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-semibold ${
                        movement.movement_type === 'ENTRADA'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {movement.movement_type === 'ENTRADA' ? '+' : '-'}
                      {movement.quantity}
                    </span>
                  </td>

                  {/* Custo Unitário */}
                  <td className="text-theme-secondary px-4 py-3 text-right text-sm">
                    {formatCurrency(movement.unit_cost)}
                  </td>

                  {/* Total */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-theme-primary font-semibold">
                      {formatCurrency(movement.total_cost)}
                    </span>
                  </td>

                  {/* Responsável */}
                  <td className="px-4 py-3">
                    <div className="text-theme-secondary text-sm">
                      {movement.performed_by_name || 'N/A'}
                    </div>
                  </td>

                  {/* Data */}
                  <td className="px-4 py-3">
                    <div className="text-theme-secondary text-sm">
                      {formatDate(movement.created_at, 'dd/MM/yyyy HH:mm')}
                    </div>
                  </td>

                  {/* Ações */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {onViewDetails && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(movement)}
                          icon={<Eye className="h-4 w-4" />}
                          title="Ver detalhes"
                        />
                      )}
                      {onEditNotes && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditNotes(movement)}
                          icon={<Edit3 className="h-4 w-4" />}
                          title="Editar observações"
                        />
                      )}
                      {canRevert && onRevert && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRevert(movement.id)}
                          icon={<RotateCcw className="h-4 w-4" />}
                          title="Reverter movimentação"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards Mobile */}
      <div className="space-y-3 md:hidden">
        {filteredMovements.map(movement => (
          <div key={movement.id} className="card-theme space-y-3 p-4">
            {/* Header do card */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="text-theme-primary font-medium">
                  {movement.product_name}
                </h3>
                <p className="text-theme-muted mt-0.5 text-xs">
                  {formatDate(movement.created_at, 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <MovementTypeBadge type={movement.movement_type} />
            </div>

            {/* Detalhes */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-theme-muted">Quantidade:</span>
                <p
                  className={`font-semibold ${
                    movement.movement_type === 'ENTRADA'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {movement.movement_type === 'ENTRADA' ? '+' : '-'}
                  {movement.quantity}
                </p>
              </div>
              <div>
                <span className="text-theme-muted">Total:</span>
                <p className="text-theme-primary font-semibold">
                  {formatCurrency(movement.total_cost)}
                </p>
              </div>
              <div>
                <span className="text-theme-muted">Motivo:</span>
                <div className="mt-1">
                  <ReasonBadge reason={movement.reason} />
                </div>
              </div>
              <div>
                <span className="text-theme-muted">Responsável:</span>
                <p className="text-theme-secondary">
                  {movement.performed_by_name || 'N/A'}
                </p>
              </div>
            </div>

            {/* Observações */}
            {movement.notes && (
              <div className="text-sm">
                <span className="text-theme-muted">Observações:</span>
                <p className="text-theme-secondary mt-1">{movement.notes}</p>
              </div>
            )}

            {/* Ações */}
            <div className="border-theme-border flex gap-2 border-t pt-2">
              {onViewDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(movement)}
                  icon={<Eye className="h-4 w-4" />}
                  className="flex-1"
                >
                  Ver
                </Button>
              )}
              {onEditNotes && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditNotes(movement)}
                  icon={<Edit3 className="h-4 w-4" />}
                  className="flex-1"
                >
                  Editar
                </Button>
              )}
              {canRevert && onRevert && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRevert(movement.id)}
                  icon={<RotateCcw className="h-4 w-4" />}
                >
                  Reverter
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="card-theme p-4">
          <div className="flex items-center justify-between">
            <p className="text-theme-muted text-sm">
              Mostrando {(currentPage - 1) * pageSize + 1} a{' '}
              {Math.min(currentPage * pageSize, totalCount)} de {totalCount}{' '}
              movimentações
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasPrevPage}
                onClick={() => onPageChange(currentPage - 1)}
                icon={<ChevronLeft className="h-4 w-4" />}
              >
                Anterior
              </Button>
              <span className="text-theme-muted text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasNextPage}
                onClick={() => onPageChange(currentPage + 1)}
                icon={<ChevronRight className="h-4 w-4" />}
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

StockMovementTable.propTypes = {
  movements: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      product_name: PropTypes.string,
      movement_type: PropTypes.oneOf(['ENTRADA', 'SAIDA']).isRequired,
      reason: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
      unit_cost: PropTypes.number.isRequired,
      total_cost: PropTypes.number.isRequired,
      performed_by_name: PropTypes.string,
      notes: PropTypes.string,
      created_at: PropTypes.string.isRequired,
    })
  ),
  isLoading: PropTypes.bool,
  currentPage: PropTypes.number,
  pageSize: PropTypes.number,
  totalCount: PropTypes.number,
  onPageChange: PropTypes.func,
  onViewDetails: PropTypes.func,
  onEditNotes: PropTypes.func,
  onRevert: PropTypes.func,
  canRevert: PropTypes.bool,
  className: PropTypes.string,
};

export default StockMovementTable;
