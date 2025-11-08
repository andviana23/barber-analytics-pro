import React, { useState, useCallback } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useUnit } from '../../context/UnitContext';
import { supabase } from '../../services/supabase';
import ImportExpensesFromOFXService from '../../services/importExpensesFromOFX';
import categoriesService from '../../services/categoriesService';
import { PartiesService } from '../../services/partiesService';

/**
 * Modal de Importação de Despesas via OFX
 *
 * Fluxo de 4 etapas:
 * 1. Upload e validação do arquivo OFX
 * 2. Preview/Revisão das despesas (só DEBIT)
 * 3. Processamento e importação
 * 4. Resultado da importação
 *
 * Design baseado no padrão do sistema com dark mode
 */
const ImportExpensesFromOFXModal = ({ isOpen, onClose, onSuccess }) => {
  const { showSuccess, showError } = useToast();
  const { selectedUnit } = useUnit();

  // Estados
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [previewData, setPreviewData] = useState([]); // Preview das despesas antes de importar
  const [selectedRows, setSelectedRows] = useState([]); // Linhas selecionadas para importar
  const [importResult, setImportResult] = useState(null);
  const steps = [
    {
      id: 1,
      title: 'Upload',
      icon: Upload,
    },
    {
      id: 2,
      title: 'Revisão',
      icon: FileText,
    },
    {
      id: 3,
      title: 'Processando',
      icon: Loader2,
    },
    {
      id: 4,
      title: 'Concluído',
      icon: CheckCircle,
    },
  ];

  /**
   * Handler para upload de arquivo
   */
  const handleFileUpload = useCallback(
    async event => {
      const file = event.target.files[0];
      if (!file) return;

      // Validar extensão
      if (!file.name.toLowerCase().endsWith('.ofx')) {
        showError(
          'Arquivo inválido',
          'Por favor, selecione um arquivo OFX válido.'
        );
        return;
      }

      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Arquivo muito grande', 'O arquivo deve ter no máximo 5MB.');
        return;
      }
      setUploadedFile(file);
      setIsLoading(true);
      try {
        // Processar arquivo OFX
        const { data, error } =
          await ImportExpensesFromOFXService.readOFXFile(file);
        if (error) {
          throw new Error(error);
        }
        if (!data || data.length === 0) {
          throw new Error('Nenhuma transação encontrada no arquivo OFX');
        }

        // ✅ FILTRAR APENAS DEBIT (DESPESAS/SAÍDAS)
        const allTransactions = data.transactions || data;
        const debitOnly = allTransactions.filter(t => t.type === 'DEBIT');
        const creditCount = allTransactions.length - debitOnly.length;
        console.log('📊 Total transações:', allTransactions.length);
        console.log('✅ DEBIT (despesas):', debitOnly.length);
        console.log('❌ CREDIT (ignorados):', creditCount);
        if (debitOnly.length === 0) {
          throw new Error(
            `Nenhuma despesa (DEBIT) encontrada no arquivo OFX.\n${allTransactions.length} transação(ões) de crédito foram ignoradas.`
          );
        }

        // Preparar preview com categoria padrão
        setParsedData({
          ...data,
          transactions: debitOnly,
        });

        // Adicionar categoria padrão "Despesas sem Identificação" para todas as transações
        const dataWithDefaultCategory = debitOnly.map(transaction => ({
          ...transaction,
          suggestedCategory: 'Despesas sem Identificação', // Categoria padrão
        }));
        setPreviewData(dataWithDefaultCategory);
        setSelectedRows(dataWithDefaultCategory.map((_, idx) => idx)); // Selecionar todos
        setCurrentStep(2); // Ir para revisão

        showSuccess(
          'Arquivo processado!',
          `${debitOnly.length} despesa(s) encontrada(s)${creditCount > 0 ? ` (${creditCount} crédito(s) ignorado(s))` : ''}`
        );
      } catch (error) {
        console.error('❌ Erro ao processar arquivo:', error);
        showError('Erro no processamento', error.message);
        setUploadedFile(null);
      } finally {
        setIsLoading(false);
      }
    },
    [showError, selectedUnit]
  );

  /**
   * Importar apenas as linhas selecionadas
   */
  const handleConfirmImport = async () => {
    // Filtrar apenas as linhas selecionadas
    const selectedData = previewData.filter((_, idx) =>
      selectedRows.includes(idx)
    );
    if (selectedData.length === 0) {
      showError(
        'Nenhuma despesa selecionada',
        'Selecione pelo menos uma despesa para importar.'
      );
      return;
    }
    setCurrentStep(3); // Ir para processamento
    await importData(selectedData);
  };

  /**
   * Importar dados processados
   */
  const importData = async data => {
    if (!selectedUnit?.id) {
      showError('Erro', 'Nenhuma unidade selecionada');
      return;
    }
    try {
      setIsLoading(true);

      // Buscar primeira conta bancária da unidade
      const { data: bankAccounts } = await supabase
        .from('bank_accounts')
        .select('id')
        .eq('unit_id', selectedUnit.id)
        .eq('is_active', true)
        .limit(1);
      if (!bankAccounts || bankAccounts.length === 0) {
        throw new Error(
          'Nenhuma conta bancária encontrada. Por favor, cadastre uma conta bancária antes de importar despesas.'
        );
      }
      const context = {
        unitId: selectedUnit.id,
        bankAccountId: bankAccounts[0].id,
      };

      // Validar transações
      const validation =
        ImportExpensesFromOFXService.validateTransactions(data);
      if (!validation.isValid) {
        throw new Error(`Arquivo inválido: ${validation.errors.join(', ')}`);
      }

      // Normalizar dados
      const normalized = ImportExpensesFromOFXService.normalizeData(
        data.transactions || data,
        context
      );
      if (normalized.errors.length > 0) {
        console.warn('⚠️ Erros de normalização:', normalized.errors);
      }

      // 🔍 Buscar categoria "Despesas sem Identificação"
      const { data: expenseCategories } =
        await categoriesService.getExpenseCategories();
      const defaultCategory = expenseCategories?.find(
        cat => cat.name === 'Despesas sem Identificação'
      );
      if (!defaultCategory) {
        console.warn(
          '⚠️ Categoria "Despesas sem Identificação" não encontrada! As despesas serão importadas sem categoria.'
        );
      } else {
        console.log(
          '✅ Categoria padrão encontrada:',
          defaultCategory.name,
          '(ID:',
          defaultCategory.id,
          ')'
        );
      }

      // 🏪 Buscar fornecedores existentes usando o método correto
      const { data: suppliers } = await PartiesService.getParties({
        unitId: selectedUnit.id,
        tipo: 'Fornecedor',
        isActive: true,
      });
      console.log('📋 Categorias carregadas:', expenseCategories?.length || 0);
      console.log('🏪 Fornecedores carregados:', suppliers?.length || 0);

      // Atribuir categoria padrão a todas as despesas normalizadas
      const normalizedWithCategory = normalized.normalized.map(record => ({
        ...record,
        expense: {
          ...record.expense,
          category_id: defaultCategory?.id || null, // Categoria padrão
        },
      }));
      console.log(
        `🏷️ Atribuindo categoria "${defaultCategory?.name || 'NENHUMA'}" para ${normalizedWithCategory.length} despesas`
      );

      // Enriquecer dados (detectar fornecedores - categoria já definida)
      const enriched = await ImportExpensesFromOFXService.enrichData(
        normalizedWithCategory,
        {
          unitId: selectedUnit.id,
          categories: expenseCategories || [],
          suppliers: suppliers || [],
        }
      );

      // Inserir registros
      const results = await ImportExpensesFromOFXService.insertApprovedRecords(
        enriched,
        context
      );

      // Gerar relatório
      const report = ImportExpensesFromOFXService.generateReport(
        results,
        enriched
      );
      setImportResult(report);
      setCurrentStep(4); // Etapa 4: Resultado

      if (report.sucesso > 0) {
        showSuccess(
          'Importação concluída!',
          `${report.sucesso} despesas importadas com sucesso.`
        );
        onSuccess?.(report);
      }
    } catch (error) {
      console.error('❌ Erro na importação:', error);
      showError('Erro na importação', error.message);
      setCurrentStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resetar modal
   */
  const handleClose = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setParsedData(null);
    setImportResult(null);
    setIsLoading(false);
    onClose();
  };

  /**
   * Renderizar conteúdo da etapa
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-theme-primary mb-2 text-lg font-semibold dark:text-gray-100">
                Importar Despesas do Extrato OFX
              </h3>
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                Selecione o arquivo OFX exportado do seu banco
              </p>
            </div>

            {/* File Input */}
            <div className="rounded-lg border-2 border-dashed border-light-border p-8 text-center transition-colors hover:border-blue-500 dark:border-dark-border dark:hover:border-blue-400">
              <input
                type="file"
                accept=".ofx"
                onChange={handleFileUpload}
                className="hidden"
                id="ofx-file-input"
                disabled={isLoading}
              />
              <label
                htmlFor="ofx-file-input"
                className="flex cursor-pointer flex-col items-center"
              >
                <FileText className="text-light-text-muted dark:text-dark-text-muted mb-3 h-12 w-12" />
                <span className="text-theme-primary dark:text-dark-text-primary mb-1 text-sm font-medium">
                  Clique para selecionar o arquivo
                </span>
                <span className="text-theme-secondary dark:text-dark-text-muted text-xs">
                  Formato: .ofx (máx. 5MB)
                </span>
              </label>
            </div>

            {/* Info Card */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <h4 className="mb-2 flex items-center text-sm font-semibold text-blue-900 dark:text-blue-100">
                <AlertCircle className="mr-2 h-4 w-4" />
                Informações Importantes
              </h4>
              <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
                <li>• Apenas transações de débito (saídas) serão importadas</li>
                <li>
                  • Categorias serão atribuídas automaticamente quando possível
                </li>
                <li>• Duplicatas serão ignoradas automaticamente</li>
                <li>• Todas as despesas serão criadas com status "Pendente"</li>
              </ul>
            </div>
          </div>
        );
      case 2:
        // PREVIEW/REVISÃO DAS DESPESAS
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <h4 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
                📋 Revisão das Despesas
              </h4>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                {previewData.length} despesa(s) encontrada(s) (apenas DEBIT).
                Revise antes de importar.
              </p>
            </div>

            {/* Tabela de Preview */}
            <div className="max-h-96 overflow-y-auto rounded-lg border border-light-border dark:border-dark-border">
              <table className="w-full text-sm">
                <thead className="card-theme sticky top-0 dark:bg-dark-surface">
                  <tr>
                    <th className="p-2 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === previewData.length}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedRows(previewData.map((_, idx) => idx));
                          } else {
                            setSelectedRows([]);
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="text-theme-primary dark:text-dark-text-primary p-2 text-left">
                      Data
                    </th>
                    <th className="text-theme-primary dark:text-dark-text-primary p-2 text-left">
                      Descrição
                    </th>
                    <th className="text-theme-primary dark:text-dark-text-primary p-2 text-right">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((transaction, idx) => (
                    <tr
                      key={idx}
                      className={`border-t border-light-border dark:border-dark-border ${selectedRows.includes(idx) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                    >
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(idx)}
                          onChange={() => {
                            if (selectedRows.includes(idx)) {
                              setSelectedRows(
                                selectedRows.filter(i => i !== idx)
                              );
                            } else {
                              setSelectedRows([...selectedRows, idx]);
                            }
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="text-theme-primary p-2 dark:text-gray-100">
                        {new Date(
                          transaction.transaction_date
                        ).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="text-theme-primary max-w-xs truncate p-2 dark:text-gray-100">
                        {transaction.description}
                      </td>
                      <td className="p-2 text-right font-semibold text-red-600 dark:text-red-400">
                        R$ {Number(transaction.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setPreviewData([]);
                  setSelectedRows([]);
                }}
                className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted hover:text-theme-primary px-4 py-2 text-sm dark:hover:text-gray-100"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={selectedRows.length === 0}
                className="text-dark-text-primary rounded-lg bg-blue-600 px-6 py-2 font-medium transition-colors hover:bg-blue-700 disabled:bg-gray-400 dark:bg-blue-700 dark:hover:bg-blue-800 dark:disabled:bg-gray-600"
              >
                Importar {selectedRows.length} despesa(s)
              </button>
            </div>
          </div>
        );
      case 3:
        // PROCESSAMENTO
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-theme-primary mb-2 text-lg font-semibold dark:text-gray-100">
                Importando Despesas
              </h3>
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                Aguarde enquanto cadastramos as despesas...
              </p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div
                className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${importResult?.sucesso > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
              >
                {importResult?.sucesso > 0 ? (
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                )}
              </div>
              <h3 className="text-theme-primary mb-2 text-lg font-semibold dark:text-gray-100">
                {importResult?.sucesso > 0
                  ? 'Importação Concluída!'
                  : 'Importação com Erros'}
              </h3>
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                {importResult?.sucesso > 0
                  ? 'As despesas foram importadas com sucesso'
                  : 'Ocorreram erros durante a importação'}
              </p>
            </div>

            {/* Resumo */}
            {importResult && (
              <div className="space-y-3">
                {/* Sucessos */}
                {importResult.sucesso > 0 && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-900 dark:text-green-100">
                        ✅ Despesas Importadas
                      </span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {importResult.sucesso}
                      </span>
                    </div>
                  </div>
                )}

                {/* Duplicatas */}
                {importResult.duplicatas > 0 && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                        ⚠️ Duplicatas Ignoradas
                      </span>
                      <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                        {importResult.duplicatas}
                      </span>
                    </div>
                  </div>
                )}

                {/* Erros */}
                {importResult.erros > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-red-900 dark:text-red-100">
                        ❌ Erros de Validação
                      </span>
                      <span className="text-lg font-bold text-red-600 dark:text-red-400">
                        {importResult.erros}
                      </span>
                    </div>
                  </div>
                )}

                {/* Total Processado */}
                <div className="rounded-lg border border-light-border bg-light-bg p-4 dark:border-dark-border dark:bg-dark-bg">
                  <div className="flex items-center justify-between">
                    <span className="text-theme-primary dark:text-dark-text-primary text-sm font-medium">
                      📊 Total Processado
                    </span>
                    <span className="text-theme-primary dark:text-dark-text-primary text-lg font-bold">
                      {importResult.total}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Detalhes dos Erros (se houver) */}
            {importResult?.errorsList && importResult.errorsList.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="text-theme-primary text-sm font-semibold dark:text-gray-100">
                  📋 Detalhes dos Erros:
                </h4>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
                  <div className="space-y-3">
                    {importResult.errorsList.map((error, idx) => (
                      <div
                        key={idx}
                        className="border-l-4 border-red-500 py-2 pl-3 text-sm"
                      >
                        <div className="flex items-start gap-2">
                          <span className="min-w-[60px] font-semibold text-red-700 dark:text-red-400">
                            Linha {error.line}:
                          </span>
                          <span className="text-red-900 dark:text-red-200">
                            {error.error}
                          </span>
                        </div>
                        {error.details && (
                          <div className="ml-[68px] mt-1 text-xs text-red-600 dark:text-red-400">
                            {error.details}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="card-theme max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl shadow-2xl dark:bg-dark-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-light-border p-6 dark:border-dark-border">
          <div>
            <h2 className="text-theme-primary text-xl font-bold dark:text-gray-100">
              Importar Despesas - OFX
            </h2>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-sm">
              {steps[currentStep - 1]?.title}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary transition-colors dark:hover:text-gray-200"
            disabled={isLoading && currentStep === 2}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="border-b border-light-border bg-light-bg px-6 py-4 dark:border-dark-border dark:bg-dark-bg dark:bg-dark-surface/50">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <React.Fragment key={step.id}>
                  <div className="flex items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${isActive ? 'bg-blue-600 text-white dark:bg-blue-500' : isCompleted ? 'bg-green-600 text-white dark:bg-green-500' : 'text-theme-secondary dark:text-dark-text-muted bg-light-surface/50 dark:bg-dark-surface/50'}`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon
                          className={`h-5 w-5 ${isActive && step.id === 2 ? 'animate-spin' : ''}`}
                        />
                      )}
                    </div>
                    <span
                      className={`ml-2 text-sm font-medium ${isActive || isCompleted ? 'text-theme-primary dark:text-dark-text-primary' : 'text-theme-secondary dark:text-dark-text-muted'}`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary mx-2 h-5 w-5" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-200px)] overflow-y-auto p-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-light-border bg-light-bg p-6 dark:border-dark-border dark:bg-dark-bg dark:bg-dark-surface/50">
          {currentStep === 3 && (
            <button
              onClick={handleClose}
              className="text-dark-text-primary rounded-lg bg-blue-600 px-6 py-2.5 font-medium transition-colors hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              Fechar
            </button>
          )}

          {currentStep === 1 && (
            <button
              onClick={handleClose}
              className="btn-theme-secondary rounded-lg px-6 py-2.5 font-medium transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default ImportExpensesFromOFXModal;
