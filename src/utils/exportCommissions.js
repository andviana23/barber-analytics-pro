import { formatCurrency, formatDate } from './formatters';

/**
 * 📊 Export Commissions Utilities
 *
 * Utilitários para exportar relatórios de comissões em diferentes formatos.
 *
 * Formatos suportados:
 * - CSV: tabela simples para Excel
 * - PDF: relatório formatado para impressão
 *
 * @author Andrey Viana
 * @module utils/exportCommissions
 */

/**
 * Converte array para CSV
 */
const arrayToCSV = (data, headers) => {
  const headerRow = headers.join(',');
  const rows = data.map(row =>
    headers
      .map(header => {
        const value = row[header] || '';
        // Escape aspas duplas e wrap em aspas se contiver vírgula ou quebra de linha
        const escaped = String(value).replace(/"/g, '""');
        return /[,\n"]/.test(escaped) ? `"${escaped}"` : escaped;
      })
      .join(',')
  );

  return [headerRow, ...rows].join('\n');
};

/**
 * Exporta comissões para CSV
 *
 * @param {Array} commissions - Array de comissões
 * @param {Object} filters - Filtros aplicados (para incluir no nome do arquivo)
 */
export const exportCommissionsToCSV = async (commissions, filters = {}) => {
  try {
    // Prepara os dados
    const data = commissions.map(item => ({
      Data: formatDate(item.date),
      Comanda: item.orderNumber || item.order_id?.substring(0, 8),
      Profissional: item.professionalName || item.professional_name,
      Cliente: item.clientName || item.client_name,
      Serviço: item.serviceName || item.service_name,
      Quantidade: item.quantity || 1,
      'Valor Unitário': formatCurrency(item.unitPrice || item.unit_price),
      Percentual: `${item.commissionPercentage || item.commission_percentage}%`,
      Comissão: formatCurrency(item.commissionValue || item.commission_value),
      Status: item.status === 'paid' ? 'Paga' : 'Pendente',
      'Data Pagamento': item.paymentDate ? formatDate(item.paymentDate) : '-',
    }));

    // Calcula totais
    const totals = commissions.reduce(
      (acc, item) => {
        acc.total += item.commissionValue || item.commission_value || 0;
        if (item.status === 'paid') {
          acc.paid += item.commissionValue || item.commission_value || 0;
        } else {
          acc.pending += item.commissionValue || item.commission_value || 0;
        }
        return acc;
      },
      { total: 0, paid: 0, pending: 0 }
    );

    // Adiciona linha de totais
    data.push({
      Data: '',
      Comanda: '',
      Profissional: '',
      Cliente: '',
      Serviço: '',
      Quantidade: '',
      'Valor Unitário': '',
      Percentual: 'TOTAL',
      Comissão: formatCurrency(totals.total),
      Status: '',
      'Data Pagamento': '',
    });

    data.push({
      Data: '',
      Comanda: '',
      Profissional: '',
      Cliente: '',
      Serviço: '',
      Quantidade: '',
      'Valor Unitário': '',
      Percentual: 'Pagas',
      Comissão: formatCurrency(totals.paid),
      Status: '',
      'Data Pagamento': '',
    });

    data.push({
      Data: '',
      Comanda: '',
      Profissional: '',
      Cliente: '',
      Serviço: '',
      Quantidade: '',
      'Valor Unitário': '',
      Percentual: 'Pendentes',
      Comissão: formatCurrency(totals.pending),
      Status: '',
      'Data Pagamento': '',
    });

    // Gera CSV
    const headers = [
      'Data',
      'Comanda',
      'Profissional',
      'Cliente',
      'Serviço',
      'Quantidade',
      'Valor Unitário',
      'Percentual',
      'Comissão',
      'Status',
      'Data Pagamento',
    ];
    const csv = arrayToCSV(data, headers);

    // Cria arquivo para download
    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    // Nome do arquivo com data
    const timestamp = new Date().toISOString().split('T')[0];
    const professionalFilter = filters.professionalId ? '_profissional' : '';
    const fileName = `comissoes${professionalFilter}_${timestamp}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Exporta comissões para PDF
 *
 * Utiliza jsPDF e autoTable para gerar PDF formatado.
 *
 * @param {Array} commissions - Array de comissões
 * @param {Object} filters - Filtros aplicados
 */
/**
 * Exporta comissões MANUAIS para PDF
 *
 * Utiliza jsPDF e autoTable para gerar PDF formatado.
 *
 * @param {Array} commissions - Array de comissões manuais
 * @param {Object} filters - Filtros aplicados
 */
export const exportManualCommissionsToPDF = async (commissions, filters = {}) => {
  try {
    // Lazy load jsPDF e autoTable
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF();

    // Configurações
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Relatório de Comissões (Gestão Manual)', pageWidth / 2, yPosition, {
      align: 'center',
    });

    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(
      `Gerado em: ${formatDate(new Date().toISOString())}`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );

    // Filtros aplicados
    yPosition += 8;
    if (filters.start_date || filters.end_date) {
      let periodText = 'Período: ';
      if (filters.start_date) periodText += `${formatDate(filters.start_date)}`;
      if (filters.start_date && filters.end_date) periodText += ' a ';
      if (filters.end_date) periodText += `${formatDate(filters.end_date)}`;
      doc.text(periodText, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;
    }

    if (filters.professional_id && commissions.length > 0) {
      const professionalName =
        commissions[0].professional?.name || 'N/A';
      doc.text(
        `Profissional: ${professionalName}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
      yPosition += 6;
    }

    // Tabela de dados
    const tableData = commissions.map((item) => [
      formatDate(item.reference_date),
      item.professional?.name || 'N/A',
      item.description || '-',
      item.order ? `#${item.order.id.slice(0, 8)}` : '-',
      formatCurrency(item.amount || 0),
      item.status === 'PAID' ? 'Paga' : item.status === 'CANCELLED' ? 'Cancelada' : 'Pendente',
      item.paid_at ? formatDate(item.paid_at) : '-',
    ]);

    doc.autoTable({
      startY: yPosition + 5,
      head: [
        [
          'Data Ref.',
          'Profissional',
          'Descrição',
          'Comanda',
          'Valor',
          'Status',
          'Data Pagamento',
        ],
      ],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [124, 58, 237], // purple-600
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 20 }, // Data
        1: { cellWidth: 35 }, // Profissional
        2: { cellWidth: 40 }, // Descrição
        3: { cellWidth: 18 }, // Comanda
        4: { cellWidth: 22, halign: 'right' }, // Valor
        5: { cellWidth: 20, halign: 'center' }, // Status
        6: { cellWidth: 25 }, // Data Pagamento
      },
      margin: { left: 10, right: 10 },
      didDrawPage: (data) => {
        // Footer com número da página
        doc.setFontSize(8);
        doc.text(
          `Página ${doc.internal.getCurrentPageInfo().pageNumber}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      },
    });

    // Totais
    const totals = commissions.reduce(
      (acc, item) => {
        const amount = parseFloat(item.amount || 0);
        acc.total += amount;
        if (item.status === 'PAID') {
          acc.paid += amount;
        } else if (item.status === 'PENDING') {
          acc.pending += amount;
        } else if (item.status === 'CANCELLED') {
          acc.cancelled += amount;
        }
        return acc;
      },
      { total: 0, paid: 0, pending: 0, cancelled: 0 }
    );

    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`Total de Comissões: ${formatCurrency(totals.total)}`, 14, finalY);

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(22, 163, 74); // green-600
    doc.text(`Pagas: ${formatCurrency(totals.paid)}`, 14, finalY + 6);

    doc.setTextColor(249, 115, 22); // orange-600
    doc.text(`Pendentes: ${formatCurrency(totals.pending)}`, 14, finalY + 12);

    if (totals.cancelled > 0) {
      doc.setTextColor(239, 68, 68); // red-600
      doc.text(`Canceladas: ${formatCurrency(totals.cancelled)}`, 14, finalY + 18);
    }

    doc.setTextColor(0, 0, 0); // reset

    // Assinatura
    const signatureY = finalY + (totals.cancelled > 0 ? 30 : 24);
    doc.setFontSize(9);
    doc.line(14, signatureY, 80, signatureY);
    doc.text('Assinatura do Responsável', 14, signatureY + 5);

    doc.line(pageWidth - 80, signatureY, pageWidth - 14, signatureY);
    doc.text('Data', pageWidth - 80, signatureY + 5);

    // Salvar arquivo
    const timestamp = new Date().toISOString().split('T')[0];
    const professionalFilter = filters.professional_id ? '_profissional' : '';
    const fileName = `comissoes_manuais${professionalFilter}_${timestamp}.pdf`;

    doc.save(fileName);

    return { success: true };
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Exporta comissões para PDF (alias para exportManualCommissionsToPDF)
 * 
 * @deprecated Use exportManualCommissionsToPDF instead
 * @param {Array} commissions - Array de comissões
 * @param {Object} filters - Filtros aplicados
 */
export const exportCommissionsToPDF = exportManualCommissionsToPDF;

/**
 * Exporta comissões agrupadas por profissional para PDF
 *
 * @param {Array} groupedData - Dados agrupados por profissional
 * @param {Object} filters - Filtros aplicados
 */
export const exportGroupedCommissionsToPDF = async (
  groupedData,
  filters = {}
) => {
  try {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(
      'Relatório de Comissões por Profissional',
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );

    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(
      `Gerado em: ${formatDate(new Date().toISOString())}`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );
    yPosition += 15;

    // Itera sobre cada profissional
    groupedData.forEach((group, index) => {
      if (index > 0) {
        doc.addPage();
        yPosition = 20;
      }

      // Nome do profissional
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(group.professional, 14, yPosition);

      yPosition += 8;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(
        `Total: ${formatCurrency(group.total)} | Pagas: ${formatCurrency(group.paid)} | Pendentes: ${formatCurrency(group.pending)}`,
        14,
        yPosition
      );

      // Tabela de itens do profissional
      const tableData = group.items.map(item => [
        formatDate(item.date),
        item.orderNumber || '-',
        item.clientName || item.client_name || '-',
        item.serviceName || item.service_name || '-',
        formatCurrency(item.unitPrice || item.unit_price || 0),
        `${item.commissionPercentage || item.commission_percentage}%`,
        formatCurrency(item.commissionValue || item.commission_value || 0),
        item.status === 'paid' ? 'Paga' : 'Pendente',
      ]);

      doc.autoTable({
        startY: yPosition + 5,
        head: [
          [
            'Data',
            'Comanda',
            'Cliente',
            'Serviço',
            'Valor',
            '%',
            'Comissão',
            'Status',
          ],
        ],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [124, 58, 237],
          textColor: 255,
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
        },
        margin: { left: 14, right: 14 },
      });

      yPosition = doc.lastAutoTable.finalY;
    });

    // Salvar
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`comissoes_por_profissional_${timestamp}.pdf`);

    return { success: true };
  } catch (error) {
    console.error('Erro ao exportar PDF agrupado:', error);
    return { success: false, error: error.message };
  }
};
