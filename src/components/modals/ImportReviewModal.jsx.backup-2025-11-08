import { format } from 'date-fns';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Download,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import categoriesService from '../../services/categoriesService';
import paymentMethodsService from '../../services/paymentMethodsService';
import { addCalendarDaysAndAdjustToBusinessDay } from '../../utils/businessDays';
import { formatDate, formatDateForDB } from '../../utils/formatters';

/**
 * Modal de Revisão de Importação de Receitas
 *
 * Permite ao usuário revisar e aprovar/rejeitar receitas antes de importar.
 * Funcionalidades:
 * - Visualizar todas as receitas detectadas
 * - Editar tipo (Serviço / Produto) individualmente ou em massa
 * - Ver alertas (cliente novo, profissional não identificado)
 * - Aprovar/rejeitar seletivamente
 * - Exportar relatório de validação
 */
const ImportReviewModal = ({
  isOpen,
  onClose,
  records = [],
  onConfirm,
  loading = false,
  unitId,
}) => {
  // Estado local para edições
  const [editedRecords, setEditedRecords] = useState(() =>
    records.map(r => ({
      ...r,
      approved: true,
    }))
  );
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(true);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  useEffect(() => {
    if (isOpen && unitId) {
      loadCategories();
      loadPaymentMethods();
    }
  }, [isOpen, unitId]);

  // Pré-selecionar categorias automaticamente quando as categorias forem carregadas
  useEffect(() => {
    if (categories.length > 0 && editedRecords.length > 0) {
      // Encontrar categoria padrão para serviços
      const defaultServiceCategory = categories.find(
        c => c.revenue_type === 'service'
      );

      // Pré-selecionar categoria para registros que não têm categoria
      setEditedRecords(prev =>
        prev.map(r => {
          // Se já tem categoria, não muda
          if (r.category_id) return r;

          // Pré-selecionar categoria baseada no tipo
          const defaultCategory =
            r.type === 'product'
              ? categories.find(c => c.revenue_type === 'product')
              : defaultServiceCategory;
          if (defaultCategory) {
            console.log(
              '🔄 ImportReviewModal: Pré-selecionando categoria:',
              defaultCategory.name,
              'para tipo:',
              r.type
            );
            return {
              ...r,
              category_id: defaultCategory.id,
            };
          }
          return r;
        })
      );
    }
  }, [categories]);
  useEffect(() => {
    if (paymentMethods.length > 0 && editedRecords.length > 0) {
      console.log('🔄 Iniciando auto-detecção de formas de pagamento...');
      console.log(
        '📋 Formas disponíveis:',
        paymentMethods.map(pm => pm.name || pm.nome)
      );
      console.log('📋 Primeiro registro:', editedRecords[0]);
      setEditedRecords(prev =>
        prev.map(r => {
          if (r.payment_method_id) return r;
          if (r.paymentMethodName) {
            const descLower = String(r.paymentMethodName)
              .toLowerCase()
              .trim()
              .replace(/\s+/g, ' '); // Normalizar espaços

            console.log(
              '🔍 Tentando detectar:',
              r.paymentMethodName,
              '→',
              descLower
            );

            // 1️⃣ Match exato
            const exactMatch = paymentMethods.find(pm => {
              const label = String(pm.name || pm.nome || '')
                .toLowerCase()
                .trim()
                .replace(/\s+/g, ' '); // Normalizar espaços
              const match = label && descLower === label;
              if (match) console.log('✅ Match exato:', label);
              return match;
            });
            if (exactMatch) {
              const receiptDays = exactMatch.receipt_days || 0;
              const paymentDate = new Date(r.date);
              const expectedReceiptDate = addCalendarDaysAndAdjustToBusinessDay(
                paymentDate,
                receiptDays
              );
              const feePercentage = exactMatch.fee_percentage || 0;
              const feeAmount = (r.value * feePercentage) / 100;
              console.log(
                '💳 Auto-detectada (exato):',
                exactMatch.name || exactMatch.nome,
                '→ Dias:',
                receiptDays
              );
              return {
                ...r,
                payment_method_id: exactMatch.id,
                expected_receipt_date: formatDateForDB(expectedReceiptDate),
                fees: feeAmount,
                gross_amount: r.value,
                net_amount: r.value - feeAmount,
                status: receiptDays === 0 ? 'Received' : 'Pending',
                actual_receipt_date: receiptDays === 0 ? r.date : null,
              };
            }

            // 2️⃣ Match parcial (palavra-chave)
            const partialMatch = paymentMethods.find(pm => {
              const label = String(pm.name || pm.nome || '')
                .toLowerCase()
                .trim()
                .replace(/\s+/g, ' '); // Normalizar espaços
              const match =
                label &&
                (descLower.includes(label) || label.includes(descLower));
              if (match)
                console.log('✅ Match parcial:', label, 'em', descLower);
              return match;
            });
            if (partialMatch) {
              const receiptDays = partialMatch.receipt_days || 0;
              const paymentDate = new Date(r.date);
              const expectedReceiptDate = addCalendarDaysAndAdjustToBusinessDay(
                paymentDate,
                receiptDays
              );
              const feePercentage = partialMatch.fee_percentage || 0;
              const feeAmount = (r.value * feePercentage) / 100;
              console.log(
                '💳 Auto-detectada (parcial):',
                partialMatch.name || partialMatch.nome,
                '→ Dias:',
                receiptDays
              );
              return {
                ...r,
                payment_method_id: partialMatch.id,
                expected_receipt_date: formatDateForDB(expectedReceiptDate),
                fees: feeAmount,
                gross_amount: r.value,
                net_amount: r.value - feeAmount,
                status: receiptDays === 0 ? 'Received' : 'Pending',
                actual_receipt_date: receiptDays === 0 ? r.date : null,
              };
            }
            console.warn('❌ Não encontrou match para:', r.paymentMethodName);
          }
          return r;
        })
      );
    }
  }, [paymentMethods]);

  // Função para carregar categorias
  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      console.log('🔄 ImportReviewModal: Carregando categorias...');
      const revenueCategories = await categoriesService.getRevenueCategories();
      setCategories(revenueCategories);
      console.log(
        `✅ ImportReviewModal: ${revenueCategories.length} categorias carregadas`
      );
      console.log('📋 ImportReviewModal: Categorias:', revenueCategories);
    } catch (error) {
      console.error(
        '❌ ImportReviewModal: Erro ao carregar categorias:',
        error
      );
      // Fallback para categorias padrão
      setCategories([
        {
          id: 'service',
          name: 'Serviço',
          category_type: 'Revenue',
        },
        {
          id: 'product',
          name: 'Produto',
          category_type: 'Revenue',
        },
      ]);
    } finally {
      setLoadingCategories(false);
    }
  };
  const loadPaymentMethods = async () => {
    try {
      setLoadingPaymentMethods(true);
      console.log('🔄 ImportReviewModal: Carregando formas de pagamento...');
      console.log('🔄 ImportReviewModal: Unit ID:', unitId);
      if (!unitId) {
        console.warn('⚠️ ImportReviewModal: Unit ID não encontrado');
        return;
      }
      console.log(
        '🔄 ImportReviewModal: Chamando paymentMethodsService.getPaymentMethods...'
      );
      const result = await paymentMethodsService.getPaymentMethods(
        unitId,
        false
      );
      console.log('🔄 ImportReviewModal: Resultado do serviço:', result);
      const { data: methods, error } = result;
      if (error) {
        console.error('❌ ImportReviewModal: Erro do serviço:', error);
        setPaymentMethods([]);
        return;
      }
      console.log(
        `✅ ImportReviewModal: ${methods?.length || 0} formas de pagamento carregadas`
      );
      console.log(
        '📋 ImportReviewModal: Formas:',
        methods?.map(m => ({
          nome: m.name || m.nome,
          dias: m.receipt_days,
        }))
      );
      setPaymentMethods(methods || []);
    } catch (error) {
      console.error(
        '❌ ImportReviewModal: Erro ao carregar formas de pagamento:',
        error
      );
      setPaymentMethods([]);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = editedRecords.length;
    const approved = editedRecords.filter(r => r.approved).length;
    const services = editedRecords.filter(r => r.type === 'service').length;
    const products = editedRecords.filter(r => r.type === 'product').length;
    const newClients = editedRecords.filter(r => r.isNewClient).length;
    const noProfessional = editedRecords.filter(
      r => r.hasProfessionalWarning
    ).length;
    const totalValue = editedRecords
      .filter(r => r.approved)
      .reduce((sum, r) => sum + r.value, 0);
    return {
      total,
      approved,
      services,
      products,
      newClients,
      noProfessional,
      totalValue,
    };
  }, [editedRecords]);

  // Alternar aprovação de um registro
  const toggleApproval = index => {
    setEditedRecords(prev =>
      prev.map((r, i) =>
        i === index
          ? {
              ...r,
              approved: !r.approved,
            }
          : r
      )
    );
  };

  // Alternar seleção de uma linha
  const toggleSelection = index => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  // Selecionar/desselecionar todas
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(editedRecords.map((_, i) => i)));
    }
    setSelectAll(!selectAll);
  };

  // Mudar categoria e tipo de um registro
  const changeType = (index, categoryId) => {
    setEditedRecords(prev =>
      prev.map((r, i) => {
        if (i !== index) return r;

        // Encontrar a categoria selecionada
        const selectedCategory = categories.find(c => c.id === categoryId);

        // Usar o revenue_type que já vem calculado do serviço
        const type = selectedCategory?.revenue_type || 'service';
        console.log(
          '🔄 ImportReviewModal: Mudando tipo para:',
          type,
          'categoria:',
          categoryId
        );
        return {
          ...r,
          category_id: categoryId,
          type,
        };
      })
    );
  };

  // Mudar forma de pagamento e recalcular data de recebimento
  const changePaymentMethod = (index, paymentMethodId) => {
    setEditedRecords(prev =>
      prev.map((r, i) => {
        if (i !== index) return r;

        // Encontrar a forma de pagamento selecionada
        const selectedMethod = paymentMethods.find(
          pm => pm.id === paymentMethodId
        );
        if (!selectedMethod) return r;

        // Calcular nova data de recebimento baseada nos dias
        const receiptDays = selectedMethod.receipt_days || 0;
        const paymentDate = new Date(r.date);
        const expectedReceiptDate = addCalendarDaysAndAdjustToBusinessDay(
          paymentDate,
          receiptDays
        );

        // Calcular taxas e valores líquidos
        const feePercentage = selectedMethod.fee_percentage || 0;
        const feeAmount = (r.value * feePercentage) / 100;
        console.log(
          '💳 ImportReviewModal: Mudando forma de pagamento:',
          selectedMethod.name || selectedMethod.nome,
          '| Dias:',
          receiptDays,
          '| Nova data:',
          formatDate(expectedReceiptDate)
        );
        return {
          ...r,
          payment_method_id: selectedMethod.id,
          paymentMethodName: selectedMethod.name || selectedMethod.nome,
          expected_receipt_date: formatDateForDB(expectedReceiptDate),
          fees: feeAmount,
          gross_amount: r.value,
          net_amount: r.value - feeAmount,
          status: receiptDays === 0 ? 'Received' : 'Pending',
          actual_receipt_date: receiptDays === 0 ? r.date : null,
        };
      })
    );
  };

  // Mudar tipo em massa para registros selecionados
  const changeBulkType = newType => {
    setEditedRecords(prev =>
      prev.map((r, i) => {
        if (selectedRows.has(i)) {
          // Encontrar uma categoria padrão para o tipo
          const defaultCategory = categories.find(
            c => c.revenue_type === newType
          );
          return {
            ...r,
            type: newType,
            category_id: defaultCategory?.id || null,
          };
        }
        return r;
      })
    );
    setSelectedRows(new Set());
  };

  // Aprovar todos
  const approveAll = () => {
    setEditedRecords(prev =>
      prev.map(r => ({
        ...r,
        approved: true,
      }))
    );
  };

  // Rejeitar todos
  const rejectAll = () => {
    setEditedRecords(prev =>
      prev.map(r => ({
        ...r,
        approved: false,
      }))
    );
  };

  // Confirmar importação
  const handleConfirm = () => {
    const approved = editedRecords.filter(r => r.approved);

    // Validar se todas as receitas aprovadas têm categoria
    const withoutCategory = approved.filter(
      r => !r.category_id || r.category_id === ''
    );
    if (withoutCategory.length > 0) {
      console.error(
        '❌ ImportReviewModal: Receitas sem categoria:',
        withoutCategory.length
      );
      alert(
        `Por favor, selecione uma categoria para todas as ${withoutCategory.length} receitas sem categoria antes de confirmar.`
      );
      return;
    }
    console.log('📋 ImportReviewModal: Registros aprovados:', approved.length);
    console.log('📋 ImportReviewModal: Primeiro registro:', approved[0]);
    console.log(
      '📋 ImportReviewModal: Campos do primeiro registro:',
      Object.keys(approved[0])
    );
    console.log('✅ ImportReviewModal: Todas as receitas têm categoria_id');
    onConfirm(approved);
  };

  // Exportar relatório de validação (CSV)
  const exportValidationReport = () => {
    const csv = [
      [
        'Linha',
        'Data',
        'Descrição',
        'Valor',
        'Tipo',
        'Profissional',
        'Cliente',
        'Forma Pagamento',
        'Status',
        'Alertas',
      ].join(';'),
      ...editedRecords.map(r =>
        [
          r.lineNumber,
          formatDate(r.date),
          r.source,
          `R$ ${r.value.toFixed(2)}`,
          r.type === 'service' ? 'Serviço' : 'Produto',
          r.professionalName || '-',
          r.partyName || '-',
          r.paymentMethodName || '-',
          r.approved ? 'Aprovado' : 'Rejeitado',
          [
            r.isNewClient ? 'Cliente Novo' : '',
            r.hasProfessionalWarning ? 'Sem Profissional' : '',
          ]
            .filter(Boolean)
            .join(', '),
        ].join(';')
      ),
    ].join('\n');
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `validacao_importacao_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-7xl flex-col rounded-xl border border-dark-border bg-dark-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-border bg-dark-surface p-6">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-text-dark-primary">
              <CheckCircle className="h-7 w-7 text-primary" />
              Revisão de Importação — Extrato Bancário
            </h2>
            <p className="mt-2 text-sm text-text-dark-secondary">
              Revise e aprove as receitas identificadas antes de importar
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 transition-colors hover:bg-dark-bg"
            aria-label="Fechar"
          >
            <X className="h-6 w-6 text-text-dark-secondary hover:text-text-dark-primary" />
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 border-b border-dark-border bg-dark-bg p-6 md:grid-cols-4 lg:grid-cols-7">
          <div className="text-center">
            <p className="mb-1 text-xs font-medium text-text-dark-secondary">
              Total
            </p>
            <p className="text-3xl font-bold text-text-dark-primary">
              {stats.total}
            </p>
          </div>
          <div className="text-center">
            <p className="mb-1 text-xs font-medium text-text-dark-secondary">
              Aprovados
            </p>
            <p className="text-3xl font-bold text-feedback-dark-success">
              {stats.approved}
            </p>
          </div>
          <div className="text-center">
            <p className="mb-1 text-xs font-medium text-text-dark-secondary">
              Serviços
            </p>
            <p className="text-3xl font-bold text-primary">{stats.services}</p>
          </div>
          <div className="text-center">
            <p className="mb-1 text-xs font-medium text-text-dark-secondary">
              Produtos
            </p>
            <p className="text-3xl font-bold text-primary-hover">
              {stats.products}
            </p>
          </div>
          <div className="text-center">
            <p className="mb-1 text-xs font-medium text-text-dark-secondary">
              Novos
            </p>
            <p className="text-3xl font-bold text-feedback-dark-warning">
              {stats.newClients}
            </p>
          </div>
          <div className="text-center">
            <p className="mb-1 text-xs font-medium text-text-dark-secondary">
              S/ Prof.
            </p>
            <p className="text-3xl font-bold text-feedback-dark-error">
              {stats.noProfessional}
            </p>
          </div>
          <div className="text-center">
            <p className="mb-1 text-xs font-medium text-text-dark-secondary">
              Valor Total
            </p>
            <p className="text-2xl font-bold text-feedback-dark-success">
              R$ {stats.totalValue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRows.size > 0 && (
          <div className="flex flex-col items-start justify-between gap-3 border-b border-primary/30 bg-primary/10 p-4 sm:flex-row sm:items-center">
            <p className="text-sm font-semibold text-primary">
              {selectedRows.size}{' '}
              {selectedRows.size === 1
                ? 'registro selecionado'
                : 'registros selecionados'}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => changeBulkType('service')}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-dark-bg transition-all hover:bg-primary-hover"
              >
                Marcar como Serviço
              </button>
              <button
                onClick={() => changeBulkType('product')}
                className="text-dark-text-primary rounded-lg bg-primary-hover px-4 py-2 text-sm font-semibold transition-all hover:bg-primary"
              >
                Marcar como Produto
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto bg-dark-bg p-4 sm:p-6">
          <div className="min-w-[1200px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 border-b-2 border-dark-border bg-dark-surface shadow-lg">
                <tr className="text-text-dark-primary">
                  <th className="p-2 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="p-2 text-left font-semibold">Linha</th>
                  <th className="p-2 text-left font-semibold">Data</th>
                  <th className="w-1/4 p-2 text-left font-semibold">
                    Descrição
                  </th>
                  <th className="p-2 text-right font-semibold">Valor</th>
                  <th className="p-2 text-left font-semibold">Profissional</th>
                  <th className="p-2 text-left font-semibold">Cliente</th>
                  <th className="p-2 text-left font-semibold">Forma Pgto</th>
                  <th className="p-2 text-center font-semibold">Tipo</th>
                  <th className="p-2 text-center font-semibold">Aprovar</th>
                </tr>
              </thead>
              <tbody>
                {editedRecords.map((record, index) => (
                  <tr
                    key={index}
                    className={`border-b border-dark-border transition-colors ${!record.approved ? 'bg-dark-surface/50 opacity-60' : 'bg-dark-surface hover:bg-dark-bg'}`}
                  >
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(index)}
                        onChange={() => toggleSelection(index)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-2 font-medium text-text-dark-secondary">
                      {record.lineNumber}
                    </td>
                    <td className="whitespace-nowrap p-2 font-medium text-text-dark-primary">
                      {formatDate(record.date)}
                    </td>
                    <td className="p-2 text-text-dark-primary">
                      <div className="max-w-xs truncate" title={record.source}>
                        {record.source}
                      </div>
                    </td>
                    <td className="whitespace-nowrap p-2 text-right text-base font-bold text-feedback-dark-success">
                      R$ {record.value.toFixed(2)}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1.5">
                        {record.hasProfessionalWarning && (
                          <AlertCircle className="h-4 w-4 flex-shrink-0 text-feedback-dark-error" />
                        )}
                        <span
                          className={`text-sm font-medium ${record.hasProfessionalWarning ? 'text-feedback-dark-error' : 'text-text-dark-primary'}`}
                        >
                          {record.professionalName}
                        </span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1.5">
                        {record.isNewClient && (
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-feedback-dark-warning" />
                        )}
                        <span
                          className={`text-sm font-medium ${record.isNewClient ? 'text-feedback-dark-warning' : 'text-text-dark-primary'}`}
                        >
                          {record.partyName}
                        </span>
                      </div>
                    </td>
                    <td className="p-2">
                      <select
                        value={record.payment_method_id || ''}
                        onChange={e =>
                          changePaymentMethod(index, e.target.value)
                        }
                        className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-1.5 text-sm font-semibold text-text-dark-primary outline-none transition-all focus:ring-2 focus:ring-primary"
                        disabled={loadingPaymentMethods}
                      >
                        <option value="" className="bg-dark-surface">
                          {loadingPaymentMethods
                            ? 'Carregando...'
                            : 'Selecionar forma...'}
                        </option>
                        {paymentMethods.map(method => (
                          <option
                            key={method.id}
                            value={method.id}
                            className="bg-dark-surface"
                          >
                            {method.name || method.nome}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <select
                        value={record.category_id || ''}
                        onChange={e => changeType(index, e.target.value)}
                        className="rounded-lg border border-dark-border bg-dark-bg px-3 py-1.5 text-sm font-semibold text-text-dark-primary outline-none transition-all focus:ring-2 focus:ring-primary"
                        disabled={loadingCategories}
                      >
                        <option value="" className="bg-dark-surface">
                          {loadingCategories ? 'Carregando...' : 'Assinatura'}
                        </option>
                        {categories.map(category => (
                          <option
                            key={category.id}
                            value={category.id}
                            className="bg-dark-surface"
                          >
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={record.approved}
                        onChange={() => toggleApproval(index)}
                        className="h-5 w-5 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col items-stretch justify-between gap-3 border-t border-dark-border bg-dark-surface p-4 sm:flex-row sm:items-center sm:p-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={approveAll}
              disabled={loading}
              className="text-dark-text-primary flex items-center gap-2 rounded-lg bg-feedback-dark-success px-4 py-2.5 text-sm font-semibold transition-all hover:bg-feedback-dark-success/80 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Aprovar Todos
            </button>
            <button
              onClick={rejectAll}
              disabled={loading}
              className="text-dark-text-primary rounded-lg bg-feedback-dark-error px-4 py-2.5 text-sm font-semibold transition-all hover:bg-feedback-dark-error/80 disabled:opacity-50"
            >
              Rejeitar Todos
            </button>
            <button
              onClick={exportValidationReport}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-dark-border px-4 py-2.5 text-sm font-semibold text-text-dark-primary transition-all hover:bg-dark-bg disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border-2 border-dark-border px-6 py-2.5 font-semibold text-text-dark-primary transition-all hover:bg-dark-bg disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || stats.approved === 0}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-bold text-dark-bg shadow-lg shadow-primary/30 transition-all hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="border-3 h-5 w-5 animate-spin rounded-full border-dark-bg border-t-transparent" />
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Confirmar Importação ({stats.approved})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ImportReviewModal;
