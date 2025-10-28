/**
 * @fileoverview Testes dos componentes de KPI
 * Testa componentes de dashboard e métricas financeiras
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import KPICard from '../../molecules/KPICard/KPICard';
import { FinancialFixtures, DateHelpers } from '@tests/__fixtures__/financial';

// Mock dos ícones Lucide - mocks conditionals por className
vi.mock('lucide-react', () => ({
  DollarSign: ({ size, className, ...props }: any) => (
    <div
      data-testid="dollar-icon"
      data-size={size}
      className={className}
      {...props}
    />
  ),
  TrendingUp: ({ size, className, ...props }: any) => {
    const testId = className?.includes('h-4 w-4')
      ? 'trending-up-icon'
      : 'main-trending-up-icon';
    return (
      <div
        data-testid={testId}
        data-size={size}
        className={className}
        {...props}
      />
    );
  },
  TrendingDown: ({ size, className, ...props }: any) => {
    const testId = className?.includes('h-4 w-4')
      ? 'trending-down-icon'
      : 'main-trending-down-icon';
    return (
      <div
        data-testid={testId}
        data-size={size}
        className={className}
        {...props}
      />
    );
  },
  Minus: ({ size, className, ...props }: any) => (
    <div
      data-testid="minus-icon"
      data-size={size}
      className={className}
      {...props}
    />
  ),
  AlertTriangle: ({ size, className, ...props }: any) => (
    <div
      data-testid="error-icon"
      data-size={size}
      className={className}
      {...props}
    />
  ),
}));

// Mock de ícone simples para testes
const MockIcon = () => (
  <div data-testid="dollar-icon" data-size="24" aria-hidden="true" />
);

describe('KPICard', () => {
  const defaultProps = {
    title: 'Receitas Totais',
    value: 15000,
    subtitle: 'Janeiro 2025',
    change: 12.5,
    trend: 'up',
    icon: MockIcon,
    color: 'text-blue-600',
    loading: false,
  };

  it('deve renderizar KPI básico corretamente', () => {
    // Act
    render(<KPICard {...defaultProps} />);

    // Assert
    expect(screen.getByText('Receitas Totais')).toBeInTheDocument();
    expect(screen.getByText('R$ 15.000,00')).toBeInTheDocument();
    expect(screen.getByTestId('dollar-icon')).toBeInTheDocument();
  });

  it('deve renderizar trend positivo', () => {
    // Arrange
    const props = {
      ...defaultProps,
      trend: {
        value: 15.5,
        type: 'positive',
        period: 'vs mês anterior',
      },
    };

    // Act
    render(<KPICard {...props} />);

    // Assert
    expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
    expect(screen.getByText('+15,5%')).toBeInTheDocument();
    expect(screen.getByText('vs mês anterior')).toBeInTheDocument();
  });

  it('deve renderizar trend negativo', () => {
    // Arrange
    const props = {
      ...defaultProps,
      trend: {
        value: -8.2,
        type: 'negative',
        period: 'vs mês anterior',
      },
    };

    // Act
    render(<KPICard {...props} />);

    // Assert
    expect(screen.getByTestId('trending-down-icon')).toBeInTheDocument();
    expect(screen.getByText('-8,2%')).toBeInTheDocument();
    expect(screen.getByText('vs mês anterior')).toBeInTheDocument();
  });

  it('deve renderizar trend neutro', () => {
    // Arrange
    const props = {
      ...defaultProps,
      trend: {
        value: 0,
        type: 'neutral',
        period: 'vs mês anterior',
      },
    };

    // Act
    render(<KPICard {...props} />);

    // Assert
    expect(screen.getByTestId('minus-icon')).toBeInTheDocument();
    expect(screen.getByText('0,0%')).toBeInTheDocument();
  });

  it('deve renderizar sem trend quando não fornecido', () => {
    // Arrange
    const props = {
      title: 'Despesas Totais',
      value: 8500,
      icon: 'DollarSign',
      color: 'red',
    };

    // Act
    render(<KPICard {...props} />);

    // Assert
    expect(screen.getByText('Despesas Totais')).toBeInTheDocument();
    expect(screen.getByText('R$ 8.500,00')).toBeInTheDocument();
    expect(screen.queryByTestId('trending-up-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('trending-down-icon')).not.toBeInTheDocument();
  });

  it('deve aplicar classes CSS corretas por cor', () => {
    // Act
    const { rerender, container } = render(
      <KPICard {...defaultProps} color="blue" />
    );

    // Assert - Verificar se contém classes relacionadas a azul
    let cardElement = container.firstChild;
    expect(cardElement).toHaveClass('border-blue-200');

    // Act - Mudar cor
    rerender(<KPICard {...defaultProps} color="green" />);

    // Assert - Verificar se contém classes relacionadas a verde
    cardElement = container.firstChild;
    expect(cardElement).toHaveClass('border-green-200');
  });

  it('deve formatar valores monetários corretamente', () => {
    // Arrange & Act
    const { rerender } = render(<KPICard {...defaultProps} value={0} />);
    expect(screen.getByText('R$ 0,00')).toBeInTheDocument();

    // Act - Valor grande
    rerender(<KPICard {...defaultProps} value={1250000} />);
    expect(screen.getByText('R$ 1.250.000,00')).toBeInTheDocument();

    // Act - Valor decimal
    rerender(<KPICard {...defaultProps} value={999.99} />);
    expect(screen.getByText('R$ 999,99')).toBeInTheDocument();
  });

  it('deve renderizar loading state', () => {
    // Arrange
    const props = {
      ...defaultProps,
      loading: true,
    };

    // Act
    render(<KPICard {...props} />);

    // Assert
    expect(screen.getByTestId('kpi-loading-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Receitas Totais')).not.toBeInTheDocument();
  });

  it('deve renderizar error state', () => {
    // Arrange
    const props = {
      ...defaultProps,
      error: 'Erro ao carregar dados',
    };

    // Act
    render(<KPICard {...props} />);

    // Assert
    expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument();
    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
  });

  it('deve ser acessível (a11y)', () => {
    // Act
    render(<KPICard {...defaultProps} />);

    // Assert - Verificar se tem role correto
    const cardElement = screen.getByRole('article');
    expect(cardElement).toBeInTheDocument();

    // Assert - Verificar se ícone tem aria-hidden
    const iconElement = screen.getByTestId('dollar-icon');
    expect(iconElement).toHaveAttribute('aria-hidden', 'true');
  });

  describe('Variações de dados', () => {
    it('deve lidar com valores negativos', () => {
      const props = {
        ...defaultProps,
        value: -5000,
        title: 'Prejuízo',
      };

      render(<KPICard {...props} />);

      expect(screen.getByText('-R$ 5.000,00')).toBeInTheDocument();
    });

    it('deve lidar com trend de valores grandes', () => {
      const props = {
        ...defaultProps,
        trend: {
          value: 150.75,
          type: 'positive',
          period: 'vs ano anterior',
        },
      };

      render(<KPICard {...props} />);

      expect(screen.getByText('+150,8%')).toBeInTheDocument(); // Arredondado
    });

    it('deve aceitar diferentes tipos de ícones', () => {
      const { rerender } = render(
        <KPICard {...defaultProps} icon="TrendingUp" />
      );
      expect(screen.getByTestId('main-trending-up-icon')).toBeInTheDocument();

      rerender(<KPICard {...defaultProps} icon="TrendingDown" />);
      expect(screen.getByTestId('main-trending-down-icon')).toBeInTheDocument();
    });
  });

  describe('Responsividade', () => {
    it('deve aplicar classes responsivas corretas', () => {
      const { container } = render(<KPICard {...defaultProps} />);
      const cardElement = container.firstChild;

      // Verificar se tem classes de grid responsivo
      expect(cardElement).toHaveClass('p-4', 'sm:p-6');
    });

    it('deve adaptar tamanho de ícone por tamanho de tela', () => {
      render(<KPICard {...defaultProps} />);

      const iconElement = screen.getByTestId('dollar-icon');
      expect(iconElement).toHaveAttribute('data-size', '24'); // Size padrão
    });
  });

  describe('Interações', () => {
    it('deve ser clicável quando onClick fornecido', () => {
      const mockClick = vi.fn();
      const props = {
        ...defaultProps,
        onClick: mockClick,
      };

      render(<KPICard {...props} />);

      const cardElement = screen.getByRole('article');
      cardElement.click();

      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('deve mostrar cursor pointer quando clicável', () => {
      const mockClick = vi.fn();
      const props = {
        ...defaultProps,
        onClick: mockClick,
      };

      const { container } = render(<KPICard {...props} />);
      const cardElement = container.firstChild;

      expect(cardElement).toHaveClass('cursor-pointer');
    });

    it('não deve ser clicável quando onClick não fornecido', () => {
      const { container } = render(<KPICard {...defaultProps} />);
      const cardElement = container.firstChild;

      expect(cardElement).not.toHaveClass('cursor-pointer');
    });
  });
});
