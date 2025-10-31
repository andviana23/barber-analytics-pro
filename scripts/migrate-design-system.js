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
    'bg-gray-800': 'bg-dark-surface',
    'bg-gray-900': 'bg-dark-surface',

    'text-gray-900': 'text-light-text-primary dark:text-dark-text-primary',
    'text-gray-800': 'text-light-text-primary dark:text-dark-text-primary',
    'text-gray-600': 'text-light-text-secondary dark:text-dark-text-secondary',
    'text-gray-500': 'text-light-text-secondary dark:text-dark-text-secondary',
    'text-gray-400': 'text-light-text-muted dark:text-dark-text-muted',
    'text-black': 'text-light-text-primary',
    'text-white': 'text-dark-text-primary',

    'border-gray-200': 'border-light-border dark:border-dark-border',
    'border-gray-300': 'border-light-border dark:border-dark-border',
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
};

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

  // Terceira passagem: simplificar para classes utilitárias
  Object.entries(TRANSFORMATION_RULES.themeClasses).forEach(([old, newVal]) => {
    transformed = transformed.replace(old, newVal);
  });

  // Remover espaços duplicados
  transformed = transformed.replace(/\s+/g, ' ').trim();

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
