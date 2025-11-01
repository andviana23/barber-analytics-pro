/**
 * Script de Migração Automatizada - Design System
 *
 * Aplica transformações AST para corrigir violações de Design System automaticamente.
 * Suporta dry-run, backup automático e processamento em lote.
 *
 * @author Andrey Viana
 * @version 1.0.0
 */

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Regras de transformação AST
const TRANSFORMATION_RULES = {
  // Regra 1: Cores hardcoded → tokens do Design System
  hardcodedColors: {
    'bg-white': 'bg-light-surface dark:bg-dark-surface',
    'bg-gray-50': 'bg-light-bg dark:bg-dark-bg',
    'bg-gray-100': 'bg-light-surface dark:bg-dark-surface',
    'bg-gray-200': 'bg-gray-200 dark:bg-gray-700', // Skeleton/loading states
    'bg-gray-300': 'bg-gray-300 dark:bg-gray-600',
    'bg-gray-800': 'bg-dark-surface',
    'bg-gray-900': 'bg-dark-surface',

    'text-gray-900': 'text-light-text-primary dark:text-dark-text-primary',
    'text-gray-800': 'text-light-text-primary dark:text-dark-text-primary',
    'text-gray-700': 'text-gray-700 dark:text-gray-300',
    'text-gray-600': 'text-light-text-secondary dark:text-dark-text-secondary',
    'text-gray-500': 'text-light-text-secondary dark:text-dark-text-secondary',
    'text-gray-400': 'text-light-text-muted dark:text-dark-text-muted',
    'text-gray-300': 'text-gray-300 dark:text-gray-600',
    'text-black': 'text-light-text-primary',
    'text-white': 'text-dark-text-primary',

    'border-gray-200': 'border-light-border dark:border-dark-border',
    'border-gray-300': 'border-light-border dark:border-dark-border',
    'border-gray-500': 'border-gray-500 dark:border-gray-400',
    'border-gray-600': 'border-dark-border',
    'border-gray-700': 'border-dark-border',
    'border-white': 'border-light-surface dark:border-dark-surface',
  },

  // Regra 2: Simplificar para classes utilitárias (segunda passagem)
  themeClasses: {
    'bg-light-surface dark:bg-dark-surface': 'card-theme',
    'text-light-text-primary dark:text-dark-text-primary': 'text-theme-primary',
    'text-light-text-secondary dark:text-dark-text-secondary':
      'text-theme-secondary',
  },

  // Regra 3: Hex inline → tokens
  hexInline: {
    'bg-[#FFFFFF]': 'bg-light-surface',
    'bg-[#ffffff]': 'bg-light-surface',
    'bg-[#fff]': 'bg-light-surface',
    'bg-[#1A1F2C]': 'bg-dark-surface',
    'bg-[#1a1f2c]': 'bg-dark-surface',
    'text-[#1A1F2C]': 'text-light-text-primary',
    'text-[#1a1f2c]': 'text-light-text-primary',
    'text-[#667085]': 'text-light-text-secondary',
    'border-[#E4E8EE]': 'border-light-border',
    'border-[#e4e8ee]': 'border-light-border',
  },

  // Regra 4: Gradientes inline → tokens (Sprint 3)
  gradientInline: {
    // Gradientes primários (azul)
    'bg-gradient-to-r from-blue-500 to-cyan-600': 'bg-gradient-primary',
    'bg-gradient-to-r from-blue-500 to-blue-600': 'bg-gradient-primary',
    'bg-gradient-to-br from-blue-500 to-cyan-600': 'bg-gradient-primary',
    'bg-gradient-to-r from-[#1E8CFF] to-[#0072E0]': 'bg-gradient-primary',
    'bg-gradient-to-br from-blue-600 to-cyan-600': 'bg-gradient-primary',
    'bg-gradient-to-r from-blue-600 to-blue-700': 'bg-gradient-primary',

    // Gradientes de sucesso (verde)
    'bg-gradient-to-r from-green-500 to-emerald-600': 'bg-gradient-success',
    'bg-gradient-to-r from-green-500 to-green-600': 'bg-gradient-success',
    'bg-gradient-to-br from-green-500 to-emerald-600': 'bg-gradient-success',
    'bg-gradient-to-r from-emerald-500 to-teal-600': 'bg-gradient-emerald',
    'bg-gradient-to-br from-green-600 to-emerald-600': 'bg-gradient-success',

    // Gradientes de erro (vermelho)
    'bg-gradient-to-r from-red-500 to-red-600': 'bg-gradient-error',
    'bg-gradient-to-r from-red-500 to-pink-600': 'bg-gradient-error',
    'bg-gradient-to-br from-red-500 to-red-600': 'bg-gradient-error',
    'bg-gradient-to-r from-red-600 to-red-700': 'bg-gradient-error',

    // Gradientes de warning (laranja/amarelo)
    'bg-gradient-to-r from-yellow-500 to-orange-600': 'bg-gradient-warning',
    'bg-gradient-to-r from-orange-500 to-orange-600': 'bg-gradient-orange',
    'bg-gradient-to-br from-amber-500 to-orange-600': 'bg-gradient-warning',
    'bg-gradient-to-r from-yellow-400 to-orange-500': 'bg-gradient-warning',

    // Gradientes de info (azul claro)
    'bg-gradient-to-r from-blue-400 to-blue-500': 'bg-gradient-info',
    'bg-gradient-to-br from-blue-400 to-blue-600': 'bg-gradient-info',
    'bg-gradient-to-r from-sky-500 to-blue-600': 'bg-gradient-info',

    // Gradientes especiais (purple)
    'bg-gradient-to-r from-purple-500 to-purple-600': 'bg-gradient-purple',
    'bg-gradient-to-r from-purple-500 to-pink-600': 'bg-gradient-purple',
    'bg-gradient-to-br from-purple-500 to-purple-600': 'bg-gradient-purple',
    'bg-gradient-to-r from-indigo-500 to-purple-600': 'bg-gradient-purple',
    'bg-gradient-to-r from-violet-500 to-purple-600': 'bg-gradient-purple',

    // Gradientes especiais (cyan)
    'bg-gradient-to-r from-cyan-500 to-blue-600': 'bg-gradient-cyan',
    'bg-gradient-to-br from-cyan-500 to-blue-600': 'bg-gradient-cyan',
    'bg-gradient-to-r from-cyan-400 to-cyan-600': 'bg-gradient-cyan',

    // Gradientes sutis (backgrounds)
    'bg-gradient-to-r from-gray-50 to-gray-100': 'bg-gradient-light',
    'bg-gradient-to-br from-gray-50 to-gray-100': 'bg-gradient-light',
    'bg-gradient-to-r from-gray-100 to-gray-200': 'bg-gradient-light',
    'bg-gradient-to-r from-gray-800 to-gray-900': 'bg-gradient-dark',
    'bg-gradient-to-br from-gray-800 to-gray-900': 'bg-gradient-dark',
    'bg-gradient-to-r from-gray-700 to-gray-900': 'bg-gradient-dark',

    // Sprint 4: Gradientes com VIA (3 cores)
    'bg-gradient-to-r from-blue-400 via-purple-500 to-pink-600':
      'bg-gradient-purple',
    'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600':
      'bg-gradient-emerald',
    'bg-gradient-to-r from-red-400 via-pink-500 to-rose-600':
      'bg-gradient-error',
    'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600':
      'bg-gradient-warning',
    'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600':
      'bg-gradient-cyan',
    'bg-gradient-to-br from-blue-400 via-purple-500 to-pink-600':
      'bg-gradient-purple',
    'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600':
      'bg-gradient-emerald',

    // Sprint 4: Direções variadas
    'bg-gradient-to-bl from-blue-500 to-cyan-600': 'bg-gradient-primary',
    'bg-gradient-to-tr from-blue-500 to-cyan-600': 'bg-gradient-primary',
    'bg-gradient-to-tl from-blue-500 to-cyan-600': 'bg-gradient-primary',
    'bg-gradient-to-b from-blue-500 to-cyan-600': 'bg-gradient-primary',
    'bg-gradient-to-t from-blue-500 to-cyan-600': 'bg-gradient-primary',
    'bg-gradient-to-l from-blue-500 to-cyan-600': 'bg-gradient-primary',
    'bg-gradient-to-bl from-green-500 to-emerald-600': 'bg-gradient-success',
    'bg-gradient-to-tr from-green-500 to-emerald-600': 'bg-gradient-success',
    'bg-gradient-to-b from-green-500 to-emerald-600': 'bg-gradient-success',
    'bg-gradient-to-bl from-red-500 to-red-600': 'bg-gradient-error',
    'bg-gradient-to-tr from-red-500 to-red-600': 'bg-gradient-error',

    // Sprint 4: Variações de tonalidade
    'bg-gradient-to-r from-blue-300 to-blue-500': 'bg-gradient-info',
    'bg-gradient-to-r from-blue-600 to-cyan-700': 'bg-gradient-primary',
    'bg-gradient-to-r from-green-300 to-green-500': 'bg-gradient-success',
    'bg-gradient-to-r from-green-600 to-emerald-700': 'bg-gradient-success',
    'bg-gradient-to-r from-red-300 to-red-500': 'bg-gradient-error',
    'bg-gradient-to-r from-red-600 to-red-700': 'bg-gradient-error',
    'bg-gradient-to-r from-purple-300 to-purple-500': 'bg-gradient-purple',
    'bg-gradient-to-r from-purple-600 to-purple-700': 'bg-gradient-purple',
    'bg-gradient-to-r from-orange-300 to-orange-500': 'bg-gradient-orange',
    'bg-gradient-to-r from-orange-600 to-orange-700': 'bg-gradient-orange',

    // Sprint 4: Gradientes com teal e indigo
    'bg-gradient-to-r from-teal-500 to-cyan-600': 'bg-gradient-cyan',
    'bg-gradient-to-r from-teal-400 to-emerald-500': 'bg-gradient-emerald',
    'bg-gradient-to-r from-indigo-500 to-blue-600': 'bg-gradient-primary',
    'bg-gradient-to-r from-indigo-400 to-purple-500': 'bg-gradient-purple',
    'bg-gradient-to-br from-teal-500 to-cyan-600': 'bg-gradient-cyan',
    'bg-gradient-to-br from-indigo-500 to-purple-600': 'bg-gradient-purple',

    // Sprint 4: Gradientes com rose e pink
    'bg-gradient-to-r from-pink-500 to-rose-600': 'bg-gradient-error',
    'bg-gradient-to-r from-rose-500 to-red-600': 'bg-gradient-error',
    'bg-gradient-to-br from-pink-500 to-rose-600': 'bg-gradient-error',

    // Sprint 4: Gradientes com lime e yellow
    'bg-gradient-to-r from-lime-500 to-green-600': 'bg-gradient-success',
    'bg-gradient-to-r from-yellow-300 to-yellow-500': 'bg-gradient-warning',
    'bg-gradient-to-r from-amber-400 to-orange-500': 'bg-gradient-warning',

    // Sprint 4: Gradientes com slate e zinc (neutros)
    'bg-gradient-to-r from-slate-50 to-slate-100': 'bg-gradient-light',
    'bg-gradient-to-r from-slate-800 to-slate-900': 'bg-gradient-dark',
    'bg-gradient-to-r from-zinc-50 to-zinc-100': 'bg-gradient-light',
    'bg-gradient-to-r from-zinc-800 to-zinc-900': 'bg-gradient-dark',
    'bg-gradient-to-br from-slate-50 to-gray-100': 'bg-gradient-light',
    'bg-gradient-to-br from-gray-50 via-white to-gray-100': 'bg-gradient-light',

    // Sprint 4: Gradientes específicos do GoalsPage
    'bg-gradient-to-r from-blue-500 to-indigo-600': 'bg-gradient-primary',
    'bg-gradient-to-r from-emerald-500 to-green-600': 'bg-gradient-success',
    'bg-gradient-to-r from-violet-500 to-purple-600': 'bg-gradient-purple',
    'bg-gradient-to-r from-sky-400 to-blue-500': 'bg-gradient-info',
    'bg-gradient-to-r from-amber-500 to-yellow-600': 'bg-gradient-warning',

    // Sprint 4: Gradientes com fuchsia
    'bg-gradient-to-r from-fuchsia-500 to-pink-600': 'bg-gradient-purple',
    'bg-gradient-to-r from-fuchsia-400 to-purple-500': 'bg-gradient-purple',
    'bg-gradient-to-br from-fuchsia-500 to-pink-600': 'bg-gradient-purple',

    // Sprint 4: Combinações específicas
    'bg-gradient-to-r from-blue-400 to-cyan-500': 'bg-gradient-cyan',
    'bg-gradient-to-r from-green-400 to-teal-500': 'bg-gradient-emerald',
    'bg-gradient-to-r from-purple-400 to-indigo-500': 'bg-gradient-purple',
    'bg-gradient-to-r from-red-400 to-rose-500': 'bg-gradient-error',

    // Sprint 5: GoalsPage specific gradients (13 patterns)
    'from-green-600 to-emerald-600': 'bg-gradient-success',
    'from-blue-600 to-indigo-600': 'bg-gradient-primary',
    'from-purple-600 to-pink-600': 'bg-gradient-purple',
    'from-red-600 to-rose-600': 'bg-gradient-error',
    'from-orange-600 to-amber-600': 'bg-gradient-orange',
    'from-gray-600 to-gray-700': 'bg-gradient-dark',
    'from-green-500 to-emerald-500': 'bg-gradient-success',
    'from-blue-500 to-indigo-500': 'bg-gradient-primary',
    'from-purple-500 to-pink-500': 'bg-gradient-purple',
    'from-red-500 to-rose-500': 'bg-gradient-error',
    'from-orange-500 to-amber-500': 'bg-gradient-orange',
    'from-indigo-50 to-blue-50': 'bg-gradient-light',
    'from-indigo-900/30 to-blue-900/30': 'bg-gradient-dark',
  },
};

