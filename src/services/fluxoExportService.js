/**
 * @file fluxoExportService.js
 * @description Serviço para exportação de relatórios de fluxo (PDF/Excel/CSV)
 * @module Services/FluxoExport
 * @author Barber Analytics Pro Team
 * @date 2025-10-22
 */

import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from '../utils/formatters';

class FluxoExportService {
  /**
   * Exporta dados como CSV
   * @param {Array} data - Dados do fluxo de caixa
   * @param {Object} filters - Filtros aplicados
   * @returns {void} Inicia download do arquivo
   */
  exportAsCSV(data, filters = {}) {
    try {
      // Cabeçalho do CSV
      const headers = [
        'Data',
        'Descrição',
        'Tipo',
        'Categoria',
        'Entradas',
        'Saídas',
        'Saldo',
      ];

      // Converter dados para linhas CSV
      const rows = data.map(item => [
        formatDate(item.transaction_date || item.date),
        item.description || item.source || '',
        item.transaction_type === 'Revenue' ? 'Receita' : 'Despesa',
        item.category || '',
        item.inflows ? formatCurrency(item.inflows) : 'R$ 0,00',
        item.outflows ? formatCurrency(item.outflows) : 'R$ 0,00',
        formatCurrency(item.daily_balance || 0),
      ]);

      // Adicionar totalizadores
      const totalEntradas = data.reduce(
        (sum, item) => sum + (parseFloat(item.inflows) || 0),
        0
      );
      const totalSaidas = data.reduce(
        (sum, item) => sum + (parseFloat(item.outflows) || 0),
        0
      );
      const saldoFinal = totalEntradas - totalSaidas;

      rows.push([]);
      rows.push([
        'TOTAIS',
        '',
        '',
        '',
        formatCurrency(totalEntradas),
        formatCurrency(totalSaidas),
        formatCurrency(saldoFinal),
      ]);

      // Juntar cabeçalho e linhas
      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';')),
      ].join('\n');

      // Criar Blob e fazer download
      const blob = new Blob(['\uFEFF' + csvContent], {
        type: 'text/csv;charset=utf-8;',
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `Fluxo_Caixa_${this._getFilename(filters)}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Exporta dados como Excel
   * @param {Array} data - Dados do fluxo de caixa
   * @param {Object} filters - Filtros aplicados
   * @returns {void} Inicia download do arquivo
   */
  exportAsExcel(data, filters = {}) {
    try {
      // Preparar dados para o Excel
      const excelData = data.map(item => ({
        Data: formatDate(item.transaction_date || item.date),
        Descrição: item.description || item.source || '',
        Tipo: item.transaction_type === 'Revenue' ? 'Receita' : 'Despesa',
        Categoria: item.category || '',
        Entradas: parseFloat(item.inflows) || 0,
        Saídas: parseFloat(item.outflows) || 0,
        Saldo: parseFloat(item.daily_balance) || 0,
      }));

      // Calcular totais
      const totalEntradas = data.reduce(
        (sum, item) => sum + (parseFloat(item.inflows) || 0),
        0
      );
      const totalSaidas = data.reduce(
        (sum, item) => sum + (parseFloat(item.outflows) || 0),
        0
      );
      const saldoFinal = totalEntradas - totalSaidas;

      // Adicionar linha de totais
      excelData.push({});
      excelData.push({
        Data: '',
        Descrição: 'TOTAIS',
        Tipo: '',
        Categoria: '',
        Entradas: totalEntradas,
        Saídas: totalSaidas,
        Saldo: saldoFinal,
      });

      // Criar workbook e worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Ajustar largura das colunas
      ws['!cols'] = [
        { wch: 12 }, // Data
        { wch: 40 }, // Descrição
        { wch: 10 }, // Tipo
        { wch: 20 }, // Categoria
        { wch: 15 }, // Entradas
        { wch: 15 }, // Saídas
        { wch: 15 }, // Saldo
      ];

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Fluxo de Caixa');

      // Gerar e fazer download do arquivo
      XLSX.writeFile(wb, `Fluxo_Caixa_${this._getFilename(filters)}.xlsx`);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Exporta dados como PDF (via impressão HTML)
   * @param {Array} data - Dados do fluxo de caixa
   * @param {Object} filters - Filtros aplicados
   * @returns {void} Abre janela de impressão
   */
  exportAsPDF(data, filters = {}) {
    try {
      // Calcular totais
      const totalEntradas = data.reduce(
        (sum, item) => sum + (parseFloat(item.inflows) || 0),
        0
      );
      const totalSaidas = data.reduce(
        (sum, item) => sum + (parseFloat(item.outflows) || 0),
        0
      );
      const saldoFinal = totalEntradas - totalSaidas;

      // Gerar HTML para impressão
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fluxo de Caixa - ${this._getFilename(filters)}</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            .header h1 { font-size: 24px; margin-bottom: 10px; }
            .header .subtitle { font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: bold; font-size: 12px; text-transform: uppercase; }
            td { font-size: 13px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .receita { color: #10b981; }
            .despesa { color: #ef4444; }
            .totals { background-color: #f9fafb; font-weight: bold; border-top: 2px solid #333; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #666; }
            @media print {
              .no-print { display: none; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Fluxo de Caixa</h1>
            <div class="subtitle">
              ${this._getPeriodoLabel(filters)} | Gerado em ${new Date().toLocaleString('pt-BR')}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th class="text-center">Tipo</th>
                <th>Categoria</th>
                <th class="text-right">Entradas</th>
                <th class="text-right">Saídas</th>
                <th class="text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  item => `
                <tr>
                  <td>${formatDate(item.transaction_date || item.date)}</td>
                  <td>${item.description || item.source || ''}</td>
                  <td class="text-center ${item.transaction_type === 'Revenue' ? 'receita' : 'despesa'}">
                    ${item.transaction_type === 'Revenue' ? 'Receita' : 'Despesa'}
                  </td>
                  <td>${item.category || '-'}</td>
                  <td class="text-right receita">${item.inflows ? formatCurrency(item.inflows) : '-'}</td>
                  <td class="text-right despesa">${item.outflows ? formatCurrency(item.outflows) : '-'}</td>
                  <td class="text-right">${formatCurrency(item.daily_balance || 0)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
            <tfoot>
              <tr class="totals">
                <td colspan="4" class="text-right">TOTAIS:</td>
                <td class="text-right receita">${formatCurrency(totalEntradas)}</td>
                <td class="text-right despesa">${formatCurrency(totalSaidas)}</td>
                <td class="text-right" style="color: ${saldoFinal >= 0 ? '#10b981' : '#ef4444'}">
                  ${formatCurrency(saldoFinal)}
                </td>
              </tr>
            </tfoot>
          </table>

          <div class="footer">
            <p>Barber Analytics Pro | Relatório gerado automaticamente</p>
          </div>

          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
        </html>
      `;

      // Abrir nova janela com HTML
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      printWindow.document.write(html);
      printWindow.document.close();

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Gera nome de arquivo baseado nos filtros
   * @private
   */
  _getFilename(filters) {
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0].replace(/-/g, '');

    if (filters.periodo) {
      const { tipo, mes, ano } = filters.periodo;
      if (tipo === 'mes') {
        return `${ano}_${String(mes).padStart(2, '0')}_${timestamp}`;
      }
      if (tipo === 'ano') {
        return `${ano}_${timestamp}`;
      }
    }

    return timestamp;
  }

  /**
   * Gera label do período para exibição
   * @private
   */
  _getPeriodoLabel(filters) {
    if (!filters.periodo) return 'Todos os períodos';

    const { tipo, mes, ano, dataInicio, dataFim } = filters.periodo;

    if (tipo === 'mes') {
      const meses = [
        'Jan',
        'Fev',
        'Mar',
        'Abr',
        'Mai',
        'Jun',
        'Jul',
        'Ago',
        'Set',
        'Out',
        'Nov',
        'Dez',
      ];
      return `${meses[mes - 1]}/${ano}`;
    }

    if (tipo === 'ano') {
      return `Ano ${ano}`;
    }

    if (tipo === 'custom' && dataInicio && dataFim) {
      return `${formatDate(dataInicio)} a ${formatDate(dataFim)}`;
    }

    return 'Período customizado';
  }
}

// Instância singleton
const fluxoExportService = new FluxoExportService();

export default fluxoExportService;
