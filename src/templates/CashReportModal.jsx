import React from 'react';
import PropTypes from 'prop-types';
import Modal from '../atoms/Modal';
import { CashReportPanel } from '../organisms';

/**
 * CashReportModal - Modal full-screen de relatório de caixa
 *
 * Template modal que exibe relatório detalhado de fechamento de caixa
 * em modo full-screen com opções de impressão.
 *
 * @component
 * @example
 * ```jsx
 * <CashReportModal
 *   isOpen={showModal}
 *   onClose={handleClose}
 *   cashRegister={cashData}
 *   transactions={transactions}
 * />
 * ```
 */
const CashReportModal = ({
  isOpen,
  onClose,
  cashRegister,
  transactions = [],
  loading = false,
  onCloseCash,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Relatório de Caixa"
      maxWidth="full"
      fullHeight
    >
      <div className="h-full flex flex-col">
        {/* Print Styles */}
        <style>
          {`
            @media print {
              body * {
                visibility: hidden;
              }
              #cash-report-print,
              #cash-report-print * {
                visibility: visible;
              }
              #cash-report-print {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              .no-print {
                display: none !important;
              }
            }
          `}
        </style>

        {/* Content */}
        <div id="cash-report-print" className="flex-1 overflow-y-auto">
          <CashReportPanel
            cashRegister={cashRegister}
            transactions={transactions}
            loading={loading}
            onPrint={handlePrint}
            onClose={onClose}
            onCloseCash={onCloseCash}
          />
        </div>
      </div>
    </Modal>
  );
};

CashReportModal.propTypes = {
  /** Se o modal está aberto */
  isOpen: PropTypes.bool.isRequired,
  /** Callback ao fechar */
  onClose: PropTypes.func.isRequired,
  /** Dados do caixa */
  cashRegister: PropTypes.shape({
    id: PropTypes.string,
    opened_at: PropTypes.string,
    opened_by_name: PropTypes.string,
    closed_at: PropTypes.string,
    closed_by_name: PropTypes.string,
    opening_balance: PropTypes.number,
    closing_balance: PropTypes.number,
    observations: PropTypes.string,
    status: PropTypes.oneOf(['open', 'closed']),
  }),
  /** Lista de transações */
  transactions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.oneOf(['inflow', 'outflow']),
      amount: PropTypes.number,
      description: PropTypes.string,
      created_at: PropTypes.string,
    })
  ),
  /** Estado de carregamento */
  loading: PropTypes.bool,
  /** Callback para fechar o caixa */
  onCloseCash: PropTypes.func,
};

export default CashReportModal;