/**
 * Remove classes duplicadas do className
 * @param {string} className - String com classes CSS
 * @returns {string} String com classes únicas
 */
function deduplicateClasses(className) {
  if (!className || typeof className !== 'string') {
    return className;
  }

  const classes = className.split(/\s+/).filter(Boolean);
  const uniqueClasses = [...new Set(classes)];
  return uniqueClasses.join(' ');
}

/**
 * Aplica transformações em um className
 */
function transformClassName(className) {
  let transformed = className;

  // Primeira passagem: cores hardcoded → tokens
  Object.entries(TRANSFORMATION_RULES.hardcodedColors).forEach(
    ([old, newVal]) => {
      const regex = new RegExp(
        `\\b${old.replace(/\[/g, '\\[').replace(/\]/g, '\\]')}\\b`,
        'g'
      );
      transformed = transformed.replace(regex, newVal);
    }
  );

  // Segunda passagem: hex inline → tokens
  Object.entries(TRANSFORMATION_RULES.hexInline).forEach(([old, newVal]) => {
    transformed = transformed.replace(old, newVal);
  });

  // Terceira passagem: gradientes inline → tokens (Sprint 3)
  Object.entries(TRANSFORMATION_RULES.gradientInline).forEach(
    ([old, newVal]) => {
      // Escape special characters for regex
      const escapedOld = old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedOld, 'g');
      transformed = transformed.replace(regex, newVal);
    }
  );

  // Quarta passagem: simplificar para classes utilitárias
  Object.entries(TRANSFORMATION_RULES.themeClasses).forEach(([old, newVal]) => {
    transformed = transformed.replace(old, newVal);
  });

  // Quinta passagem: deduplicar classes (Sprint 3)
  transformed = deduplicateClasses(transformed);

  return transformed;
}

