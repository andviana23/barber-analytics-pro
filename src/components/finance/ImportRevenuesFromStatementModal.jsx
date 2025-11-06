import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Trash2,
  User,
  Package,
  DollarSign,
  Hash,
  Calendar,
  CreditCard,
  Users,
  Building2,
} from 'lucide-react';
import ImportRevenueFromStatementService from '../../services/importRevenueFromStatement';
import ImportReviewModal from '../modals/ImportReviewModal';
import { useToast } from '../../context/ToastContext';
import { PartiesService } from '../../services/partiesService';
import { ProfissionaisService } from '../../services/profissionaisService';
import paymentMethodsService from '../../services/paymentMethodsService';
import { bankAccountsService } from '../../services';

/**
 * Modal principal para importação de receitas a partir de extratos bancários
 *
 * Fluxo:
 * 1. Upload do arquivo Excel
 * 2. Processar e normalizar dados
 * 3. Identificar automaticamente profissional, cliente, forma de pagamento
 * 4. Exibir modal de revisão
 * 5. Inserir receitas aprovadas
 * 6. Mostrar relatório final
 */
const ImportRevenuesFromStatementModal = ({
  isOpen,
  onClose,
  onSuccess,
  unitId,
  userId,
}) => {
  const { addToast } = useToast();

  // Estados do fluxo
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Processing, 3: Review, 4: Complete
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [enrichedData, setEnrichedData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importReport, setImportReport] = useState(null);

  // Dados de referência
  const [professionals, setProfessionals] = useState([]);
  const [clients, setClients] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');

  // Estado do modal de revisão
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Novos estados para UX melhorada
  const [showColumnInfo, setShowColumnInfo] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [recordCount, setRecordCount] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Carregar profissionais, clientes, formas de pagamento e contas bancárias
  const loadReferenceData = useCallback(async () => {
    try {
      console.log('📥 Carregando dados de referência...');

      // Carregar profissionais
      const profsData = await ProfissionaisService.getProfissionais({ unitId });
      setProfessionals(profsData || []);
      console.log('✅ Profissionais:', profsData?.length || 0);

      // Carregar clientes
      const { data: clientsData } = await PartiesService.getParties({
        unitId,
        tipo: 'Cliente',
        isActive: true,
      });
      setClients(clientsData || []);
      console.log('✅ Clientes:', clientsData?.length || 0);

      // Carregar formas de pagamento
      const { data: pmData } = await paymentMethodsService.getPaymentMethods(
        unitId,
        false
      );
      setPaymentMethods(pmData || []);
      console.log('✅ Formas de pagamento:', pmData?.length || 0);

      // Carregar contas bancárias
      const banksData = await bankAccountsService.getBankAccounts(
        unitId,
        false
      );
      setBankAccounts(banksData || []);
      console.log('✅ Contas bancárias:', banksData?.length || 0);
    } catch (err) {
      console.error('❌ Erro ao carregar dados de referência:', err);
      addToast({
        type: 'error',
        title: 'Erro ao carregar dados',
        message:
          'Não foi possível carregar os dados necessários para importação.',
      });
    }
  }, [unitId, addToast]);

  // Carregar dados de referência quando abrir o modal
  useEffect(() => {
    if (isOpen && unitId) {
      loadReferenceData();
    }
  }, [isOpen, unitId, loadReferenceData]);

  // Resetar estado ao fechar
  const handleClose = () => {
    setCurrentStep(1);
    setFile(null);
    setProcessing(false);
    setEnrichedData([]);
    setErrors([]);
    setImportReport(null);
    setShowReviewModal(false);
    setSelectedBankAccount('');
    setSelectedAccount('');
    setFilePreview(null);
    setRecordCount(0);
    setUploadSuccess(false);
    setShowColumnInfo(false);
    onClose();
  };

  // Remover arquivo selecionado
  const handleRemoveFile = () => {
    setFile(null);
    setFilePreview(null);
    setRecordCount(0);
    setUploadSuccess(false);
    setErrors([]);
    // Limpar input file
    const fileInput = document.getElementById('file-upload');
    if (fileInput) fileInput.value = '';
  };

  // Handle file selection com preview
  const handleFileSelect = async event => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validar tipo de arquivo
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
      ];

      if (
        !validTypes.includes(selectedFile.type) &&
        !selectedFile.name.endsWith('.xlsx') &&
        !selectedFile.name.endsWith('.xls') &&
        !selectedFile.name.endsWith('.csv')
      ) {
        addToast({
          type: 'error',
          title: 'Arquivo inválido',
          message:
            'Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV.',
        });
        return;
      }

      setFile(selectedFile);
      setErrors([]);
      setUploadSuccess(false);

      // Gerar preview
      try {
        const { data, error } =
          await ImportRevenueFromStatementService.readFile(selectedFile);

        if (error || !data) {
          setFilePreview(null);
          setRecordCount(0);
          return;
        }

        // Pegar primeiras 3 linhas para preview
        const preview = data.slice(0, 3).map(row => ({
          profissional: row['Profissional'] || '-',
          valor: row['Valor'] || '-',
          cliente: row['Cliente'] || '-',
        }));

        setFilePreview(preview);
        setRecordCount(data.length);
        setUploadSuccess(true);

        // Feedback visual
        addToast({
          type: 'success',
          title: 'Arquivo carregado!',
          message: `${data.length} registros detectados`,
        });
      } catch (err) {
        console.error('Erro ao gerar preview:', err);
        setFilePreview(null);
        setRecordCount(0);
      }
    }
  };

  // Processar arquivo
  const handleProcessFile = async () => {
    if (!file) {
      addToast({
        type: 'error',
        title: 'Nenhum arquivo selecionado',
        message: 'Por favor, selecione um arquivo para processar.',
      });
      return;
    }

    if (!selectedBankAccount) {
      addToast({
        type: 'error',
        title: 'Conta bancária não selecionada',
        message: 'Por favor, selecione a conta bancária do extrato.',
      });
      return;
    }

    setProcessing(true);
    setCurrentStep(2);
    const startTime = Date.now();

    try {
      console.log('📁 Processando arquivo:', file.name);

      // 1️⃣ Ler arquivo Excel
      const { data: rawData, error: readError } =
        await ImportRevenueFromStatementService.readFile(file);

      if (readError || !rawData) {
        throw new Error(readError || 'Erro ao ler arquivo');
      }

      console.log('✅ Arquivo lido:', rawData.length, 'linhas');

      // 2️⃣ Validar cabeçalhos
      const { isValid, missing, headers } =
        ImportRevenueFromStatementService.validateHeaders(rawData);

      if (!isValid) {
        throw new Error(`Colunas obrigatórias faltando: ${missing.join(', ')}`);
      }

      console.log('✅ Cabeçalhos validados');

      // 3️⃣ Normalizar dados
      const selectedBank = bankAccounts.find(b => b.id === selectedBankAccount);
      const context = {
        unitId,
        userId,
        bankAccountId: selectedBankAccount,
        accountId: selectedAccount || null,
        bankName:
          selectedBank?.bank_name ||
          selectedBank?.name ||
          'Conta não identificada',
      };

      const { normalized, errors: normErrors } =
        ImportRevenueFromStatementService.normalizeData(
          rawData,
          headers,
          context
        );

      if (normErrors.length > 0) {
        setErrors(normErrors);
        console.warn('⚠️ Erros de normalização:', normErrors.length);
        console.warn('📋 Detalhes dos erros:', normErrors);
      }

      if (normalized.length === 0) {
        console.error('❌ Nenhuma receita normalizada. Erros:', normErrors);
        const firstError = normErrors[0];
        throw new Error(
          `Nenhuma receita válida encontrada. ${normErrors.length} erros: Linha ${firstError?.line} - ${firstError?.error} (${firstError?.field}: ${firstError?.value})`
        );
      }

      console.log('✅ Dados normalizados:', normalized.length, 'receitas');

      // 4️⃣ Enriquecer dados (identificar profissional, cliente, forma de pagamento)
      const enriched = await ImportRevenueFromStatementService.enrichData(
        normalized,
        {
          professionals,
          clients,
          paymentMethods,
          unitId,
        }
      );

      console.log('✅ Dados enriquecidos');

      setEnrichedData(enriched);
      setCurrentStep(3);
      setShowReviewModal(true);
    } catch (err) {
      console.error('❌ Erro ao processar arquivo:', err);

      addToast({
        type: 'error',
        title: 'Erro ao processar arquivo',
        message: err.message || 'Não foi possível processar o arquivo.',
      });

      setCurrentStep(1);
    } finally {
      setProcessing(false);
    }
  };

  // Confirmar importação após revisão
  const handleConfirmImport = async approvedRecords => {
    setProcessing(true);
    const startTime = Date.now();

    try {
      console.log(
        '💾 Importando',
        approvedRecords.length,
        'receitas aprovadas...'
      );
      console.log('📋 Primeira receita aprovada (sample):', approvedRecords[0]);
      console.log('🏢 Context:', { unitId, userId });

      const results =
        await ImportRevenueFromStatementService.insertApprovedRecords(
          approvedRecords,
          { unitId, userId }
        );

      console.log('✅ Importação concluída:', results);
      console.log('📊 Detalhes:', {
        sucesso: results.success,
        duplicadas: results.duplicates,
        erros: results.errors?.length || 0,
        errosDetalhes: results.errors,
      });

      // Gerar relatório final
      const report = ImportRevenueFromStatementService.generateReport(
        results,
        enrichedData,
        startTime
      );

      setImportReport(report);
      setCurrentStep(4);
      setShowReviewModal(false);

      addToast({
        type: 'success',
        title: 'Importação concluída!',
        message: `${results.success} receitas importadas com sucesso.`,
      });

      // Chamar callback de sucesso após 2 segundos
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (err) {
      console.error('❌ Erro na importação:', err);

      addToast({
        type: 'error',
        title: 'Erro na importação',
        message: err.message || 'Não foi possível importar as receitas.',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
        {/* Modal Container */}
        <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-dark-border bg-dark-surface shadow-2xl">
          {/* === HEADER === */}
          <div className="flex items-center justify-between border-b border-dark-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-dark-primary">
                  Importar Extrato Bancário
                </h2>
                <p className="mt-0.5 text-[11px] text-text-dark-secondary opacity-70">
                  Transforme seu extrato em receitas automaticamente
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={processing}
              className="rounded-lg p-1.5 transition-all hover:bg-dark-bg disabled:opacity-50"
              aria-label="Fechar"
            >
              <X className="h-4 w-4 text-text-dark-secondary transition-colors hover:text-text-dark-primary" />
            </button>
          </div>

          {/* === CONTENT === */}
          <div className="space-y-4 p-5">
            {/* Step 1: Upload e Configuração */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {/* === ZONA 1: CONFIGURAÇÃO (Card Único) === */}
                <div className="space-y-4 rounded-xl border border-dark-border bg-dark-bg p-4">
                  {/* Conta bancária */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-text-dark-primary">
                      <Building2 className="h-4 w-4 text-primary" />
                      Conta de Origem
                    </label>
                    <div className="relative">
                      <select
                        value={selectedBankAccount}
                        onChange={e => setSelectedBankAccount(e.target.value)}
                        className="w-full cursor-pointer appearance-none rounded-lg border border-dark-border bg-dark-surface py-2.5 pl-3 pr-8 text-sm text-text-dark-primary outline-none transition-all hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="">Selecione a conta bancária</option>
                        {bankAccounts.map(bank => (
                          <option key={bank.id} value={bank.id}>
                            {bank.bank_name} - {bank.name} (
                            {bank.account_number})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dark-secondary" />
                    </div>
                  </div>

                  {/* Upload de arquivo */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-text-dark-primary">
                      <FileSpreadsheet className="h-4 w-4 text-primary" />
                      Arquivo do Extrato
                    </label>

                    {!file ? (
                      /* Estado: Sem arquivo */
                      <div
                        className="group cursor-pointer rounded-lg border-2 border-dashed border-dark-border p-6 text-center transition-all hover:border-primary hover:bg-primary/5"
                        onClick={() =>
                          document.getElementById('file-upload').click()
                        }
                      >
                        <input
                          id="file-upload"
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={!selectedBankAccount}
                        />
                        <Upload className="mx-auto mb-2.5 h-9 w-9 text-text-dark-secondary transition-colors group-hover:text-primary" />
                        <p className="mb-1 text-sm font-medium text-text-dark-primary">
                          {selectedBankAccount
                            ? 'Arraste ou clique aqui'
                            : 'Selecione uma conta primeiro'}
                        </p>
                        <p className="text-[11px] text-text-dark-secondary">
                          .xlsx .xls .csv
                        </p>
                      </div>
                    ) : (
                      /* Estado: Com arquivo + Preview */
                      <div className="space-y-3 rounded-lg border border-dark-border bg-dark-surface p-3">
                        {/* Info do arquivo */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-1 items-start gap-2.5">
                            <div
                              className={`rounded-lg p-1.5 ${uploadSuccess ? 'bg-feedback-dark-success/10' : 'bg-primary/10'}`}
                            >
                              {uploadSuccess ? (
                                <CheckCircle className="h-4 w-4 text-feedback-dark-success" />
                              ) : (
                                <FileSpreadsheet className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-text-dark-primary">
                                {file.name}
                              </p>
                              <p className="mt-0.5 text-[11px] text-text-dark-secondary">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleRemoveFile}
                            className="group rounded-lg p-1.5 transition-colors hover:bg-dark-bg"
                            title="Remover arquivo"
                          >
                            <Trash2 className="h-4 w-4 text-text-dark-secondary transition-colors group-hover:text-feedback-dark-error" />
                          </button>
                        </div>

                        {/* Preview das primeiras 3 linhas */}
                        {filePreview && filePreview.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-dark-secondary">
                                Preview
                              </p>
                              <p className="text-[11px] font-semibold text-primary">
                                {recordCount} registros
                              </p>
                            </div>
                            <div className="overflow-hidden rounded-lg border border-dark-border bg-dark-bg">
                              <table className="w-full text-[11px]">
                                <thead className="bg-dark-border/30">
                                  <tr>
                                    <th className="px-2 py-1.5 text-left font-semibold text-text-dark-secondary">
                                      Profissional
                                    </th>
                                    <th className="px-2 py-1.5 text-right font-semibold text-text-dark-secondary">
                                      Valor
                                    </th>
                                    <th className="px-2 py-1.5 text-left font-semibold text-text-dark-secondary">
                                      Cliente
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filePreview.map((row, idx) => (
                                    <tr
                                      key={idx}
                                      className="border-t border-dark-border"
                                    >
                                      <td className="px-2 py-1.5 text-text-dark-primary">
                                        {row.profissional}
                                      </td>
                                      <td className="px-2 py-1.5 text-right font-medium text-feedback-dark-success">
                                        {row.valor}
                                      </td>
                                      <td className="px-2 py-1.5 text-text-dark-primary">
                                        {row.cliente}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* === ZONA 2: INFORMAÇÕES COLAPSÁVEIS === */}
                <div className="overflow-hidden rounded-lg border border-dark-border">
                  <button
                    onClick={() => setShowColumnInfo(!showColumnInfo)}
                    className="group flex w-full items-center justify-between bg-dark-bg px-4 py-3 transition-colors hover:bg-dark-surface"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-text-dark-primary">
                        Colunas obrigatórias
                      </span>
                      <span className="rounded bg-dark-border px-1.5 py-0.5 text-[10px] text-text-dark-secondary">
                        8 campos
                      </span>
                    </div>
                    {showColumnInfo ? (
                      <ChevronUp className="h-4 w-4 text-text-dark-secondary transition-colors group-hover:text-primary" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-dark-secondary transition-colors group-hover:text-primary" />
                    )}
                  </button>

                  {/* Conteúdo colapsável */}
                  <div
                    className={`transition-all duration-300 ease-in-out ${showColumnInfo ? 'max-h-96 opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}
                  >
                    <div className="border-t border-dark-border bg-dark-surface px-4 py-3">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[11px]">
                        <div className="flex items-start gap-2">
                          <User className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                          <div>
                            <p className="font-semibold text-text-dark-primary">
                              Profissional
                            </p>
                            <p className="text-text-dark-secondary">
                              Nome do profissional
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Package className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                          <div>
                            <p className="font-semibold text-text-dark-primary">
                              Item
                            </p>
                            <p className="text-text-dark-secondary">
                              Produto ou serviço
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <DollarSign className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                          <div>
                            <p className="font-semibold text-text-dark-primary">
                              Valor Unitário
                            </p>
                            <p className="text-text-dark-secondary">
                              Preço unitário
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <DollarSign className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                          <div>
                            <p className="font-semibold text-text-dark-primary">
                              Valor
                            </p>
                            <p className="text-text-dark-secondary">
                              Valor total
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Hash className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                          <div>
                            <p className="font-semibold text-text-dark-primary">
                              Qtd
                            </p>
                            <p className="text-text-dark-secondary">
                              Quantidade
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Calendar className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                          <div>
                            <p className="font-semibold text-text-dark-primary">
                              Data
                            </p>
                            <p className="text-text-dark-secondary">
                              Data do lançamento
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CreditCard className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                          <div>
                            <p className="font-semibold text-text-dark-primary">
                              Pagamento
                            </p>
                            <p className="text-text-dark-secondary">
                              Forma de pagamento
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Users className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                          <div>
                            <p className="font-semibold text-text-dark-primary">
                              Cliente
                            </p>
                            <p className="text-text-dark-secondary">
                              Nome do cliente
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Erros */}
                {errors.length > 0 && (
                  <div className="rounded-lg border border-feedback-dark-error/30 bg-feedback-dark-error/10 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-feedback-dark-error" />
                      <h4 className="text-xs font-bold text-feedback-dark-error">
                        {errors.length} Erros Encontrados
                      </h4>
                    </div>
                    <ul className="custom-scrollbar max-h-24 space-y-1.5 overflow-y-auto text-[11px] text-text-dark-primary">
                      {errors.slice(0, 5).map((err, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-1.5 rounded bg-dark-surface p-1.5"
                        >
                          <span className="font-bold text-feedback-dark-error">
                            L{err.line}:
                          </span>
                          <span className="flex-1 text-text-dark-secondary">
                            {err.error}
                          </span>
                        </li>
                      ))}
                      {errors.length > 5 && (
                        <li className="pt-1 text-center text-text-dark-secondary">
                          +{errors.length - 5} erros adicionais
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Processing */}
            {currentStep === 2 && (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="mb-4 h-14 w-14 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="mb-1 text-base font-bold text-text-dark-primary">
                  Processando extrato...
                </p>
                <p className="text-xs text-text-dark-secondary">
                  Isso pode levar alguns instantes
                </p>
              </div>
            )}

            {/* Step 4: Complete */}
            {currentStep === 4 && importReport && (
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-center">
                  <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-feedback-dark-success/20">
                    <CheckCircle className="h-9 w-9 text-feedback-dark-success" />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="mb-1 text-lg font-bold text-text-dark-primary">
                    Importação Concluída!
                  </h3>
                  <p className="text-xs text-text-dark-secondary">
                    As receitas foram importadas com sucesso ✨
                  </p>
                </div>

                {/* Report */}
                <div className="space-y-2 rounded-lg border border-dark-border bg-dark-surface p-3 text-sm">
                  <div className="flex items-center justify-between border-b border-dark-border py-1">
                    <span className="text-xs font-medium text-text-dark-secondary">
                      Total lidos:
                    </span>
                    <span className="font-bold text-text-dark-primary">
                      {importReport.total_lidos}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-dark-border py-1">
                    <span className="text-xs font-medium text-text-dark-secondary">
                      Aprovados:
                    </span>
                    <span className="font-bold text-feedback-dark-success">
                      {importReport.total_aprovados}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-dark-border py-1">
                    <span className="text-xs font-medium text-text-dark-secondary">
                      Duplicatas ignoradas:
                    </span>
                    <span className="font-bold text-feedback-dark-warning">
                      {importReport.duplicatas_ignoradas}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-dark-border py-1">
                    <span className="text-xs font-medium text-text-dark-secondary">
                      Clientes criados:
                    </span>
                    <span className="font-bold text-primary">
                      {importReport.clientes_criados}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs font-medium text-text-dark-secondary">
                      Tempo de execução:
                    </span>
                    <span className="font-bold text-text-dark-primary">
                      {importReport.tempo_execucao}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-dark-bg shadow-lg shadow-primary/30 transition-all hover:bg-primary-hover"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>

          {/* === FOOTER FIXO COM STATUS === */}
          {currentStep === 1 && (
            <div className="border-t border-dark-border bg-dark-surface px-5 py-4">
              {/* Status */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-text-dark-primary">
                    {recordCount > 0
                      ? `${recordCount} registros detectados`
                      : 'Aguardando arquivo'}
                  </span>
                </div>
                {selectedBankAccount && bankAccounts.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-text-dark-secondary">
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="max-w-[200px] truncate">
                      {bankAccounts.find(b => b.id === selectedBankAccount)
                        ?.bank_name || 'Conta selecionada'}
                    </span>
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  disabled={processing}
                  className="rounded-lg border border-dark-border px-4 py-2.5 text-sm font-semibold text-text-dark-primary transition-all hover:bg-dark-bg disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleProcessFile}
                  disabled={
                    !file ||
                    !selectedBankAccount ||
                    processing ||
                    recordCount === 0
                  }
                  className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-dark-bg shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  {processing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-dark-bg border-t-transparent" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <span>Processar Extrato</span>
                      <svg
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </>
                  )}
                  {!processing && file && recordCount > 0 && (
                    <div className="absolute inset-0 bg-primary-hover opacity-0 transition-opacity group-hover:opacity-10" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <ImportReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setCurrentStep(1);
          }}
          records={enrichedData}
          onConfirm={handleConfirmImport}
          loading={processing}
          unitId={unitId}
        />
      )}
    </>
  );
};

export default ImportRevenuesFromStatementModal;
