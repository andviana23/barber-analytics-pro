import {
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Info,
  Settings,
  TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { bankAccountsService } from '../services';
import { formatCurrency } from '../utils/formatters';

/**
 * Componente que mostra claramente a separação entre receitas operacionais e ajustes de saldo
 * para evitar confusão no fluxo de caixa
 * @param {Object} props - Props do componente
 * @param {string} props.accountId - ID da conta bancária
 * @param {string} props.accountName - Nome da conta bancária
 */
const FinancialSeparationCard = ({ accountId, accountName }) => {
  const [data, setData] = useState({
    operationalRevenues: 0,
    balanceAdjustments: 0,
    totalExpenses: 0,
    currentBalance: 0,
    initialBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFinancialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar dados da view separada
      const { data: summaryData, error: summaryError } =
        await bankAccountsService.getFinancialSummarySeparated();

      if (summaryError) throw new Error(summaryError);

      // Encontrar dados da conta específica
      const accountData = summaryData.find(
        item => item.account_id === accountId
      );

      if (accountData) {
        setData({
          operationalRevenues:
            Number.parseFloat(accountData.operational_revenues) || 0,
          balanceAdjustments:
            Number.parseFloat(accountData.balance_adjustments) || 0,
          totalExpenses: Number.parseFloat(accountData.total_expenses) || 0,
          currentBalance: Number.parseFloat(accountData.current_balance) || 0,
          initialBalance: Number.parseFloat(accountData.initial_balance) || 0,
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (accountId) {
      loadFinancialData();
    }
  }, [accountId, loadFinancialData]);

  if (loading) {
    return (
      <div className="card-theme rounded-xl border border-light-border p-6 dark:border-dark-border">
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-theme rounded-xl border border-red-200 p-6 dark:border-red-800">
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  const calculatedBalance =
    data.initialBalance + data.operationalRevenues - data.totalExpenses;
  const balanceIsCorrect =
    Math.abs(calculatedBalance - data.currentBalance) < 0.01;

  return (
    <div className="card-theme rounded-xl border border-light-border p-6 dark:border-dark-border">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-theme-primary flex items-center gap-2 text-lg font-semibold">
            <Settings className="h-5 w-5 text-primary" />
            Separação Financeira: {accountName}
          </h3>
          <p className="text-theme-secondary mt-1 text-sm">
            Visualização clara entre receitas operacionais e ajustes de saldo
          </p>
        </div>
        {balanceIsCorrect && (
          <div className="flex items-center space-x-2 rounded-lg bg-green-100 px-3 py-1 dark:bg-green-900/30">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-700 dark:text-green-300">
              Balanceado
            </span>
          </div>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Saldo Inicial */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="mb-2 flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">
              Saldo Inicial
            </span>
          </div>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(data.initialBalance)}
          </p>
          <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
            Incluindo ajustes aplicados
          </p>
        </div>

        {/* Receitas Operacionais */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="mb-2 flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-semibold uppercase text-green-600 dark:text-green-400">
              Receitas Operacionais
            </span>
          </div>
          <p className="text-lg font-bold text-green-700 dark:text-green-300">
            {formatCurrency(data.operationalRevenues)}
          </p>
          <p className="mt-1 text-xs text-green-600 dark:text-green-400">
            Serviços e produtos apenas
          </p>
        </div>

        {/* Despesas */}
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="mb-2 flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 rotate-180 text-red-600 dark:text-red-400" />
            <span className="text-xs font-semibold uppercase text-red-600 dark:text-red-400">
              Despesas
            </span>
          </div>
          <p className="text-lg font-bold text-red-700 dark:text-red-300">
            {formatCurrency(data.totalExpenses)}
          </p>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            Despesas confirmadas
          </p>
        </div>

        {/* Saldo Atual */}
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
          <div className="mb-2 flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-semibold uppercase text-purple-600 dark:text-purple-400">
              Saldo Atual
            </span>
          </div>
          <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
            {formatCurrency(data.currentBalance)}
          </p>
          <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
            Saldo consolidado
          </p>
        </div>
      </div>

      {/* Separação de Ajustes de Saldo */}
      {data.balanceAdjustments !== 0 && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-start space-x-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div className="flex-1">
              <h4 className="mb-2 text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                Ajustes de Saldo Detectados
              </h4>
              <p className="mb-3 text-sm text-yellow-700 dark:text-yellow-400">
                Total de ajustes aplicados ao saldo inicial:{' '}
                <strong>{formatCurrency(data.balanceAdjustments)}</strong>
              </p>
              <div className="rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900/30">
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  ✅{' '}
                  <strong>
                    Estes ajustes NÃO estão contabilizados como receitas.
                  </strong>
                  <br />
                  ✅ Eles aparecem apenas no fluxo de caixa consolidado.
                  <br />✅ O cálculo do saldo usa: Saldo Inicial + Receitas
                  Operacionais - Despesas.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fórmula de Cálculo */}
      <div className="rounded-lg border border-light-border bg-light-bg p-4 dark:border-dark-border dark:bg-dark-bg">
        <h4 className="text-theme-primary mb-3 text-sm font-semibold">
          Fórmula de Cálculo
        </h4>
        <div className="text-theme-secondary text-sm">
          <span className="card-theme rounded px-2 py-1 font-mono">
            Saldo Atual = Saldo Inicial + Receitas Operacionais - Despesas
          </span>
        </div>
        <div className="text-theme-secondary mt-2 text-xs">
          <span className="font-mono">
            {formatCurrency(data.currentBalance)} ={' '}
            {formatCurrency(data.initialBalance)} +{' '}
            {formatCurrency(data.operationalRevenues)} -{' '}
            {formatCurrency(data.totalExpenses)}
          </span>
        </div>
        {!balanceIsCorrect && (
          <div className="mt-3 rounded bg-red-100 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
            ⚠️ Discrepância detectada:{' '}
            {formatCurrency(Math.abs(calculatedBalance - data.currentBalance))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialSeparationCard;
