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
  Download,
  Eye,
  ArrowRight,
  RefreshCw,
  MapPin,
} from 'lucide-react';
// Date formatting imports removed - not used in current implementation

import { StatusBadge } from '../atoms/StatusBadge';
import { AutoMatchStep } from '../organisms';
import { BankFileParser } from '../services/bankFileParser';
import { autoCategorizeBankStatement } from '../services/autoCategorization';

/**
 * Modal para importação de extratos bancários com parsing de CSV
 * Inclui upload de arquivo, mapeamento de colunas, preview e validação
 * Integra com statementsService para processamento dos dados
 */
const ImportStatementModal = ({
  isOpen = false,
  onClose = () => {},
  onImport = () => {},
  onSuccess = () => {},
  loading = false,
  availableAccounts = [],
  defaultAccountId = null,
}) => {
  // Estados principais
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState(null);
  const [parseResult, setParseResult] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [selectedAccount, setSelectedAccount] = useState('');
  const [importSettings, setImportSettings] = useState({
    skipFirstRow: true,
    dateFormat: 'dd/MM/yyyy',
    delimiter: ',',
    encoding: 'UTF-8',
    duplicateHandling: 'skip',
  });
  const [previewData, setPreviewData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enableAutoMatch, setEnableAutoMatch] = useState(true); // Controla se auto-match será executado
  const [autoMatchCompleted, setAutoMatchCompleted] = useState(false); // Controla se auto-match foi concluído

  // Referências
  const fileInputRef = useRef(null);
  const isProcessing = loading || isSubmitting;
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setValidationErrors([]);
    if (defaultAccountId) {
      setSelectedAccount(defaultAccountId);
    }
  }, [isOpen, defaultAccountId]);

  // Configurações de formatos suportados
  const supportedFormats = useMemo(
    () => [
      {
        value: 'csv',
        label: 'CSV (Comma Separated)',
        ext: '.csv',
        icon: FileText,
      },
      {
        value: 'txt',
        label: 'TXT (Tab Separated)',
        ext: '.txt',
        icon: FileText,
      },
      {
        value: 'ofx',
        label: 'OFX (Open Financial Exchange)',
        ext: '.ofx',
        icon: Download,
      },
      {
        value: 'qif',
        label: 'QIF (Quicken Interchange Format)',
        ext: '.qif',
        icon: Download,
      },
    ],
    []
  );

  // Opções de delimitadores
  const delimiterOptions = [
    {
      value: ',',
      label: 'Vírgula (,)',
    },
    {
      value: ';',
      label: 'Ponto e vírgula (;)',
    },
    {
      value: '\t',
      label: 'Tab',
    },
    {
      value: '|',
      label: 'Pipe (|)',
    },
  ];

  // Opções de encoding
  const encodingOptions = [
    {
      value: 'UTF-8',
      label: 'UTF-8 (Recomendado)',
    },
    {
      value: 'ISO-8859-1',
      label: 'ISO-8859-1 (Latin-1)',
    },
    {
      value: 'Windows-1252',
      label: 'Windows-1252',
    },
  ];

  // Opções de tratamento de duplicatas
  const duplicateHandlingOptions = [
    {
      value: 'skip',
      label: 'Pular duplicatas',
      description: 'Ignorar transações que já existem',
    },
    {
      value: 'update',
      label: 'Atualizar existentes',
      description: 'Sobrescrever dados das transações existentes',
    },
    {
      value: 'create_new',
      label: 'Criar novas',
      description: 'Importar mesmo se houver duplicatas',
    },
  ];

  // Colunas obrigatórias e opcionais
  const requiredColumns = useMemo(
    () => [
      {
        key: 'data',
        label: 'Data da Transação',
        required: true,
      },
      {
        key: 'valor',
        label: 'Valor',
        required: true,
      },
      {
        key: 'descricao',
        label: 'Descrição',
        required: true,
      },
    ],
    []
  );
  const optionalColumns = useMemo(
    () => [
      {
        key: 'tipo',
        label: 'Tipo (Débito/Crédito)',
      },
      {
        key: 'categoria',
        label: 'Categoria',
      },
      {
        key: 'documento',
        label: 'Número do Documento',
      },
      {
        key: 'saldo',
        label: 'Saldo',
      },
      {
        key: 'observacoes',
        label: 'Observações',
      },
    ],
    []
  );

  // Função para validar arquivo
  const validateFile = useCallback(
    selectedFile => {
      const errors = [];
      if (!selectedFile) {
        errors.push('Nenhum arquivo selecionado');
        return errors;
      }

      // Validar tamanho (máximo 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        errors.push('Arquivo muito grande. Tamanho máximo: 10MB');
      }

      // Validar extensão
      const extension = selectedFile.name.split('.').pop().toLowerCase();
      const supportedExtensions = supportedFormats.map(format =>
        format.ext.replace('.', '')
      );
      if (!supportedExtensions.includes(extension)) {
        errors.push(
          `Formato não suportado. Formatos aceitos: ${supportedExtensions.join(', ')}`
        );
      }
      return errors;
    },
    [supportedFormats]
  );

  // Função para simular parsing do arquivo CSV
  const parseCSVContent = useCallback(
    content => {
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        throw new Error('Arquivo vazio ou inválido');
      }
      const delimiter = importSettings.delimiter;
      const headers = lines[0]
        .split(delimiter)
        .map(h => h.trim().replace(/"/g, ''));
      const startIndex = importSettings.skipFirstRow ? 1 : 0;
      const rows = lines.slice(startIndex).map((line, index) => {
        const values = line
          .split(delimiter)
          .map(v => v.trim().replace(/"/g, ''));
        const row = {
          _index: index + startIndex,
        };
        headers.forEach((header, colIndex) => {
          row[header] = values[colIndex] || '';
        });
        return row;
      });
      return {
        headers,
        rows: rows.slice(0, 50),
        // Limitar preview a 50 linhas
        totalRows: rows.length,
        sample: rows.slice(0, 5), // Amostra para mapeamento
      };
    },
    [importSettings]
  );

  // ✅ FIX: Função para ler conteúdo real do arquivo
  const readFileContent = useCallback(
    file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => {
          try {
            const content = event.target.result;
            resolve(content);
          } catch (error) {
            reject(new Error('Erro ao ler arquivo: ' + error.message));
          }
        };
        reader.onerror = () => {
          reject(
            new Error(
              'Erro ao ler arquivo. Verifique se o arquivo não está corrompido.'
            )
          );
        };

        // Tentar diferentes encodings
        if (importSettings.encoding === 'UTF-8') {
          reader.readAsText(file, 'UTF-8');
        } else if (importSettings.encoding === 'ISO-8859-1') {
          reader.readAsText(file, 'ISO-8859-1');
        } else {
          reader.readAsText(file);
        }
      });
    },
    [importSettings.encoding]
  );

  // ✅ FIX: Função para auto-mapear colunas baseado nos headers
  const autoMapColumns = useCallback(headers => {
    const mapping = {};
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase().trim();

      // Mapeamento inteligente de colunas
      if (lowerHeader.includes('data') || lowerHeader.includes('date')) {
        mapping.data = header;
      }
      if (
        lowerHeader.includes('valor') ||
        lowerHeader.includes('value') ||
        lowerHeader.includes('amount')
      ) {
        mapping.valor = header;
      }
      if (
        lowerHeader.includes('desc') ||
        lowerHeader.includes('histórico') ||
        lowerHeader.includes('description')
      ) {
        mapping.descricao = header;
      }
      if (
        lowerHeader.includes('tipo') ||
        lowerHeader.includes('type') ||
        lowerHeader.includes('debit') ||
        lowerHeader.includes('credit')
      ) {
        mapping.tipo = header;
      }
      if (
        lowerHeader.includes('doc') ||
        lowerHeader.includes('número') ||
        lowerHeader.includes('number')
      ) {
        mapping.documento = header;
      }
      if (lowerHeader.includes('saldo') || lowerHeader.includes('balance')) {
        mapping.saldo = header;
      }
      if (
        lowerHeader.includes('obs') ||
        lowerHeader.includes('note') ||
        lowerHeader.includes('comment')
      ) {
        mapping.observacoes = header;
      }
    });
    return mapping;
  }, []);

  // Função para upload e parsing do arquivo
  const handleFileUpload = useCallback(
    async selectedFile => {
      const errors = validateFile(selectedFile);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
      setFile(selectedFile);
      setValidationErrors([]);
      try {
        // Detectar formato do arquivo
        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

        // ✅ FIX: Ler conteúdo real do arquivo
        const fileContent = await readFileContent(selectedFile);
        let result;

        // Se for OFX, usar o BankFileParser
        if (fileExtension === 'ofx') {
          const parser = new BankFileParser();
          const transactions = await parser.parseOFX(fileContent);

          // Converter transações OFX para formato esperado pelo modal
          // ✅ AUTO-CATEGORIZAÇÃO: Sugerir categoria baseada na descrição (ASYNC)

          // eslint-disable-next-line no-console
          console.log(
            `[ImportStatementModal] 🤖 Iniciando auto-categorização de ${transactions.length} transações...`
          );
          const ofxRows = await Promise.all(
            transactions.map(async (t, index) => {
              const transactionType = t.type === 'credit' ? 'Credit' : 'Debit';
              const suggestedCategory = await autoCategorizeBankStatement(
                t.description,
                transactionType
              );

              // Log das primeiras 3 para debug
              if (index < 3) {
                // eslint-disable-next-line no-console
                console.log(
                  `[ImportStatementModal] 📝 Transação ${index + 1}:`,
                  {
                    descricao: t.description.substring(0, 50),
                    tipo: transactionType,
                    categoriaSugerida: suggestedCategory,
                  }
                );
              }
              return {
                data: t.date,
                descricao: t.description,
                valor: t.amount,
                tipo: t.type === 'credit' ? 'C' : 'D',
                documento: t.document || t.fitid || '',
                categoria: suggestedCategory, // ✅ Categoria sugerida automaticamente
              };
            })
          );

          // eslint-disable-next-line no-console
          console.log(
            `[ImportStatementModal] ✅ Auto-categorização concluída!`
          );
          result = {
            headers: [
              'data',
              'descricao',
              'valor',
              'tipo',
              'documento',
              'categoria',
            ],
            rows: ofxRows,
            sample: ofxRows.slice(0, 10), // Preview das primeiras 10 linhas
          };

          // Auto-mapear para OFX (já vem estruturado)
          setColumnMapping({
            data: 'data',
            descricao: 'descricao',
            valor: 'valor',
            tipo: 'tipo',
            documento: 'documento',
            categoria: 'categoria', // ✅ Mapear categoria
          });
        } else {
          // CSV/TXT: usar parser existente
          result = parseCSVContent(fileContent);

          // Auto-mapear colunas baseado nos headers reais
          const autoMapping = autoMapColumns(result.headers);
          setColumnMapping(autoMapping);
        }
        setParseResult(result);
        setCurrentStep(2);
      } catch (error) {
        setValidationErrors([error.message || 'Erro ao processar arquivo']);
      }
    },
    [validateFile, parseCSVContent, readFileContent, autoMapColumns]
  );

  // Função para validar mapeamento
  const validateMapping = useCallback(() => {
    const errors = [];
    requiredColumns.forEach(col => {
      if (!columnMapping[col.key]) {
        errors.push(`Campo obrigatório não mapeado: ${col.label}`);
      }
    });

    // Validar se as colunas mapeadas existem
    Object.values(columnMapping).forEach(mappedColumn => {
      if (mappedColumn && !parseResult.headers.includes(mappedColumn)) {
        errors.push(`Coluna mapeada não encontrada: ${mappedColumn}`);
      }
    });
    return errors;
  }, [columnMapping, parseResult]);

  // Função para gerar preview dos dados
  const generatePreview = useCallback(() => {
    if (
      !parseResult ||
      !columnMapping.data ||
      !columnMapping.valor ||
      !columnMapping.descricao
    ) {
      return [];
    }
    return parseResult.sample.map((row, index) => {
      const processedRow = {
        id: `preview-${index}`,
        data: row[columnMapping.data] || '',
        valor:
          parseFloat(
            row[columnMapping.valor]?.replace(/[^\d,-]/g, '').replace(',', '.')
          ) || 0,
        descricao: row[columnMapping.descricao] || '',
        tipo: row[columnMapping.tipo] || 'D',
        documento: row[columnMapping.documento] || '',
        saldo:
          parseFloat(
            row[columnMapping.saldo]?.replace(/[^\d,-]/g, '').replace(',', '.')
          ) || null,
        observacoes: row[columnMapping.observacoes] || '',
        categoria: row[columnMapping.categoria] || 'Despesas sem Identificação',
        // ✅ Categoria sugerida
        status: 'pendente',
        _original: row,
      };

      // Validar linha
      processedRow.hasErrors = false;
      processedRow.errors = [];
      if (
        !processedRow.data ||
        !processedRow.data.match(/\d{1,2}\/\d{1,2}\/\d{4}/)
      ) {
        processedRow.hasErrors = true;
        processedRow.errors.push('Data inválida');
      }
      if (!processedRow.valor || isNaN(processedRow.valor)) {
        processedRow.hasErrors = true;
        processedRow.errors.push('Valor inválido');
      }
      if (!processedRow.descricao.trim()) {
        processedRow.hasErrors = true;
        processedRow.errors.push('Descrição obrigatória');
      }
      return processedRow;
    });
  }, [parseResult, columnMapping]);

  // Função para avançar para preview ou auto-match
  const handleProceedToPreview = useCallback(() => {
    const errors = validateMapping();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    const preview = generatePreview();
    setPreviewData(preview);
    setValidationErrors([]);

    // Se auto-match está habilitado, vai para step 2.5, senão vai direto para step 3
    setCurrentStep(enableAutoMatch ? 2.5 : 3);
  }, [validateMapping, generatePreview, enableAutoMatch]);

  // Função para resetar modal
  const resetModal = useCallback(() => {
    setCurrentStep(1);
    setFile(null);
    setParseResult(null);
    setColumnMapping({});
    setSelectedAccount('');
    setPreviewData([]);
    setValidationErrors([]);
    setEnableAutoMatch(true);
    setAutoMatchCompleted(false);
    setImportSettings({
      skipFirstRow: true,
      dateFormat: 'dd/MM/yyyy',
      delimiter: ',',
      encoding: 'UTF-8',
      duplicateHandling: 'skip',
    });
  }, []);

  // Fun��o para executar importa��o
  const handleExecuteImport = useCallback(async () => {
    if (!selectedAccount) {
      setValidationErrors(['Selecione uma conta para importacao']);
      return;
    }
    const importData = {
      account_id: selectedAccount,
      file,
      settings: importSettings,
      column_mapping: columnMapping,
      preview_data: previewData.filter(row => !row.hasErrors),
    };
    setValidationErrors([]);
    setIsSubmitting(true);
    try {
      const result = await onImport(importData);
      if (result?.success) {
        if (typeof onSuccess === 'function') {
          await onSuccess(result);
        }
        resetModal();
        onClose();
      } else if (result?.error) {
        setValidationErrors([result.error]);
      }
    } catch (err) {
      setValidationErrors([
        err.message || 'Erro inesperado ao importar extratos',
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedAccount,
    file,
    importSettings,
    columnMapping,
    previewData,
    onImport,
    onSuccess,
    resetModal,
    onClose,
  ]);

  // Fun��o para fechar modal
  const handleClose = useCallback(() => {
    resetModal();
    onClose();
  }, [resetModal, onClose]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="card-theme max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-light-border p-6 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-theme-primary text-xl font-semibold">
                Importar Extrato Bancário
              </h2>
              <p className="text-theme-secondary text-sm">
                Passo {currentStep} de {enableAutoMatch ? '4' : '3'} -{' '}
                {currentStep === 1
                  ? 'Upload do Arquivo'
                  : currentStep === 2
                    ? 'Mapeamento de Colunas'
                    : currentStep === 2.5
                      ? 'Auto-Match de Reconciliação'
                      : 'Preview e Confirmação'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary hover:card-theme flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="border-b border-light-border bg-light-bg px-6 py-3 dark:border-dark-border dark:bg-dark-bg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              {[
                {
                  step: 1,
                  title: 'Upload',
                  icon: Upload,
                },
                {
                  step: 2,
                  title: 'Mapeamento',
                  icon: MapPin,
                },
                ...(enableAutoMatch
                  ? [
                      {
                        step: 2.5,
                        title: 'Auto-Match',
                        icon: RefreshCw,
                      },
                    ]
                  : []),
                {
                  step: 3,
                  title: 'Preview',
                  icon: Eye,
                },
              ].map(({ step, title }) => (
                <div
                  key={step}
                  className={`flex items-center gap-2 ${currentStep >= step ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${currentStep >= step ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}
                  >
                    {currentStep > step ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-medium">
                        {step === 2.5 ? '★' : step}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium">{title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] flex-1 overflow-y-auto">
          {currentStep === 1 && (
            <div className="space-y-6 p-6">
              {/* Seleção de Conta */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Conta Bancária *
                </label>
                <select
                  value={selectedAccount}
                  onChange={e => setSelectedAccount(e.target.value)}
                  className="w-full rounded-lg border border-light-border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border"
                >
                  <option value="">Selecionar conta...</option>
                  {availableAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.nome} - {account.banco} ({account.numero})
                    </option>
                  ))}
                </select>
              </div>

              {/* Configurações de Import */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                    Delimitador
                  </label>
                  <select
                    value={importSettings.delimiter}
                    onChange={e =>
                      setImportSettings(prev => ({
                        ...prev,
                        delimiter: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-light-border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border"
                  >
                    {delimiterOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                    Formato de Data
                  </label>
                  <select
                    value={importSettings.dateFormat}
                    onChange={e =>
                      setImportSettings(prev => ({
                        ...prev,
                        dateFormat: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-light-border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border"
                  >
                    {dateFormatOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                    Encoding
                  </label>
                  <select
                    value={importSettings.encoding}
                    onChange={e =>
                      setImportSettings(prev => ({
                        ...prev,
                        encoding: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-light-border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border"
                  >
                    {encodingOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="skipFirstRow"
                    checked={importSettings.skipFirstRow}
                    onChange={e =>
                      setImportSettings(prev => ({
                        ...prev,
                        skipFirstRow: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-light-border text-blue-600 focus:ring-blue-500 dark:border-dark-border"
                  />
                  <label
                    htmlFor="skipFirstRow"
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600"
                  >
                    Primeira linha contém cabeçalhos
                  </label>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                    Tratamento de Duplicatas
                  </label>
                  <select
                    value={importSettings.duplicateHandling}
                    onChange={e =>
                      setImportSettings(prev => ({
                        ...prev,
                        duplicateHandling: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-light-border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border"
                  >
                    {duplicateHandlingOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload Area */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Arquivo do Extrato *
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-lg border-2 border-dashed border-light-border p-8 text-center transition-colors hover:border-gray-400 dark:border-dark-border"
                >
                  <Upload className="text-light-text-muted dark:text-dark-text-muted mx-auto mb-4 h-12 w-12" />
                  <div className="space-y-2">
                    <p className="text-theme-primary text-lg font-medium">
                      {file ? file.name : 'Clique para selecionar arquivo'}
                    </p>
                    <p className="text-theme-secondary text-sm">
                      Formatos suportados: CSV, TXT, OFX, QIF
                    </p>
                    <p className="text-light-text-muted dark:text-dark-text-muted text-xs">
                      Tamanho máximo: 10MB
                    </p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.ofx,.qif"
                  onChange={e => {
                    const selectedFile = e.target.files[0];
                    if (selectedFile) {
                      handleFileUpload(selectedFile);
                    }
                  }}
                  className="hidden"
                />
              </div>

              {/* Formatos Suportados */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h4 className="mb-3 text-sm font-medium text-blue-900">
                  Formatos Suportados
                </h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {supportedFormats.map(format => {
                    const Icon = format.icon;
                    return (
                      <div
                        key={format.value}
                        className="flex items-center gap-2 text-sm text-blue-700"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{format.label}</span>
                        <span className="text-blue-500">({format.ext})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && parseResult && (
            <div className="space-y-6 p-6">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    Arquivo processado com sucesso!
                  </span>
                </div>
                <p className="text-sm text-green-600">
                  {parseResult.totalRows} transações encontradas. Configure o
                  mapeamento das colunas abaixo.
                </p>
              </div>

              {/* Column Mapping */}
              <div>
                <h3 className="text-theme-primary mb-4 text-lg font-medium">
                  Mapeamento de Colunas
                </h3>

                <div className="space-y-4">
                  {/* Required Columns */}
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                      Campos Obrigatórios
                    </h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {requiredColumns.map(column => (
                        <div key={column.key}>
                          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                            {column.label} *
                          </label>
                          <select
                            value={columnMapping[column.key] || ''}
                            onChange={e =>
                              setColumnMapping(prev => ({
                                ...prev,
                                [column.key]: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-light-border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border"
                          >
                            <option value="">Selecionar coluna...</option>
                            {parseResult.headers.map(header => (
                              <option key={header} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Optional Columns */}
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                      Campos Opcionais
                    </h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {optionalColumns.map(column => (
                        <div key={column.key}>
                          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                            {column.label}
                          </label>
                          <select
                            value={columnMapping[column.key] || ''}
                            onChange={e =>
                              setColumnMapping(prev => ({
                                ...prev,
                                [column.key]: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-light-border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border"
                          >
                            <option value="">Não mapear</option>
                            {parseResult.headers.map(header => (
                              <option key={header} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Data Preview */}
              {parseResult.sample.length > 0 && (
                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                    Amostra dos Dados (Primeiras 5 linhas)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full rounded-lg border border-light-border dark:border-dark-border">
                      <thead className="bg-light-bg dark:bg-dark-bg">
                        <tr>
                          {parseResult.headers.map(header => (
                            <th
                              key={header}
                              className="text-theme-secondary border-b border-light-border px-3 py-2 text-left text-xs font-medium uppercase tracking-wider dark:border-dark-border"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="card-theme divide-y divide-gray-200">
                        {parseResult.sample.map((row, index) => (
                          <tr
                            key={index}
                            className={
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }
                          >
                            {parseResult.headers.map(header => (
                              <td
                                key={header}
                                className="text-theme-primary border-b border-light-border px-3 py-2 text-sm dark:border-dark-border"
                              >
                                {row[header] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2.5: Auto-Match de Reconciliação */}
          {currentStep === 2.5 && enableAutoMatch && (
            <div className="p-6">
              <AutoMatchStep
                accountId={selectedAccount}
                statements={previewData}
                onMatchesConfirmed={confirmedCount => {
                  setAutoMatchCompleted(true);
                  setCurrentStep(3);
                  if (confirmedCount > 0) {
                    // toast.success() já foi chamado pelo AutoMatchStep
                  }
                }}
                onSkip={() => {
                  setCurrentStep(3);
                  setEnableAutoMatch(false);
                }}
                tolerance={0.01}
                dateTolerance={2}
              />
            </div>
          )}

          {currentStep === 3 && previewData.length > 0 && (
            <div className="space-y-6 p-6">
              {/* Summary */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 text-lg font-medium text-blue-900">
                  Resumo da Importação
                </h3>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                  <div>
                    <span className="font-medium text-blue-700">
                      Total de transações:
                    </span>
                    <span className="ml-2 text-blue-900">
                      {previewData.length}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Válidas:</span>
                    <span className="ml-2 text-green-900">
                      {previewData.filter(row => !row.hasErrors).length}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-red-700">Com erros:</span>
                    <span className="ml-2 text-red-900">
                      {previewData.filter(row => row.hasErrors).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              <div>
                <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Preview dos Dados Processados
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full rounded-lg border border-light-border dark:border-dark-border">
                    <thead className="bg-light-bg dark:bg-dark-bg">
                      <tr>
                        <th className="text-theme-secondary px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-theme-secondary px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                          Data
                        </th>
                        <th className="text-theme-secondary px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="text-theme-secondary px-3 py-2 text-right text-xs font-medium uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="text-theme-secondary px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="text-theme-secondary px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                          Observações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="card-theme divide-y divide-gray-200">
                      {previewData.map((row, index) => (
                        <tr
                          key={index}
                          className={row.hasErrors ? 'bg-red-50' : 'bg-white'}
                        >
                          <td className="whitespace-nowrap px-3 py-2">
                            {row.hasErrors ? (
                              <StatusBadge status="error" size="sm" />
                            ) : (
                              <StatusBadge status="success" size="sm" />
                            )}
                          </td>
                          <td className="text-theme-primary px-3 py-2 text-sm">
                            {row.data}
                          </td>
                          <td className="text-theme-primary px-3 py-2 text-sm">
                            {row.descricao}
                          </td>
                          <td className="px-3 py-2 text-right text-sm">
                            <span
                              className={
                                row.valor >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }
                            >
                              R${' '}
                              {Math.abs(row.valor).toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </td>
                          <td className="text-theme-primary px-3 py-2 text-sm">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${row.tipo === 'C' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                            >
                              {row.tipo === 'C' ? 'Crédito' : 'Débito'}
                            </span>
                          </td>
                          <td className="text-theme-secondary px-3 py-2 text-sm">
                            {row.hasErrors ? (
                              <div className="text-red-600">
                                {row.errors.join(', ')}
                              </div>
                            ) : (
                              row.documento || '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="border-t border-red-200 bg-red-50 px-6 py-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <div>
                <h4 className="text-sm font-medium text-red-800">
                  Problemas encontrados:
                </h4>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-red-700">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-light-border bg-light-bg p-6 dark:border-dark-border dark:bg-dark-bg">
          <div className="text-theme-secondary flex items-center text-sm">
            {file && (
              <span>
                Arquivo: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => {
                  // Se está no step 2.5, volta para step 2
                  // Se está no step 3 e auto-match foi executado, volta para step 2.5
                  // Caso contrário, volta um step
                  if (currentStep === 2.5) {
                    setCurrentStep(2);
                  } else if (
                    currentStep === 3 &&
                    enableAutoMatch &&
                    !autoMatchCompleted
                  ) {
                    setCurrentStep(2.5);
                  } else {
                    setCurrentStep(currentStep === 3 ? 2 : currentStep - 1);
                  }
                }}
                className="rounded-lg border border-light-border px-4 py-2 text-gray-700 transition-colors hover:bg-light-bg dark:border-dark-border dark:bg-dark-bg dark:text-gray-300 dark:text-gray-600"
                data-testid="btn-back"
              >
                Voltar
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-light-border px-4 py-2 text-gray-700 transition-colors hover:bg-light-bg dark:border-dark-border dark:bg-dark-bg dark:text-gray-300 dark:text-gray-600"
            >
              Cancelar
            </button>

            {currentStep === 1 && parseResult && (
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-dark-text-primary flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 transition-colors hover:bg-blue-700"
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {currentStep === 2 && (
              <>
                {/* Checkbox para habilitar/desabilitar auto-match */}
                <label className="mr-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  <input
                    type="checkbox"
                    checked={enableAutoMatch}
                    onChange={e => setEnableAutoMatch(e.target.checked)}
                    className="rounded border-light-border text-blue-600 focus:ring-blue-500 dark:border-dark-border"
                  />
                  <span>Executar auto-match de reconciliação</span>
                </label>

                <button
                  type="button"
                  onClick={handleProceedToPreview}
                  className="text-dark-text-primary flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 transition-colors hover:bg-blue-700"
                  data-testid="btn-proceed-from-mapping"
                >
                  {enableAutoMatch ? 'Executar Auto-Match' : 'Gerar Preview'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={
                  isProcessing ||
                  previewData.filter(row => !row.hasErrors).length === 0
                }
                className="text-dark-text-primary flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Importar {
                      previewData.filter(row => !row.hasErrors).length
                    }{' '}
                    Transações
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
ImportStatementModal.propTypes = {
  /** Se o modal esta aberto */
  isOpen: PropTypes.bool,
  /** Funcao chamada ao fechar o modal */
  onClose: PropTypes.func,
  /** Funcao chamada ao executar importacao */
  onImport: PropTypes.func,
  /** Callback executado quando a importacao conclui com sucesso */
  onSuccess: PropTypes.func,
  /** Se esta carregando */
  loading: PropTypes.bool,
  /** Contas bancarias disponiveis */
  availableAccounts: PropTypes.arrayOf(PropTypes.object),
  /** ID padrao da conta bancarias selecionada */
  defaultAccountId: PropTypes.string,
  /** Formatos de importacao disponiveis */
  importFormats: PropTypes.arrayOf(PropTypes.object),
};
export default ImportStatementModal;
