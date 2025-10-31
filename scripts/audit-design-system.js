#!/usr/bin/env node

/**
 * @file audit-design-system.js
 * @description Script de auditoria automatizada do Design System
 * @author Andrey Viana
 * @date 2025-10-31
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Padrões de violação do Design System
const VIOLATION_PATTERNS = {
  hardcodedColors: {
    pattern:
      /className=["'][^"']*(?:bg-white|bg-gray-\d+|text-gray-\d+|border-gray-\d+)(?!-)(?:[^"']*["'])/g,
    description:
      'Cores hardcoded (bg-white, bg-gray-*, text-gray-*, border-gray-*)',
    severity: 'CRITICAL',
  },
  hexColors: {
    pattern:
      /className=["'][^"']*(?:bg-\[#|text-\[#|border-\[#)[0-9A-Fa-f]{3,6}\](?:[^"']*["'])/g,
    description:
      'Valores hexadecimais inline (bg-[#...], text-[#...], border-[#...])',
    severity: 'CRITICAL',
  },
  inlineGradients: {
    pattern: /className=["'][^"']*bg-gradient-to-[rlbt](?:[^"']*["'])/g,
    description: 'Gradientes inline sem tokens (bg-gradient-to-*)',
    severity: 'HIGH',
  },
  missingDarkMode: {
    pattern:
      /className=["'][^"']*(?:bg-white|bg-gray-50|text-gray-900)(?!.*dark:)(?:[^"']*["'])/g,
    description: 'Elementos sem suporte a dark mode',
    severity: 'HIGH',
  },
  inlineStyles: {
    pattern: /style=\{\{[^}]+\}\}/g,
    description: 'Estilos inline (evitar quando possível)',
    severity: 'MEDIUM',
  },
};

// Tokens do Design System disponíveis
const AVAILABLE_TOKENS = {
  cardTheme: '.card-theme',
  textPrimary: '.text-theme-primary',
  textSecondary: '.text-theme-secondary',
  btnPrimary: '.btn-theme-primary',
  btnSecondary: '.btn-theme-secondary',
  inputTheme: '.input-theme',
  bgLightSurface: 'bg-light-surface',
  bgDarkSurface: 'bg-dark-surface',
};

class DesignSystemAuditor {
  constructor() {
    this.results = {
      totalFiles: 0,
      totalViolations: 0,
      violations: {},
      fileDetails: [],
      summary: {},
    };
  }

  /**
   * Executa auditoria completa
   */
  async run() {
    console.log('🔍 Iniciando auditoria do Design System...\n');

    const files = await this.getJSXFiles();
    this.results.totalFiles = files.length;

    console.log(`📁 Analisando ${files.length} arquivos JSX...\n`);

    for (const file of files) {
      this.auditFile(file);
    }

    this.generateSummary();
    this.printReport();
    this.saveReport();
  }

  /**
   * Busca todos os arquivos JSX
   */
  async getJSXFiles() {
    const srcPath = path.join(__dirname, '..', 'src');
    return await glob(`${srcPath}/**/*.{jsx,js}`, {
      ignore: ['**/node_modules/**', '**/*.test.js', '**/*.spec.js'],
    });
  }

  /**
   * Audita um arquivo específico
   */
  auditFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);

    const fileViolations = {
      file: relativePath,
      violations: {},
      totalViolations: 0,
    };

    // Verifica cada padrão de violação
    for (const [key, config] of Object.entries(VIOLATION_PATTERNS)) {
      const matches = content.match(config.pattern) || [];

      if (matches.length > 0) {
        fileViolations.violations[key] = {
          count: matches.length,
          severity: config.severity,
          description: config.description,
          examples: matches.slice(0, 3), // Primeiros 3 exemplos
        };

        fileViolations.totalViolations += matches.length;
        this.results.totalViolations += matches.length;

        // Acumula por tipo de violação
        if (!this.results.violations[key]) {
          this.results.violations[key] = {
            total: 0,
            files: [],
            severity: config.severity,
            description: config.description,
          };
        }
        this.results.violations[key].total += matches.length;
        this.results.violations[key].files.push({
          file: relativePath,
          count: matches.length,
        });
      }
    }

    if (fileViolations.totalViolations > 0) {
      this.results.fileDetails.push(fileViolations);
    }
  }

  /**
   * Gera resumo da auditoria
   */
  generateSummary() {
    const criticalFiles = this.results.fileDetails.filter(f =>
      Object.values(f.violations).some(v => v.severity === 'CRITICAL')
    );

    const highFiles = this.results.fileDetails.filter(f =>
      Object.values(f.violations).some(
        v =>
          v.severity === 'HIGH' &&
          !Object.values(f.violations).some(v2 => v2.severity === 'CRITICAL')
      )
    );

    this.results.summary = {
      totalFiles: this.results.totalFiles,
      filesWithViolations: this.results.fileDetails.length,
      filesClean: this.results.totalFiles - this.results.fileDetails.length,
      totalViolations: this.results.totalViolations,
      criticalFiles: criticalFiles.length,
      highFiles: highFiles.length,
      conformityRate: (
        ((this.results.totalFiles - this.results.fileDetails.length) /
          this.results.totalFiles) *
        100
      ).toFixed(2),
    };
  }

  /**
   * Imprime relatório no console
   */
  printReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO DE AUDITORIA DO DESIGN SYSTEM');
    console.log('='.repeat(80) + '\n');

    // Resumo Geral
    console.log('📈 RESUMO GERAL:');
    console.log(`   Total de Arquivos: ${this.results.summary.totalFiles}`);
    console.log(
      `   Arquivos com Violações: ${this.results.summary.filesWithViolations}`
    );
    console.log(`   Arquivos Limpos: ${this.results.summary.filesClean}`);
    console.log(
      `   Total de Violações: ${this.results.summary.totalViolations}`
    );
    console.log(
      `   Taxa de Conformidade: ${this.results.summary.conformityRate}%`
    );
    console.log('');

    // Violações por Tipo
    console.log('🔴 VIOLAÇÕES POR TIPO:');
    for (const [key, data] of Object.entries(this.results.violations)) {
      const severityIcon =
        data.severity === 'CRITICAL'
          ? '🔴'
          : data.severity === 'HIGH'
            ? '🟠'
            : '🟡';
      console.log(`   ${severityIcon} ${data.description}`);
      console.log(
        `      Total: ${data.total} ocorrências em ${data.files.length} arquivos`
      );
    }
    console.log('');

    // Top 10 Arquivos com Mais Violações
    console.log('📁 TOP 10 ARQUIVOS COM MAIS VIOLAÇÕES:');
    const topFiles = this.results.fileDetails
      .sort((a, b) => b.totalViolations - a.totalViolations)
      .slice(0, 10);

    topFiles.forEach((file, index) => {
      console.log(
        `   ${index + 1}. ${file.file} (${file.totalViolations} violações)`
      );
      for (const [type, violation] of Object.entries(file.violations)) {
        const icon =
          violation.severity === 'CRITICAL'
            ? '🔴'
            : violation.severity === 'HIGH'
              ? '🟠'
              : '🟡';
        console.log(
          `      ${icon} ${violation.description}: ${violation.count}`
        );
      }
    });
    console.log('');

    // Tokens Disponíveis
    console.log('✅ TOKENS DISPONÍVEIS PARA USO:');
    for (const [key, token] of Object.entries(AVAILABLE_TOKENS)) {
      console.log(`   • ${token}`);
    }
    console.log('');

    console.log('='.repeat(80));
    console.log(
      '💾 Relatório completo salvo em: reports/design-system-audit.json'
    );
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Salva relatório em JSON
   */
  saveReport() {
    const reportsDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, 'design-system-audit.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    // Salva também versão markdown
    this.saveMarkdownReport(reportsDir);
  }

  /**
   * Salva relatório em Markdown
   */
  saveMarkdownReport(reportsDir) {
    const mdPath = path.join(reportsDir, 'design-system-audit.md');
    const topFiles = this.results.fileDetails
      .sort((a, b) => b.totalViolations - a.totalViolations)
      .slice(0, 20);

    let md = `# 📊 Relatório de Auditoria do Design System\n\n`;
    md += `**Data:** ${new Date().toLocaleString('pt-BR')}\n\n`;
    md += `## 📈 Resumo Geral\n\n`;
    md += `- **Total de Arquivos:** ${this.results.summary.totalFiles}\n`;
    md += `- **Arquivos com Violações:** ${this.results.summary.filesWithViolations}\n`;
    md += `- **Arquivos Limpos:** ${this.results.summary.filesClean}\n`;
    md += `- **Total de Violações:** ${this.results.summary.totalViolations}\n`;
    md += `- **Taxa de Conformidade:** ${this.results.summary.conformityRate}%\n\n`;

    md += `## 🔴 Violações por Tipo\n\n`;
    md += `| Tipo | Severidade | Total | Arquivos |\n`;
    md += `|------|------------|-------|----------|\n`;
    for (const [key, data] of Object.entries(this.results.violations)) {
      md += `| ${data.description} | ${data.severity} | ${data.total} | ${data.files.length} |\n`;
    }
    md += `\n`;

    md += `## 📁 Top 20 Arquivos com Mais Violações\n\n`;
    md += `| # | Arquivo | Violações |\n`;
    md += `|---|---------|----------|\n`;
    topFiles.forEach((file, index) => {
      md += `| ${index + 1} | \`${file.file}\` | ${file.totalViolations} |\n`;
    });
    md += `\n`;

    md += `## ✅ Tokens Disponíveis\n\n`;
    for (const [key, token] of Object.entries(AVAILABLE_TOKENS)) {
      md += `- \`${token}\`\n`;
    }

    fs.writeFileSync(mdPath, md);
  }
}

// Executa auditoria
const auditor = new DesignSystemAuditor();
auditor.run().catch(console.error);
