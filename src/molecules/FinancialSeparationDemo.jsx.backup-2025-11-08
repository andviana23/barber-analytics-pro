import PropTypes from 'prop-types';
import FinancialSeparationCard from '../organisms/FinancialSeparationCard';

/**
 * Wrapper para demonstrar a separação financeira na página de contas bancárias
 * @param {Object} props - Props do componente
 * @param {Array} props.accounts - Lista de contas bancárias
 * @param {string} props.unitId - ID da unidade
 */
const FinancialSeparationDemo = ({ accounts, unitId }) => {
  if (!accounts || accounts.length === 0 || !unitId) {
    return null;
  }

  const firstActiveAccount = accounts.find(account => account.is_active);

  if (!firstActiveAccount) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="card-theme rounded-xl border border-light-border p-4 dark:border-dark-border">
        <h3 className="text-theme-primary mb-2 text-lg font-semibold">
          💡 Separação Financeira
        </h3>
        <p className="text-theme-secondary mb-4 text-sm">
          Demonstração da separação clara entre receitas operacionais e ajustes
          de saldo para a conta: <strong>{firstActiveAccount.name}</strong>
        </p>
        <FinancialSeparationCard
          accountId={firstActiveAccount.id}
          accountName={firstActiveAccount.name}
          unitId={unitId}
        />
      </div>
    </div>
  );
};

FinancialSeparationDemo.propTypes = {
  accounts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      is_active: PropTypes.bool.isRequired,
    })
  ),
  unitId: PropTypes.string.isRequired,
};

FinancialSeparationDemo.defaultProps = {
  accounts: [],
};

export default FinancialSeparationDemo;
