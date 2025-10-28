import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import PropTypes from 'prop-types';
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Eye,
  ArrowRight,
  RefreshCw,
  Tag,
  DollarSign,
  Calendar,
  Building2,
} from 'lucide-react';
import { format } from 'date-fns';

import { CategoryHierarchicalDropdown } from '../molecules';
import { useCategoryTree } from '../hooks/useCategories';
import { useUnit } from '../context/UnitContext';
import ImportExpensesFromOFXService from '../services/importExpensesFromOFX';
import { PartiesService } from '../services/partiesService';

/**
 * Modal para importação de despesas via arquivo OFX
 *
 * Fluxo:
 * 1. Upload OFX + Seleção de Conta
 * 2. Seleção Manual de Categorias (com hierarquia)
 * 3. Preview e Confirmação
 * 4. Finalização (marca todas como Paid)
 *
 * Princípios:
 * - Clean Architecture
 * - Atomic Design
 * - Usabilidade (Steve Krug, Don Norman)
 * - Clean Code (Robert C. Martin)
 */
const ImportExpensesFromOFXModal = ({
  isOpen = false,
  onClose = () => {},
  onSuccess = () => {},
  availableAccounts = [],
  defaultAccountId = null,
  unitId = null,
}) => {
  // ========================================
  // ESTADO DO MODAL
  // ========================================
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [file, setFile] = useState(null);
  const [parseResult, setParseResult] = useState(null); // Resultado do parsing OFX
  const [normalizedData, setNormalizedData] = useState([]); // Dados normalizados
  const [enrichedData, setEnrichedData] = useState([]); // Dados enriquecidos
  const [userCategorySelections, setUserCategorySelections] = useState({}); // { index: categoryId }
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Referências
  const fileInputRef = useRef(null);

  // ========================================
  // HOOKS EXTERNOS
  // ========================================
  const { selectedUnit } = useUnit();

  // Usar unitId do selectedUnit se não for passado por prop
  const effectiveUnitId = unitId || selectedUnit?.id;

  const {
    data: categoriesTree,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategoryTree(effectiveUnitId, 'Expense');

  // Filtrar contas bancárias pela unidade selecionada
  const filteredAccounts = useMemo(() => {
    if (!effectiveUnitId || !availableAccounts) return availableAccounts;
    return availableAccounts.filter(
      account => account.unit_id === effectiveUnitId
    );
  }, [availableAccounts, effectiveUnitId]);

  // ========================================
  // EFFECTS
  // ========================================
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setValidationErrors([]);

    if (defaultAccountId) {
      setSelectedAccount(defaultAccountId);
    }
  }, [isOpen, defaultAccountId]);

  // ========================================
  // STEP 1: UPLOAD E PARSING DO OFX
  // ========================================

  /**
   * Handler de upload de arquivo OFX
   */
  const handleFileUpload = useCallback(
    async selectedFile => {
      if (!selectedFile) {
        setValidationErrors(['Nenhum arquivo selecionado']);
        return;
      }

      // Validar extensão
      if (!selectedFile.name.toLowerCase().endsWith('.ofx')) {
        setValidationErrors(['Apenas arquivos .ofx são suportados']);
        return;
      }

      // Validar tamanho (máx 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setValidationErrors(['Arquivo muito grande. Tamanho máximo: 10MB']);
        return;
      }

      setFile(selectedFile);
      setValidationErrors([]);

      try {
        console.log('📄 Iniciando parsing do arquivo OFX:', selectedFile.name);

        // 1️⃣ Ler e parsear OFX
        const { data, error } =
          await ImportExpensesFromOFXService.readFile(selectedFile);

        if (error || !data) {
          setValidationErrors([error || 'Erro ao ler arquivo OFX']);
          return;
        }

        setParseResult(data);
        console.log('✅ Parsing concluído:', data.length, 'transações');

        // 2️⃣ Validar e filtrar DEBIT
        const validationResult =
          ImportExpensesFromOFXService.validateTransactions(data);

        if (!validationResult.isValid) {
          setValidationErrors(validationResult.missing);
          return;
        }

        console.log(
          '✅ Validação concluída:',
          validationResult.transactions.length,
          'despesas DEBIT'
        );

        // 3️⃣ Normalizar dados
        const context = {
          unitId: effectiveUnitId,
          userId: null, // Será preenchido pelo backend via RLS
          bankAccountId: selectedAccount,
        };

        const { normalized, errors } =
          ImportExpensesFromOFXService.normalizeData(
            validationResult.transactions,
            context
          );

        if (errors.length > 0) {
          console.warn('⚠️ Erros durante normalização:', errors);
        }

        setNormalizedData(normalized);
        console.log(
          '✅ Normalização concluída:',
          normalized.length,
          'registros'
        );

        // Avançar para step 2
        setCurrentStep(2);
      } catch (err) {
        console.error('❌ Erro no parsing do OFX:', err);
        setValidationErrors([err.message || 'Erro ao processar arquivo OFX']);
      }
    },
    [selectedAccount, unitId]
  );

  // ========================================
  // STEP 2: SELEÇÃO DE CATEGORIAS
  // ========================================

  /**
   * Handler de mudança de categoria para uma transação específica
   */
  const handleCategoryChange = useCallback((index, categoryId) => {
    setUserCategorySelections(prev => ({
      ...prev,
      [index]: categoryId,
    }));
  }, []);

  /**
   * Handler para prosseguir para Step 3 (Preview)
   */
  const handleProceedToPreview = useCallback(async () => {
    console.log('🔄 Aplicando categorias selecionadas...');

    // Aplicar categorias manuais
    let processedData =
      ImportExpensesFromOFXService.applyUserCategorySelections(
        normalizedData,
        userCategorySelections
      );

    // Buscar fornecedores e categorias para enriquecimento
    const { data: suppliers } = await PartiesService.getParties({
      unit_id: effectiveUnitId,
      tipo: 'Fornecedor',
    });

    const referenceData = {
      categories: categoriesTree,
      suppliers: suppliers || [],
      unitId: effectiveUnitId,
    };

    // Enriquecer dados (auto-criar suppliers se necessário)
    processedData = await ImportExpensesFromOFXService.enrichData(
      processedData,
      referenceData
    );

    // Marcar todas como Paid
    processedData = ImportExpensesFromOFXService.markAllAsPaid(processedData);

    setEnrichedData(processedData);
    console.log('✅ Dados enriquecidos:', processedData.length, 'registros');

    setCurrentStep(3);
  }, [normalizedData, userCategorySelections, unitId, categoriesTree]);

  // ========================================
  // STEP 3: PREVIEW E CONFIRMAÇÃO
  // ========================================

  /**
   * Estatísticas do preview
   */
  const previewStats = useMemo(() => {
    if (enrichedData.length === 0) return null;

    const withCategory = enrichedData.filter(r => r.expense.category_id).length;
    const withoutCategory = enrichedData.length - withCategory;
    const newSuppliers = enrichedData.filter(r => r.isNewSupplier).length;
    const totalValue = enrichedData.reduce(
      (sum, r) => sum + r.expense.value,
      0
    );

    return {
      total: enrichedData.length,
      withCategory,
      withoutCategory,
      newSuppliers,
      totalValue,
    };
  }, [enrichedData]);

  /**
   * Handler de confirmação final
   */
  const handleConfirmImport = useCallback(async () => {
    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      console.log('💾 Iniciando importação final...');

      const startTime = Date.now();

      // Inserir no banco
      const results = await ImportExpensesFromOFXService.insertApprovedRecords(
        enrichedData,
        { unitId: effectiveUnitId }
      );

      // Gerar relatório
      const report = ImportExpensesFromOFXService.generateReport(
        results,
        enrichedData,
        startTime
      );

      console.log('✅ Importação concluída:', report);

      if (results.errors && results.errors.length > 0) {
        setValidationErrors(
          results.errors.map(err => `Linha ${err.line}: ${err.error}`)
        );
        return;
      }

      // Chamar onSuccess
      if (typeof onSuccess === 'function') {
        await onSuccess(report);
      }

      // Reset e fechar
      resetModal();
      onClose();
    } catch (err) {
      console.error('❌ Erro na importação:', err);
      setValidationErrors([err.message || 'Erro ao importar despesas']);
    } finally {
      setIsSubmitting(false);
    }
  }, [enrichedData, unitId, onSuccess, onClose]);

  // ========================================
  // UTILITÁRIOS
  // ========================================

  /**
   * Resetar modal para estado inicial
   */
  const resetModal = useCallback(() => {
    setCurrentStep(1);
    setSelectedAccount('');
    setFile(null);
    setParseResult(null);
    setNormalizedData([]);
    setEnrichedData([]);
    setUserCategorySelections({});
    setValidationErrors([]);
    setIsSubmitting(false);
  }, []);

  /**
   * Handler de fechamento do modal
   */
  const handleClose = useCallback(() => {
    resetModal();
    onClose();
  }, [resetModal, onClose]);

  /**
   * Obter nome da categoria pelo ID
   */
  const getCategoryName = useCallback(
    categoryId => {
      if (!categoryId || !categoriesTree) return 'Sem categoria';

      for (const parent of categoriesTree) {
        if (parent.id === categoryId) return parent.name;
        if (parent.children) {
          const child = parent.children.find(c => c.id === categoryId);
          if (child) return `${parent.name} > ${child.name}`;
        }
      }

      return 'Categoria desconhecida';
    },
    [categoriesTree]
  );

  if (!isOpen) return null;

  // ========================================
  // RENDERIZAÇÃO
  // ========================================

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header - Compacto */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Upload className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Importar Despesas (OFX)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Passo {currentStep} de 3 -{' '}
                {currentStep === 1
                  ? 'Upload'
                  : currentStep === 2
                    ? 'Categorias'
                    : 'Preview'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar - Compacto */}
        <div className="px-6 py-2.5 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-center gap-8">
            {[
              { step: 1, title: 'Upload' },
              { step: 2, title: 'Categorias' },
              { step: 3, title: 'Preview' },
            ].map(({ step, title }) => (
              <div
                key={step}
                className={`flex items-center gap-2 ${
                  currentStep >= step
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-5 h-5 rounded-full border-2 ${
                    currentStep >= step
                      ? 'border-purple-600 bg-purple-600 dark:border-purple-400 dark:bg-purple-400 text-white'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {currentStep > step ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <span className="text-xs font-medium">{step}</span>
                  )}
                </div>
                <span className="font-medium text-xs">{title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* STEP 1: Upload OFX */}
          {currentStep === 1 && (
            <div className="p-6 space-y-4">
              {/* Info da Unidade Selecionada */}
              {selectedUnit && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Unidade:</strong> {selectedUnit.name}
                  </span>
                </div>
              )}

              {/* Seleção de Conta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Conta Bancária *
                </label>
                <select
                  value={selectedAccount}
                  onChange={e => setSelectedAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={!effectiveUnitId}
                >
                  <option value="">
                    {effectiveUnitId
                      ? 'Selecionar conta...'
                      : 'Selecione uma unidade primeiro'}
                  </option>
                  {filteredAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.nome || account.bank_name} -{' '}
                      {account.banco || account.account_number}
                    </option>
                  ))}
                </select>
                {filteredAccounts.length === 0 && effectiveUnitId && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    Nenhuma conta cadastrada nesta unidade
                  </p>
                )}
              </div>

              {/* Upload Area - Compacto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Arquivo OFX *
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-purple-400 dark:hover:border-purple-500 cursor-pointer transition-colors bg-gray-50 dark:bg-gray-900"
                >
                  <Upload className="w-10 h-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {file ? file.name : 'Clique para selecionar arquivo'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Apenas arquivos .ofx • Máx 10MB
                    </p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ofx"
                  onChange={e => {
                    const selectedFile = e.target.files[0];
                    if (selectedFile) {
                      handleFileUpload(selectedFile);
                    }
                  }}
                  className="hidden"
                  disabled={!selectedAccount}
                />
              </div>

              {/* Info Box - Compacto */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-purple-900 dark:text-purple-300 mb-2">
                  Como funciona?
                </h4>
                <ul className="space-y-1.5 text-xs text-purple-700 dark:text-purple-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>Importa apenas transações de débito (despesas)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>
                      Detecta automaticamente categorias e fornecedores
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>Permite ajuste manual de categorias</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>
                      Marca todas as despesas como pagas automaticamente
                    </span>
                  </li>
                </ul>
              </div>

              {!selectedAccount && effectiveUnitId && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    Selecione uma conta bancária para começar
                  </p>
                </div>
              )}

              {!effectiveUnitId && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    Selecione uma unidade no menu superior para começar
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Seleção de Categorias */}
          {currentStep === 2 && normalizedData.length > 0 && (
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {normalizedData.length} despesas encontradas
                  </span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Revise e ajuste as categorias detectadas automaticamente
                </p>
              </div>

              {/* Tabela de Transações - Compacta */}
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Data
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Descrição
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Valor
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Categoria
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {normalizedData.map((record, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          {record.expense.date}
                        </td>
                        <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-100">
                          <div
                            className="max-w-xs truncate"
                            title={record.expense.description}
                          >
                            {record.expense.description}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-xs text-right">
                          <span className="text-red-600 dark:text-red-400 font-medium whitespace-nowrap">
                            R${' '}
                            {record.expense.value.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <CategoryHierarchicalDropdown
                            categories={categoriesTree}
                            value={
                              userCategorySelections[index] ||
                              record.expense.category_id ||
                              ''
                            }
                            onChange={categoryId =>
                              handleCategoryChange(index, categoryId)
                            }
                            placeholder="Selecionar..."
                            showIcon={false}
                            className="text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {categoriesLoading && (
                <div className="text-center py-4">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400 dark:text-gray-500 mx-auto" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Carregando categorias...
                  </p>
                </div>
              )}

              {categoriesError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Erro ao carregar categorias: {categoriesError}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Preview e Confirmação */}
          {currentStep === 3 && enrichedData.length > 0 && previewStats && (
            <div className="p-6 space-y-4">
              {/* Resumo - Compacto */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">
                  Resumo da Importação
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-green-700 dark:text-green-400 font-medium">
                      Total de despesas:
                    </span>
                    <span className="ml-2 text-green-900 dark:text-green-200 font-bold">
                      {previewStats.total}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-700 dark:text-green-400 font-medium">
                      Com categoria:
                    </span>
                    <span className="ml-2 text-green-900 dark:text-green-200 font-bold">
                      {previewStats.withCategory}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-700 dark:text-green-400 font-medium">
                      Novos fornecedores:
                    </span>
                    <span className="ml-2 text-green-900 dark:text-green-200 font-bold">
                      {previewStats.newSuppliers}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-700 dark:text-green-400 font-medium">
                      Valor total:
                    </span>
                    <span className="ml-2 text-green-900 dark:text-green-200 font-bold">
                      R${' '}
                      {previewStats.totalValue.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview Table - Compacta */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Preview (Primeiras 10 linhas)
                </h4>
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Data
                        </th>
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Descrição
                        </th>
                        <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                          Valor
                        </th>
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Categoria
                        </th>
                        <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {enrichedData.slice(0, 10).map((record, index) => (
                        <tr key={index}>
                          <td className="px-2 py-1.5 text-xs text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {record.expense.date}
                          </td>
                          <td className="px-2 py-1.5 text-xs text-gray-900 dark:text-gray-100">
                            <div
                              className="max-w-xs truncate"
                              title={record.expense.description}
                            >
                              {record.expense.description}
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-xs text-right">
                            <span className="text-red-600 dark:text-red-400 font-medium whitespace-nowrap">
                              R${' '}
                              {record.expense.value.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-xs text-gray-900 dark:text-gray-100">
                            <div
                              className="max-w-xs truncate"
                              title={getCategoryName(
                                record.expense.category_id
                              )}
                            >
                              {getCategoryName(record.expense.category_id)}
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                              Paid
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {enrichedData.length > 10 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    ... e mais {enrichedData.length - 10} despesas
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-300">
                  Problemas encontrados:
                </h4>
                <ul className="mt-1 text-sm text-red-700 dark:text-red-400 list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Footer - Compacto */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            {file && (
              <span className="truncate max-w-xs">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Voltar
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>

            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleProceedToPreview}
                className="px-4 py-1.5 text-sm bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex items-center gap-2"
              >
                Gerar Preview
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isSubmitting}
                className="px-4 py-1.5 text-sm bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Confirmar
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ImportExpensesFromOFXModal.propTypes = {
  /** Se o modal está aberto */
  isOpen: PropTypes.bool,
  /** Função chamada ao fechar o modal */
  onClose: PropTypes.func,
  /** Callback executado quando a importação conclui com sucesso */
  onSuccess: PropTypes.func,
  /** Contas bancárias disponíveis */
  availableAccounts: PropTypes.arrayOf(PropTypes.object),
  /** ID padrão da conta bancária selecionada */
  defaultAccountId: PropTypes.string,
  /** ID da unidade */
  unitId: PropTypes.string,
};

export default ImportExpensesFromOFXModal;
