import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Upload, FileText, AlertCircle, CheckCircle, Download, Eye, ArrowRight, RefreshCw, MapPin } from 'lucide-react';
// Date formatting imports removed - not used in current implementation

import StatusBadge from '../atoms/StatusBadge';

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
  defaultAccountId = null
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
    duplicateHandling: 'skip'
  });
  const [previewData, setPreviewData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const supportedFormats = useMemo(() => [
    { value: 'csv', label: 'CSV (Comma Separated)', ext: '.csv', icon: FileText },
    { value: 'txt', label: 'TXT (Tab Separated)', ext: '.txt', icon: FileText },
    { value: 'ofx', label: 'OFX (Open Financial Exchange)', ext: '.ofx', icon: Download },
    { value: 'qif', label: 'QIF (Quicken Interchange Format)', ext: '.qif', icon: Download }
  ], []);

  // Opções de delimitadores
  const delimiterOptions = [
    { value: ',', label: 'Vírgula (,)' },
    { value: ';', label: 'Ponto e vírgula (;)' },
    { value: '\t', label: 'Tab' },
    { value: '|', label: 'Pipe (|)' }
  ];

  // Opções de formato de data
  const dateFormatOptions = [
    { value: 'dd/MM/yyyy', label: 'DD/MM/AAAA (31/12/2024)' },
    { value: 'MM/dd/yyyy', label: 'MM/DD/AAAA (12/31/2024)' },
    { value: 'yyyy-MM-dd', label: 'AAAA-MM-DD (2024-12-31)' },
    { value: 'dd-MM-yyyy', label: 'DD-MM-AAAA (31-12-2024)' }
  ];

  // Opções de tratamento de duplicatas
  const duplicateHandlingOptions = [
    { value: 'skip', label: 'Pular duplicatas', description: 'Ignorar transações que já existem' },
    { value: 'update', label: 'Atualizar existentes', description: 'Sobrescrever dados das transações existentes' },
    { value: 'create_new', label: 'Criar novas', description: 'Importar mesmo se houver duplicatas' }
  ];

  // Colunas obrigatórias e opcionais
  const requiredColumns = useMemo(() => [
    { key: 'data', label: 'Data da Transação', required: true },
    { key: 'valor', label: 'Valor', required: true },
    { key: 'descricao', label: 'Descrição', required: true }
  ], []);

  const optionalColumns = useMemo(() => [
    { key: 'tipo', label: 'Tipo (Débito/Crédito)' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'documento', label: 'Número do Documento' },
    { key: 'saldo', label: 'Saldo' },
    { key: 'observacoes', label: 'Observações' }
  ], []);

  // Função para validar arquivo
  const validateFile = useCallback((selectedFile) => {
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
    const supportedExtensions = supportedFormats.map(format => format.ext.replace('.', ''));
    
    if (!supportedExtensions.includes(extension)) {
      errors.push(`Formato não suportado. Formatos aceitos: ${supportedExtensions.join(', ')}`);
    }

    return errors;
  }, [supportedFormats]);

  // Função para simular parsing do arquivo CSV
  const parseCSVContent = useCallback((content) => {
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('Arquivo vazio ou inválido');
    }

    const delimiter = importSettings.delimiter;
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
    const startIndex = importSettings.skipFirstRow ? 1 : 0;
    
    const rows = lines.slice(startIndex).map((line, index) => {
      const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ''));
      const row = { _index: index + startIndex };
      
      headers.forEach((header, colIndex) => {
        row[header] = values[colIndex] || '';
      });
      
      return row;
    });

    return {
      headers,
      rows: rows.slice(0, 50), // Limitar preview a 50 linhas
      totalRows: rows.length,
      sample: rows.slice(0, 5) // Amostra para mapeamento
    };
  }, [importSettings]);

  // Função para upload e parsing do arquivo
  const handleFileUpload = useCallback(async (selectedFile) => {
    const errors = validateFile(selectedFile);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setFile(selectedFile);
    setValidationErrors([]);

    // Simular leitura do arquivo
    try {
      // Em uma implementação real, você usaria FileReader
      const mockCsvContent = `Data,Descrição,Valor,Tipo,Documento
01/12/2024,"Transferência recebida",1500.00,C,TED123456
02/12/2024,"Pagamento conta luz",-85.50,D,BOL789123
03/12/2024,"Depósito em dinheiro",200.00,C,DEP456789
05/12/2024,"Saque no caixa eletrônico",-100.00,D,SAQ987654
08/12/2024,"Compra no cartão débito",-45.30,D,CDB321987`;

      const result = parseCSVContent(mockCsvContent);
      setParseResult(result);
      
      // Auto-mapear colunas óbvias
      const autoMapping = {};
      result.headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('data')) autoMapping.data = header;
        if (lowerHeader.includes('valor') || lowerHeader.includes('value')) autoMapping.valor = header;
        if (lowerHeader.includes('desc') || lowerHeader.includes('histórico')) autoMapping.descricao = header;
        if (lowerHeader.includes('tipo') || lowerHeader.includes('type')) autoMapping.tipo = header;
        if (lowerHeader.includes('doc') || lowerHeader.includes('número')) autoMapping.documento = header;
        if (lowerHeader.includes('saldo') || lowerHeader.includes('balance')) autoMapping.saldo = header;
      });
      
      setColumnMapping(autoMapping);
      setCurrentStep(2);
    } catch (error) {
      setValidationErrors([error.message || 'Erro ao processar arquivo']);
    }
  }, [validateFile, parseCSVContent]);

  // Função para validar mapeamento
  const validateMapping = useCallback(() => {
    const errors = [];
    
    requiredColumns.forEach(col => {
      if (!columnMapping[col.key]) {
        errors.push(`Campo obrigatório não mapeado: ${col.label}`);
      }
    });

    // Validar se as colunas mapeadas existem
    Object.values(columnMapping).forEach((mappedColumn) => {
      if (mappedColumn && !parseResult.headers.includes(mappedColumn)) {
        errors.push(`Coluna mapeada não encontrada: ${mappedColumn}`);
      }
    });

    return errors;
  }, [columnMapping, parseResult]);

  // Função para gerar preview dos dados
  const generatePreview = useCallback(() => {
    if (!parseResult || !columnMapping.data || !columnMapping.valor || !columnMapping.descricao) {
      return [];
    }

    return parseResult.sample.map((row, index) => {
      const processedRow = {
        id: `preview-${index}`,
        data: row[columnMapping.data] || '',
        valor: parseFloat(row[columnMapping.valor]?.replace(/[^\d,-]/g, '').replace(',', '.')) || 0,
        descricao: row[columnMapping.descricao] || '',
        tipo: row[columnMapping.tipo] || 'D',
        documento: row[columnMapping.documento] || '',
        saldo: parseFloat(row[columnMapping.saldo]?.replace(/[^\d,-]/g, '').replace(',', '.')) || null,
        observacoes: row[columnMapping.observacoes] || '',
        status: 'pendente',
        _original: row
      };

      // Validar linha
      processedRow.hasErrors = false;
      processedRow.errors = [];

      if (!processedRow.data || !processedRow.data.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
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

  // Função para avançar para preview
  const handleProceedToPreview = useCallback(() => {
    const errors = validateMapping();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const preview = generatePreview();
    setPreviewData(preview);
    setValidationErrors([]);
    setCurrentStep(3);
  }, [validateMapping, generatePreview]);

  // Função para resetar modal
  const resetModal = useCallback(() => {
    setCurrentStep(1);
    setFile(null);
    setParseResult(null);
    setColumnMapping({});
    setSelectedAccount('');
    setPreviewData([]);
    setValidationErrors([]);
    setImportSettings({
      skipFirstRow: true,
      dateFormat: 'dd/MM/yyyy',
      delimiter: ',',
      encoding: 'UTF-8',
      duplicateHandling: 'skip'
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
      preview_data: previewData.filter(row => !row.hasErrors)
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
      setValidationErrors([err.message || 'Erro inesperado ao importar extratos']);
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
    onClose
  ]);

  // Fun��o para fechar modal
  const handleClose = useCallback(() => {
    resetModal();
    onClose();
  }, [resetModal, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Importar Extrato Bancário
              </h2>
              <p className="text-sm text-gray-500">
                Passo {currentStep} de 3 - {
                  currentStep === 1 ? 'Upload do Arquivo' :
                  currentStep === 2 ? 'Mapeamento de Colunas' :
                  'Preview e Confirmação'
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-8">
              {[
                { step: 1, title: 'Upload', icon: Upload },
                { step: 2, title: 'Mapeamento', icon: MapPin },
                { step: 3, title: 'Preview', icon: Eye }
              ].map(({ step, title }) => (
                <div
                  key={step}
                  className={`flex items-center gap-2 ${
                    currentStep >= step ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                    currentStep >= step 
                      ? 'border-blue-600 bg-blue-600 text-white' 
                      : 'border-gray-300'
                  }`}>
                    {currentStep > step ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-medium">{step}</span>
                    )}
                  </div>
                  <span className="font-medium">{title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-[60vh]">
          {currentStep === 1 && (
            <div className="p-6 space-y-6">
              {/* Seleção de Conta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conta Bancária *
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecionar conta...</option>
                  {availableAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.nome} - {account.banco} ({account.numero})
                    </option>
                  ))}
                </select>
              </div>

              {/* Configurações de Import */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delimitador
                  </label>
                  <select
                    value={importSettings.delimiter}
                    onChange={(e) => setImportSettings(prev => ({ ...prev, delimiter: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {delimiterOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formato de Data
                  </label>
                  <select
                    value={importSettings.dateFormat}
                    onChange={(e) => setImportSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {dateFormatOptions.map((option) => (
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
                    onChange={(e) => setImportSettings(prev => ({ ...prev, skipFirstRow: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="skipFirstRow" className="ml-2 text-sm text-gray-700">
                    Primeira linha contém cabeçalhos
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tratamento de Duplicatas
                  </label>
                  <select
                    value={importSettings.duplicateHandling}
                    onChange={(e) => setImportSettings(prev => ({ ...prev, duplicateHandling: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {duplicateHandlingOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo do Extrato *
                </label>
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 cursor-pointer transition-colors"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-900">
                      {file ? file.name : 'Clique para selecionar arquivo'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Formatos suportados: CSV, TXT, OFX, QIF
                    </p>
                    <p className="text-xs text-gray-400">
                      Tamanho máximo: 10MB
                    </p>
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.ofx,.qif"
                  onChange={(e) => {
                    const selectedFile = e.target.files[0];
                    if (selectedFile) {
                      handleFileUpload(selectedFile);
                    }
                  }}
                  className="hidden"
                />
              </div>

              {/* Formatos Suportados */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-3">
                  Formatos Suportados
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {supportedFormats.map((format) => {
                    const Icon = format.icon;
                    return (
                      <div key={format.value} className="flex items-center gap-2 text-sm text-blue-700">
                        <Icon className="w-4 h-4" />
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
            <div className="p-6 space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Arquivo processado com sucesso!</span>
                </div>
                <p className="text-sm text-green-600">
                  {parseResult.totalRows} transações encontradas. Configure o mapeamento das colunas abaixo.
                </p>
              </div>

              {/* Column Mapping */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Mapeamento de Colunas
                </h3>
                
                <div className="space-y-4">
                  {/* Required Columns */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Campos Obrigatórios
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {requiredColumns.map((column) => (
                        <div key={column.key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {column.label} *
                          </label>
                          <select
                            value={columnMapping[column.key] || ''}
                            onChange={(e) => setColumnMapping(prev => ({
                              ...prev,
                              [column.key]: e.target.value
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Selecionar coluna...</option>
                            {parseResult.headers.map((header) => (
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
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Campos Opcionais
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {optionalColumns.map((column) => (
                        <div key={column.key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {column.label}
                          </label>
                          <select
                            value={columnMapping[column.key] || ''}
                            onChange={(e) => setColumnMapping(prev => ({
                              ...prev,
                              [column.key]: e.target.value
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Não mapear</option>
                            {parseResult.headers.map((header) => (
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
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Amostra dos Dados (Primeiras 5 linhas)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          {parseResult.headers.map((header) => (
                            <th
                              key={header}
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {parseResult.sample.map((row, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {parseResult.headers.map((header) => (
                              <td
                                key={header}
                                className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200"
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

          {currentStep === 3 && previewData.length > 0 && (
            <div className="p-6 space-y-6">
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  Resumo da Importação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Total de transações:</span>
                    <span className="ml-2 text-blue-900">{previewData.length}</span>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">Válidas:</span>
                    <span className="ml-2 text-green-900">{previewData.filter(row => !row.hasErrors).length}</span>
                  </div>
                  <div>
                    <span className="text-red-700 font-medium">Com erros:</span>
                    <span className="ml-2 text-red-900">{previewData.filter(row => row.hasErrors).length}</span>
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Preview dos Dados Processados
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Observações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.map((row, index) => (
                        <tr key={index} className={row.hasErrors ? 'bg-red-50' : 'bg-white'}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {row.hasErrors ? (
                              <StatusBadge status="error" size="sm" />
                            ) : (
                              <StatusBadge status="success" size="sm" />
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {row.data}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {row.descricao}
                          </td>
                          <td className="px-3 py-2 text-sm text-right">
                            <span className={row.valor >= 0 ? 'text-green-600' : 'text-red-600'}>
                              R$ {Math.abs(row.valor).toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              row.tipo === 'C' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {row.tipo === 'C' ? 'Crédito' : 'Débito'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-500">
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
          <div className="px-6 py-3 bg-red-50 border-t border-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">
                  Problemas encontrados:
                </h4>
                <ul className="mt-1 text-sm text-red-700 list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center text-sm text-gray-500">
            {file && (
              <span>Arquivo: {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
            )}
            
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            
            {currentStep === 1 && parseResult && (
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            
            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleProceedToPreview}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Gerar Preview
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            
            {currentStep === 3 && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isProcessing || previewData.filter(row => !row.hasErrors).length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Importar {previewData.filter(row => !row.hasErrors).length} Transações
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
  importFormats: PropTypes.arrayOf(PropTypes.object)
};

export default ImportStatementModal;



