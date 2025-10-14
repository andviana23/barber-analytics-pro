/**
 * Utilitários para exportação de relatórios financeiros
 * Inclui exportação para CSV, Excel (XLSX) e PDF
 */
/* eslint-disable no-console */
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

/**
 * Exporta dados da DRE para CSV
 */
export const exportDREToCSV = (dreData, periodo) => {
  const csvRows = [
    ['DEMONSTRATIVO DE RESULTADO DO EXERCÍCIO (DRE)'],
    [`Período: ${periodo}`],
    [''],
    ['ITEM', 'VALOR (R$)', 'PERCENTUAL (%)'],
    [''],
    // Receitas
    ['(+) RECEITA BRUTA', formatCurrency(dreData.receita_bruta), `${dreData.percentuais?.receita_bruta || 100}%`],
    ['(-) Deduções da Receita', formatCurrency(dreData.deducoes), `${dreData.percentuais?.deducoes || 0}%`],
    ['(=) RECEITA LÍQUIDA', formatCurrency(dreData.receita_liquida), `${dreData.percentuais?.receita_liquida || 0}%`],
    [''],
    // Custos Variáveis
    ['(-) Custos Variáveis', formatCurrency(dreData.custos_variaveis), `${dreData.percentuais?.custos_variaveis || 0}%`],
    ['(=) MARGEM DE CONTRIBUIÇÃO', formatCurrency(dreData.margem_contribuicao), `${dreData.percentuais?.margem_contribuicao || 0}%`],
    [''],
    // Despesas Fixas
    ['(-) Despesas Fixas', formatCurrency(dreData.despesas_fixas), `${dreData.percentuais?.despesas_fixas || 0}%`],
    ['(=) RESULTADO OPERACIONAL', formatCurrency(dreData.resultado_operacional), `${dreData.percentuais?.resultado_operacional || 0}%`],
    [''],
    // Outras Receitas/Despesas
    ['(+/-) Outras Receitas/Despesas', formatCurrency(dreData.outras_receitas_despesas || 0), `${dreData.percentuais?.outras_receitas_despesas || 0}%`],
    ['(=) LUCRO LÍQUIDO', formatCurrency(dreData.lucro_liquido), `${dreData.percentuais?.lucro_liquido || 0}%`],
  ];

  const csvContent = csvRows.map(row => 
    row.map(field => `"${field}"`).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `DRE_${periodo.replace(/\s+/g, '_')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporta dados das receitas para CSV
 */
export const exportReceitasToCSV = (receitas, periodo) => {
  const csvRows = [
    ['RELATÓRIO DE RECEITAS'],
    [`Período: ${periodo}`],
    [''],
    ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Unidade', 'Status']
  ];

  receitas.forEach(receita => {
    csvRows.push([
      new Date(receita.data_vencimento).toLocaleDateString('pt-BR'),
      receita.descricao,
      receita.categoria,
      receita.tipo,
      formatCurrency(receita.valor),
      receita.unit_name || 'N/A',
      receita.status
    ]);
  });

  // Total
  const total = receitas.reduce((sum, r) => sum + (r.valor || 0), 0);
  csvRows.push(['', '', '', '', '', '', '']);
  csvRows.push(['TOTAL', '', '', '', formatCurrency(total), '', '']);

  const csvContent = csvRows.map(row => 
    row.map(field => `"${field}"`).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `Receitas_${periodo.replace(/\s+/g, '_')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporta dados das despesas para CSV
 */
export const exportDespesasToCSV = (despesas, periodo) => {
  const csvRows = [
    ['RELATÓRIO DE DESPESAS'],
    [`Período: ${periodo}`],
    [''],
    ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Unidade', 'Status']
  ];

  despesas.forEach(despesa => {
    csvRows.push([
      new Date(despesa.data_vencimento).toLocaleDateString('pt-BR'),
      despesa.descricao,
      despesa.categoria,
      despesa.tipo,
      formatCurrency(despesa.valor),
      despesa.unit_name || 'N/A',
      despesa.status
    ]);
  });

  // Total
  const total = despesas.reduce((sum, d) => sum + (d.valor || 0), 0);
  csvRows.push(['', '', '', '', '', '', '']);
  csvRows.push(['TOTAL', '', '', '', formatCurrency(total), '', '']);

  const csvContent = csvRows.map(row => 
    row.map(field => `"${field}"`).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `Despesas_${periodo.replace(/\s+/g, '_')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Gera relatório completo em HTML para impressão
 */
export const generateHTMLReport = (dreData, receitas, despesas, periodo) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório Financeiro - ${periodo}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          margin: 0; 
          padding: 20px;
          color: #333;
        }
        .header { 
          text-align: center; 
          border-bottom: 2px solid #333; 
          padding-bottom: 20px; 
          margin-bottom: 30px;
        }
        .section { 
          margin-bottom: 30px; 
          page-break-inside: avoid;
        }
        .section h2 { 
          color: #2563eb; 
          border-bottom: 1px solid #e5e7eb; 
          padding-bottom: 10px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 15px 0;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 12px 8px; 
          text-align: left;
        }
        th { 
          background-color: #f8f9fa; 
          font-weight: bold;
        }
        .currency { 
          text-align: right; 
          font-family: monospace;
        }
        .total-row { 
          background-color: #f0f9ff; 
          font-weight: bold;
        }
        .dre-table .positive { color: #059669; }
        .dre-table .negative { color: #dc2626; }
        .footer { 
          margin-top: 40px; 
          text-align: center; 
          font-size: 12px; 
          color: #666;
        }
        @media print {
          body { margin: 0; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>RELATÓRIO FINANCEIRO</h1>
        <p><strong>Período:</strong> ${periodo}</p>
        <p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      </div>

      <!-- DRE -->
      <div class="section">
        <h2>🧮 Demonstrativo de Resultado do Exercício (DRE)</h2>
        <table class="dre-table">
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: right">Valor (R$)</th>
              <th style="text-align: right">% da Receita</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>(+) Receita Bruta</strong></td>
              <td class="currency positive">${formatCurrency(dreData.receita_bruta)}</td>
              <td class="currency">${dreData.percentuais?.receita_bruta || 100}%</td>
            </tr>
            <tr>
              <td>(-) Deduções da Receita</td>
              <td class="currency negative">${formatCurrency(dreData.deducoes)}</td>
              <td class="currency">${dreData.percentuais?.deducoes || 0}%</td>
            </tr>
            <tr class="total-row">
              <td><strong>(=) Receita Líquida</strong></td>
              <td class="currency">${formatCurrency(dreData.receita_liquida)}</td>
              <td class="currency">${dreData.percentuais?.receita_liquida || 0}%</td>
            </tr>
            <tr>
              <td>(-) Custos Variáveis</td>
              <td class="currency negative">${formatCurrency(dreData.custos_variaveis)}</td>
              <td class="currency">${dreData.percentuais?.custos_variaveis || 0}%</td>
            </tr>
            <tr class="total-row">
              <td><strong>(=) Margem de Contribuição</strong></td>
              <td class="currency">${formatCurrency(dreData.margem_contribuicao)}</td>
              <td class="currency">${dreData.percentuais?.margem_contribuicao || 0}%</td>
            </tr>
            <tr>
              <td>(-) Despesas Fixas</td>
              <td class="currency negative">${formatCurrency(dreData.despesas_fixas)}</td>
              <td class="currency">${dreData.percentuais?.despesas_fixas || 0}%</td>
            </tr>
            <tr class="total-row">
              <td><strong>(=) Resultado Operacional</strong></td>
              <td class="currency ${dreData.resultado_operacional >= 0 ? 'positive' : 'negative'}">${formatCurrency(dreData.resultado_operacional)}</td>
              <td class="currency">${dreData.percentuais?.resultado_operacional || 0}%</td>
            </tr>
            <tr class="total-row" style="background-color: #dbeafe;">
              <td><strong>(=) LUCRO LÍQUIDO</strong></td>
              <td class="currency ${dreData.lucro_liquido >= 0 ? 'positive' : 'negative'}">${formatCurrency(dreData.lucro_liquido)}</td>
              <td class="currency">${dreData.percentuais?.lucro_liquido || 0}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>Relatório gerado automaticamente pelo Sistema Barber Analytics Pro</p>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

/**
 * Helper para formatação de moeda
 */
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
};

/**
 * Exporta dados para CSV (compatível com Excel)
 */
export const exportToCSV = (data, filename, headers) => {
  const csvRows = [headers];
  
  data.forEach(row => {
    csvRows.push(row);
  });

  const csvContent = csvRows.map(row => 
    row.map(field => `"${field}"`).join(';') // Separador para Excel BR
  ).join('\n');

  const BOM = '\uFEFF'; // Byte Order Mark para UTF-8
  const blob = new Blob([BOM + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporta elemento HTML para PDF usando jsPDF e html2canvas
 */
export const exportToPDF = async (elementId, filename, titulo = 'Relatório') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Elemento não encontrado');
    }

    // Capturar elemento como imagem
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Criar PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    
    // Dimensões da página A4
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    
    // Calcular dimensões da imagem
    const imgWidth = pageWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Header
    pdf.setFontSize(18);
    pdf.text('Barber Analytics Pro', margin, 20);
    
    pdf.setFontSize(14);
    pdf.text(titulo, margin, 35);
    
    pdf.setFontSize(10);
    pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, 45);
    
    // Linha separadora
    pdf.line(margin, 50, pageWidth - margin, 50);
    
    // Adicionar imagem do relatório
    let yPosition = 60;
    
    if (imgHeight > pageHeight - 100) {
      // Se a imagem for muito alta, dividir em páginas
      const maxHeight = pageHeight - 100;
      let remainingHeight = imgHeight;
      let sourceY = 0;
      
      while (remainingHeight > 0) {
        const currentHeight = Math.min(remainingHeight, maxHeight);
        const currentSourceHeight = (currentHeight * canvas.height) / imgHeight;
        
        // Criar canvas temporário para a seção atual
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = currentSourceHeight;
        
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(
          canvas,
          0, sourceY,
          canvas.width, currentSourceHeight,
          0, 0,
          canvas.width, currentSourceHeight
        );
        
        const tempImgData = tempCanvas.toDataURL('image/png');
        pdf.addImage(tempImgData, 'PNG', margin, yPosition, imgWidth, currentHeight);
        
        remainingHeight -= currentHeight;
        sourceY += currentSourceHeight;
        
        if (remainingHeight > 0) {
          pdf.addPage();
          yPosition = 20;
        }
      }
    } else {
      pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
    }
    
    // Footer
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.text(
        `Página ${i} de ${totalPages}`,
        pageWidth - margin - 30,
        pageHeight - 10
      );
      pdf.text(
        'Barber Analytics Pro © 2025',
        margin,
        pageHeight - 10
      );
    }
    
    // Salvar PDF
    pdf.save(`${filename}.pdf`);
    
    return {
      success: true,
      message: 'PDF exportado com sucesso!'
    };
    
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Exporta dados para Excel usando XLSX
 */
export const exportToExcel = (dados, filename, abas = null) => {
  try {
    const workbook = XLSX.utils.book_new();
    
    if (abas && Array.isArray(abas)) {
      // Múltiplas abas
      abas.forEach((aba, index) => {
        const worksheet = XLSX.utils.json_to_sheet(aba.dados);
        
        // Configurar largura das colunas
        if (aba.colunas) {
          worksheet['!cols'] = aba.colunas.map(col => ({ wch: col.width || 15 }));
        }
        
        XLSX.utils.book_append_sheet(workbook, worksheet, aba.nome || `Aba${index + 1}`);
      });
    } else {
      // Aba única
      const worksheet = XLSX.utils.json_to_sheet(dados);
      
      // Auto-ajustar largura das colunas
      const colWidths = {};
      dados.forEach(row => {
        Object.keys(row).forEach(key => {
          const value = String(row[key] || '');
          colWidths[key] = Math.max(colWidths[key] || 10, value.length);
        });
      });
      
      worksheet['!cols'] = Object.keys(colWidths).map(key => ({
        wch: Math.min(colWidths[key] + 2, 50)
      }));
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
    }
    
    // Salvar arquivo
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    
    return {
      success: true,
      message: 'Excel exportado com sucesso!'
    };
    
  } catch (error) {
    console.error('Erro ao exportar Excel:', error);
    return {
      success: false,
      error: error.message
    };
  }
};