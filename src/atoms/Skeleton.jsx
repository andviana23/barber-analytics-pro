import React from 'react';
import PropTypes from 'prop-types';

/**
 * OrderCardSkeleton - Loading skeleton para card de comanda
 *
 * @component
 * @example
 * <OrderCardSkeleton count={3} />
 */
const OrderCardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {Array.from({
        length: count,
      }).map((_, index) => (
        <div
          key={index}
          className="card-theme animate-pulse rounded-lg border border-light-border p-4 dark:border-dark-border"
        >
          {/* Cabeçalho */}
          <div className="mb-4 flex items-center gap-3">
            <div className="h-5 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>

          {/* Informações principais */}
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>

          {/* Itens */}
          <div className="border-t border-light-border pt-3 dark:border-dark-border">
            <div className="mb-2 h-3 w-12 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex flex-wrap gap-2">
              <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-6 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-6 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
OrderCardSkeleton.propTypes = {
  count: PropTypes.number,
};

/**
 * TableSkeleton - Loading skeleton para tabelas
 *
 * @component
 * @example
 * <TableSkeleton rows={5} cols={4} />
 */
export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="animate-pulse space-y-3">
      {/* Cabeçalho */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
        }}
      >
        {Array.from({
          length: cols,
        }).map((_, i) => (
          <div
            key={i}
            className="h-10 rounded bg-gray-200 dark:bg-gray-700"
          ></div>
        ))}
      </div>

      {/* Linhas */}
      {Array.from({
        length: rows,
      }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
          }}
        >
          {Array.from({
            length: cols,
          }).map((_, colIndex) => (
            <div key={colIndex} className="card-theme h-8 rounded"></div>
          ))}
        </div>
      ))}
    </div>
  );
};
TableSkeleton.propTypes = {
  rows: PropTypes.number,
  cols: PropTypes.number,
};

/**
 * KPISkeleton - Loading skeleton para cards de KPI
 *
 * @component
 * @example
 * <KPISkeleton count={4} />
 */
export const KPISkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({
        length: count,
      }).map((_, index) => (
        <div
          key={index}
          className="card-theme animate-pulse rounded-lg border border-light-border p-4 dark:border-dark-border"
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          </div>
          <div className="mb-2 h-8 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
      ))}
    </div>
  );
};
KPISkeleton.propTypes = {
  count: PropTypes.number,
};

/**
 * FormSkeleton - Loading skeleton para formulários
 *
 * @component
 * @example
 * <FormSkeleton fields={5} />
 */
export const FormSkeleton = ({ fields = 5 }) => {
  return (
    <div className="animate-pulse space-y-6">
      {Array.from({
        length: fields,
      }).map((_, index) => (
        <div key={index}>
          <div className="mb-2 h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="card-theme h-10 w-full rounded"></div>
        </div>
      ))}
      <div className="flex justify-end gap-3 pt-4">
        <div className="h-10 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-10 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
      </div>
    </div>
  );
};
FormSkeleton.propTypes = {
  fields: PropTypes.number,
};
export default OrderCardSkeleton;