/**
 * Migra um arquivo individual
 */
async function migrateFile(filePath, options = {}) {
  const { dryRun = false, backup = true, verbose = false } = options;

  try {
    // 1. Ler arquivo
    const content = await fs.readFile(filePath, 'utf-8');

    // 2. Backup (se solicitado e não for dry-run)
    if (backup && !dryRun) {
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .split('T')[0];
      const backupPath = `${filePath}.backup-${timestamp}`;
      await fs.writeFile(backupPath, content);
      if (verbose) {
        console.log(`📦 Backup criado: ${backupPath}`);
      }
    }

    // 3. Parse AST
    const ast = parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    let modified = false;
    const changes = [];

    // 4. Transformar AST
    traverse.default(ast, {
      JSXAttribute(astPath) {
        if (astPath.node.name.name !== 'className') return;

        const value = astPath.node.value;
        if (value.type !== 'StringLiteral') return;

        const originalClassName = value.value;
        const transformedClassName = transformClassName(originalClassName);

        if (transformedClassName !== originalClassName) {
          value.value = transformedClassName;
          modified = true;
          changes.push({
            line: astPath.node.loc.start.line,
            from: originalClassName,
            to: transformedClassName,
          });
        }
      },
    });

    // 5. Gerar código transformado
    if (modified) {
      const output = generate.default(ast, {}, content);

      if (dryRun) {
        console.log(`\n[DRY RUN] 📝 ${filePath}`);
        console.log(`  ${changes.length} transformação(ões) seriam aplicadas:`);
        changes.forEach(change => {
          console.log(`    Linha ${change.line}:`);
          console.log(`      ❌ ${change.from}`);
          console.log(`      ✅ ${change.to}`);
        });
        return { modified: true, path: filePath, changes, dryRun: true };
      } else {
        await fs.writeFile(filePath, output.code);
        console.log(`✅ Migrado: ${filePath} (${changes.length} alterações)`);
        if (verbose) {
          changes.forEach(change => {
            console.log(
              `    Linha ${change.line}: ${change.from} → ${change.to}`
            );
          });
        }
        return { modified: true, path: filePath, changes };
      }
    } else {
      if (verbose) {
        console.log(`⏭️  Sem alterações: ${filePath}`);
      }
      return { modified: false, path: filePath };
    }
  } catch (error) {
    console.error(`❌ Erro em ${filePath}:`, error.message);
    return { error: error.message, path: filePath };
  }
}

