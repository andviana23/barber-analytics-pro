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
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        {/* Modal Container */}
        <div className="bg-dark-surface rounded-2xl shadow-2xl w-full max-w-[520px] overflow-hidden border border-dark-border">
          {/* === HEADER === */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-dark-primary">
                  Importar Extrato Bancário
                </h2>
                <p className="text-[11px] text-text-dark-secondary mt-0.5 opacity-70">
                  Transforme seu extrato em receitas automaticamente
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={processing}
              className="p-1.5 hover:bg-dark-bg rounded-lg transition-all disabled:opacity-50"
              aria-label="Fechar"
            >
              <X className="w-4 h-4 text-text-dark-secondary hover:text-text-dark-primary transition-colors" />
            </button>
          </div>

          {/* === CONTENT === */}
          <div className="p-5 space-y-4">
            {/* Step 1: Upload e Configuração */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {/* === ZONA 1: CONFIGURAÇÃO (Card Único) === */}
                <div className="bg-dark-bg rounded-xl p-4 border border-dark-border space-y-4">
                  {/* Conta bancária */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-text-dark-primary mb-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      Conta de Origem
                    </label>
                    <div className="relative">
                      <select
                        value={selectedBankAccount}
                        onChange={e => setSelectedBankAccount(e.target.value)}
                        className="w-full pl-3 pr-8 py-2.5 text-sm border border-dark-border rounded-lg bg-dark-surface text-text-dark-primary focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none appearance-none cursor-pointer hover:border-primary/50"
                      >
                        <option value="">Selecione a conta bancária</option>
                        {bankAccounts.map(bank => (
                          <option key={bank.id} value={bank.id}>
                            {bank.bank_name} - {bank.name} (
                            {bank.account_number})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-text-dark-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Upload de arquivo */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-text-dark-primary mb-2">
                      <FileSpreadsheet className="w-4 h-4 text-primary" />
                      Arquivo do Extrato
                    </label>

                    {!file ? (
                      /* Estado: Sem arquivo */
                      <div
                        className="border-2 border-dashed border-dark-border rounded-lg p-6 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
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
                        <Upload className="w-9 h-9 text-text-dark-secondary group-hover:text-primary mx-auto mb-2.5 transition-colors" />
                        <p className="text-sm font-medium text-text-dark-primary mb-1">
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
                      <div className="border border-dark-border rounded-lg p-3 bg-dark-surface space-y-3">
                        {/* Info do arquivo */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <div
                              className={`p-1.5 rounded-lg ${uploadSuccess ? 'bg-feedback-dark-success/10' : 'bg-primary/10'}`}
                            >
                              {uploadSuccess ? (
                                <CheckCircle className="w-4 h-4 text-feedback-dark-success" />
                              ) : (
                                <FileSpreadsheet className="w-4 h-4 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-text-dark-primary truncate">
                                {file.name}
                              </p>
                              <p className="text-[11px] text-text-dark-secondary mt-0.5">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleRemoveFile}
                            className="p-1.5 hover:bg-dark-bg rounded-lg transition-colors group"
                            title="Remover arquivo"
                          >
                            <Trash2 className="w-4 h-4 text-text-dark-secondary group-hover:text-feedback-dark-error transition-colors" />
                          </button>
                        </div>

                        {/* Preview das primeiras 3 linhas */}
                        {filePreview && filePreview.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-semibold text-text-dark-secondary uppercase tracking-wide">
                                Preview
                              </p>
                              <p className="text-[11px] text-primary font-semibold">
                                {recordCount} registros
                              </p>
                            </div>
                            <div className="bg-dark-bg rounded-lg overflow-hidden border border-dark-border">
                              <table className="w-full text-[11px]">
                                <thead className="bg-dark-border/30">
                                  <tr>
                                    <th className="px-2 py-1.5 text-left text-text-dark-secondary font-semibold">
                                      Profissional
                                    </th>
                                    <th className="px-2 py-1.5 text-right text-text-dark-secondary font-semibold">
                                      Valor
                                    </th>
                                    <th className="px-2 py-1.5 text-left text-text-dark-secondary font-semibold">
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
                                      <td className="px-2 py-1.5 text-right text-feedback-dark-success font-medium">
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
                <div className="border border-dark-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowColumnInfo(!showColumnInfo)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-dark-bg hover:bg-dark-surface transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-text-dark-primary">
                        Colunas obrigatórias
                      </span>
                      <span className="text-[10px] text-text-dark-secondary bg-dark-border px-1.5 py-0.5 rounded">
                        8 campos
                      </span>
                    </div>
                    {showColumnInfo ? (
                      <ChevronUp className="w-4 h-4 text-text-dark-secondary group-hover:text-primary transition-colors" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-dark-secondary group-hover:text-primary transition-colors" />
                    )}
                  </button>

                  {/* Conteúdo colapsável */}
                  <div
                    className={`transition-all duration-300 ease-in-out ${showColumnInfo ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
                  >
                    <div className="px-4 py-3 bg-dark-surface border-t border-dark-border">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[11px]">
                        <div className="flex items-start gap-2">
                          <User className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
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
                          <Package className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
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
                          <DollarSign className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
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
                          <DollarSign className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
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
                          <Hash className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
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
                          <Calendar className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
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
                          <CreditCard className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
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
                          <Users className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
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
                  <div className="bg-feedback-dark-error/10 border border-feedback-dark-error/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-feedback-dark-error" />
                      <h4 className="font-bold text-feedback-dark-error text-xs">
                        {errors.length} Erros Encontrados
                      </h4>
                    </div>
                    <ul className="text-[11px] text-text-dark-primary space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                      {errors.slice(0, 5).map((err, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-1.5 bg-dark-surface p-1.5 rounded"
                        >
                          <span className="text-feedback-dark-error font-bold">
                            L{err.line}:
                          </span>
                          <span className="flex-1 text-text-dark-secondary">
                            {err.error}
                          </span>
                        </li>
                      ))}
                      {errors.length > 5 && (
                        <li className="text-text-dark-secondary text-center pt-1">
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
                <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-base font-bold text-text-dark-primary mb-1">
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
                  <div className="w-14 h-14 bg-feedback-dark-success/20 rounded-full flex items-center justify-center animate-pulse">
                    <CheckCircle className="w-9 h-9 text-feedback-dark-success" />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-bold text-text-dark-primary mb-1">
                    Importação Concluída!
                  </h3>
                  <p className="text-text-dark-secondary text-xs">
                    As receitas foram importadas com sucesso ✨
                  </p>
                </div>

                {/* Report */}
                <div className="bg-dark-surface rounded-lg p-3 space-y-2 border border-dark-border text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-dark-border">
                    <span className="text-text-dark-secondary font-medium text-xs">
                      Total lidos:
                    </span>
                    <span className="font-bold text-text-dark-primary">
                      {importReport.total_lidos}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-dark-border">
                    <span className="text-text-dark-secondary font-medium text-xs">
                      Aprovados:
                    </span>
                    <span className="font-bold text-feedback-dark-success">
                      {importReport.total_aprovados}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-dark-border">
                    <span className="text-text-dark-secondary font-medium text-xs">
                      Duplicatas ignoradas:
                    </span>
                    <span className="font-bold text-feedback-dark-warning">
                      {importReport.duplicatas_ignoradas}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-dark-border">
                    <span className="text-text-dark-secondary font-medium text-xs">
                      Clientes criados:
                    </span>
                    <span className="font-bold text-primary">
                      {importReport.clientes_criados}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-text-dark-secondary font-medium text-xs">
                      Tempo de execução:
                    </span>
                    <span className="font-bold text-text-dark-primary">
                      {importReport.tempo_execucao}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full px-4 py-2.5 bg-primary text-dark-bg rounded-lg hover:bg-primary-hover font-bold text-sm transition-all shadow-lg shadow-primary/30"
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
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-text-dark-primary">
                    {recordCount > 0
                      ? `${recordCount} registros detectados`
                      : 'Aguardando arquivo'}
                  </span>
                </div>
                {selectedBankAccount && bankAccounts.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-text-dark-secondary">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px]">
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
                  className="px-4 py-2.5 border border-dark-border rounded-lg hover:bg-dark-bg transition-all disabled:opacity-50 text-sm font-semibold text-text-dark-primary"
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
                  className="flex-1 px-4 py-2.5 bg-primary text-dark-bg rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 disabled:shadow-none relative overflow-hidden group"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <span>Processar Extrato</span>
                      <svg
                        className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
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
                    <div className="absolute inset-0 bg-primary-hover opacity-0 group-hover:opacity-10 transition-opacity" />
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
