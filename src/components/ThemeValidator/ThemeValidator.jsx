import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { contrastUtils } from '../../utils/accessibility';
import { Card } from '../../atoms/Card';
import { Button } from '../../atoms/Button';

// Componente para testar contraste de cores
export function ContrastTester() {
  const { theme } = useTheme();

  // Cores principais para testar - memoizadas para evitar recálculos desnecessários
  const colorTests = useMemo(
    () => [
      {
        name: 'Texto primário sobre fundo',
        foreground: theme === 'dark' ? '#FFFFFF' : '#1F2937',
        background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
        context: 'Texto principal do sistema',
      },
      {
        name: 'Botão primário',
        foreground: '#FFFFFF',
        background: '#3B82F6',
        context: 'Botões de ação principal',
      },
      {
        name: 'Link/botão secundário',
        foreground: '#3B82F6',
        background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
        context: 'Links e botões secundários',
      },
      {
        name: 'Texto de sucesso',
        foreground: '#10B981',
        background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
        context: 'Mensagens de sucesso',
      },
      {
        name: 'Texto de erro',
        foreground: '#EF4444',
        background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
        context: 'Mensagens de erro',
      },
      {
        name: 'Texto de aviso',
        foreground: '#F59E0B',
        background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
        context: 'Mensagens de aviso',
      },
      {
        name: 'Texto secundário',
        foreground: theme === 'dark' ? '#9CA3AF' : '#6B7280',
        background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
        context: 'Texto descritivo e labels',
      },
    ],
    [theme]
  );

  // Calcular resultados de contraste - memoizados para performance
  const testResults = useMemo(() => {
    return colorTests.map(test => {
      const contrast = contrastUtils.calculateContrast(
        test.foreground,
        test.background
      );
      const meetsAA = contrastUtils.meetsWCAGStandard(contrast, 'AA');
      const meetsAAA = contrastUtils.meetsWCAGStandard(contrast, 'AAA');
      return {
        ...test,
        contrast: contrast.toFixed(2),
        meetsAA,
        meetsAAA,
        level: meetsAAA ? 'AAA' : meetsAA ? 'AA' : 'Falha',
      };
    });
  }, [colorTests]);
  const getStatusColor = level => {
    switch (level) {
      case 'AAA':
        return 'text-green-600 dark:text-green-400';
      case 'AA':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-red-600 dark:text-red-400';
    }
  };
  const getStatusIcon = level => {
    switch (level) {
      case 'AAA':
        return '✅';
      case 'AA':
        return '⚠️';
      default:
        return '❌';
    }
  };
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-theme-primary dark:text-dark-text-primary">
          Validação de Contraste - Tema {theme === 'dark' ? 'Escuro' : 'Claro'}
        </h3>
        <div className="text-sm text-theme-secondary dark:text-gray-300 dark:text-gray-600">
          <span className="text-green-600">AAA ≥ 7:1</span> •
          <span className="text-yellow-600 ml-2">AA ≥ 4.5:1</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testResults.map((result, index) => (
          <motion.div
            key={result.name}
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              delay: index * 0.1,
            }}
          >
            <Card className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-theme-primary dark:text-dark-text-primary">
                  {result.name}
                </h4>
                <span className={`text-lg ${getStatusColor(result.level)}`}>
                  {getStatusIcon(result.level)}
                </span>
              </div>

              <div className="text-sm text-theme-secondary dark:text-gray-300 dark:text-gray-600">
                {result.context}
              </div>

              {/* Exemplo visual */}
              <div
                className="p-3 rounded border"
                style={{
                  backgroundColor: result.background,
                  color: result.foreground,
                  border: `1px solid ${result.foreground}20`,
                }}
              >
                Exemplo de texto
              </div>

              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="text-theme-secondary dark:text-gray-300 dark:text-gray-600">
                    Contraste:
                  </span>
                  <span
                    className={`ml-1 font-mono ${getStatusColor(result.level)}`}
                  >
                    {result.contrast}:1
                  </span>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(result.level)} bg-opacity-10`}
                >
                  {result.level}
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <div className="flex items-center space-x-1">
                  <div
                    className="w-3 h-3 rounded border"
                    style={{
                      backgroundColor: result.foreground,
                    }}
                  />
                  <span className="text-theme-secondary font-mono">
                    {result.foreground}
                  </span>
                </div>
                <span className="text-light-text-muted dark:text-dark-text-muted">
                  sobre
                </span>
                <div className="flex items-center space-x-1">
                  <div
                    className="w-3 h-3 rounded border"
                    style={{
                      backgroundColor: result.background,
                    }}
                  />
                  <span className="text-theme-secondary font-mono">
                    {result.background}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Resumo geral */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              Resumo da Validação
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
              {testResults.filter(r => r.level === 'AAA').length} excelentes •
              {testResults.filter(r => r.level === 'AA').length} adequados •
              {testResults.filter(r => r.level === 'Falha').length} precisam
              melhorar
            </p>
          </div>
          <div className="text-2xl">
            {testResults.filter(r => r.level === 'Falha').length === 0
              ? '🎉'
              : '⚠️'}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Componente principal de validação de tema
export function ThemeValidator() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('contrast');
  const tabs = [
    {
      id: 'contrast',
      label: 'Contraste',
      icon: '🎨',
    },
    {
      id: 'accessibility',
      label: 'Acessibilidade',
      icon: '♿',
    },
    {
      id: 'responsiveness',
      label: 'Responsividade',
      icon: '📱',
    },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-theme-primary dark:text-dark-text-primary">
          Validação de Tema e Acessibilidade
        </h2>
        <Button
          onClick={toggleTheme}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <span>{theme === 'dark' ? '🌞' : '🌙'}</span>
          <span>Alternar tema</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 card-theme dark:bg-dark-surface p-1 rounded-lg">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-md font-medium text-sm transition-all
              ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}
            `}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo das tabs */}
      <motion.div
        key={activeTab}
        initial={{
          opacity: 0,
          x: 20,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        transition={{
          duration: 0.2,
        }}
      >
        {activeTab === 'contrast' && <ContrastTester />}

        {activeTab === 'accessibility' && (
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Checklist de Acessibilidade
              </h3>
              <div className="space-y-3">
                {[
                  'Navegação por teclado implementada',
                  'Elementos focáveis possuem indicadores visuais',
                  'Textos alternativos em imagens',
                  'Estrutura semântica HTML adequada',
                  'Labels associadas aos campos de formulário',
                  'Skip links para conteúdo principal',
                  'Suporte a leitores de tela',
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <span className="text-green-500">✅</span>
                    <span className="text-gray-700 dark:text-gray-300 dark:text-gray-600">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'responsiveness' && (
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Breakpoints Suportados
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    size: 'xs',
                    width: '375px+',
                    label: 'Mobile S',
                  },
                  {
                    size: 'sm',
                    width: '640px+',
                    label: 'Mobile L',
                  },
                  {
                    size: 'md',
                    width: '768px+',
                    label: 'Tablet',
                  },
                  {
                    size: 'lg',
                    width: '1024px+',
                    label: 'Desktop',
                  },
                  {
                    size: 'xl',
                    width: '1280px+',
                    label: 'Desktop L',
                  },
                  {
                    size: '2xl',
                    width: '1536px+',
                    label: 'Desktop XL',
                  },
                  {
                    size: '3xl',
                    width: '1920px+',
                    label: '4K',
                  },
                ].map(bp => (
                  <div
                    key={bp.size}
                    className="text-center p-3 bg-light-bg dark:bg-dark-bg dark:bg-dark-surface rounded"
                  >
                    <div className="font-mono text-sm font-medium">
                      {bp.size}
                    </div>
                    <div className="text-xs text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                      {bp.width}
                    </div>
                    <div className="text-xs text-theme-secondary mt-1">
                      {bp.label}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
}
export default ThemeValidator;