/**
 * Processa múltiplos arquivos
 */
async function migrateBatch(filePaths, options) {
  const results = {
    modified: [],
    unmodified: [],
    errors: [],
    totalChanges: 0,
  };

  console.log(`\n🚀 Iniciando migração de ${filePaths.length} arquivo(s)...\n`);

  for (const filePath of filePaths) {
    const result = await migrateFile(filePath, options);

    if (result.error) {
      results.errors.push({ path: filePath, error: result.error });
    } else if (result.modified) {
      results.modified.push(result);
      results.totalChanges += result.changes?.length || 0;
    } else {
      results.unmodified.push(filePath);
    }
  }

  return results;
}

/**
 * Encontra TOP N arquivos com mais violações
 */
async function getTopViolators(n = 10) {
  const auditReportPath = path.join(
    __dirname,
    '../reports/design-system-audit.json'
  );

  try {
    const reportData = await fs.readFile(auditReportPath, 'utf-8');
    const report = JSON.parse(reportData);

    // Coletar todos os arquivos com violações de todas as categorias
    const fileViolationMap = new Map();

    // Processar cada tipo de violação
    if (report.violations) {
      Object.values(report.violations).forEach(category => {
        if (category.files && Array.isArray(category.files)) {
          category.files.forEach(fileEntry => {
            const filePath = path.join(__dirname, '..', fileEntry.file);
            const currentCount = fileViolationMap.get(filePath) || 0;
            fileViolationMap.set(filePath, currentCount + fileEntry.count);
          });
        }
      });
    }

    // Converter para array e ordenar por contagem
    const sortedFiles = Array.from(fileViolationMap.entries())
      .map(([filePath, count]) => ({ path: filePath, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);

    return sortedFiles.map(file => file.path);
  } catch (error) {
    console.error('❌ Erro ao ler relatório de auditoria:', error.message);
    console.error('Execute `npm run audit:design-system` primeiro.');
    return [];
  }
}

/**
 * CLI - Ponto de entrada
 */
async function main() {
  const args = process.argv.slice(2);

  const options = {
    dryRun: args.includes('--dry-run'),
    backup: !args.includes('--no-backup'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };

  let filePaths = [];

  // Determinar quais arquivos processar
  if (args.includes('--file')) {
    const fileIndex = args.indexOf('--file');
    const filePath = args[fileIndex + 1];
    if (!filePath) {
      console.error('❌ Erro: --file requer um caminho de arquivo');
      process.exit(1);
    }
    filePaths = [path.resolve(filePath)];
  } else if (args.includes('--top')) {
    const topIndex = args.indexOf('--top');
    const topN = parseInt(args[topIndex + 1], 10);
    if (isNaN(topN)) {
      console.error('❌ Erro: --top requer um número');
      process.exit(1);
    }
    console.log(`🔍 Buscando TOP ${topN} arquivos com mais violações...\n`);
    filePaths = await getTopViolators(topN);
  } else if (args.includes('--all')) {
    console.log('🔍 Buscando todos os arquivos JSX...\n');
    const srcPath = path.join(__dirname, '../src');
    filePaths = await glob('**/*.{js,jsx}', { cwd: srcPath, absolute: true });
  } else {
    // Default: TOP 3
    console.log(
      '🔍 Buscando TOP 3 arquivos com mais violações (use --help para ver opções)...\n'
    );
    filePaths = await getTopViolators(3);
  }

  if (filePaths.length === 0) {
    console.error('❌ Nenhum arquivo encontrado para processar');
    process.exit(1);
  }

  // Processar arquivos
  const results = await migrateBatch(filePaths, options);

  // Resumo
  console.log('\n📊 RESUMO DA MIGRAÇÃO\n');
  console.log(`✅ Arquivos modificados: ${results.modified.length}`);
  console.log(`⏭️  Arquivos sem alterações: ${results.unmodified.length}`);
  console.log(`❌ Arquivos com erro: ${results.errors.length}`);
  console.log(`📝 Total de transformações: ${results.totalChanges}`);

  if (options.dryRun) {
    console.log(
      '\n⚠️  DRY RUN: Nenhuma alteração foi salva. Remova --dry-run para aplicar.'
    );
  }

  if (results.errors.length > 0) {
    console.log('\n❌ Erros:');
    results.errors.forEach(({ path: p, error }) => {
      console.log(`  ${p}: ${error}`);
    });
  }

  if (results.modified.length > 0 && !options.dryRun) {
    console.log('\n✅ Próximos passos:');
    console.log('  1. Execute os testes: npm test');
    console.log('  2. Execute os testes E2E: npm run test:e2e');
    console.log('  3. Re-execute a auditoria: npm run audit:design-system');
    console.log('  4. Verifique o ESLint: npm run lint');
  }
}

// Executar
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
