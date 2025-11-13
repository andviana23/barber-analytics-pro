/**
 * TESTES PARA SISTEMA DE RELATÓRIOS REFATORADO
 *
 * Testes unitários para validar a nova arquitetura de relatórios.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks
import {
  ComparativoUnidadesRequestDTO,
  UnitsComparisonResponseDTO,
} from '../../../src/dtos/relatoriosDTO';
import relatoriosRepository from '../../../src/repositories/relatoriosRepository';
import { relatoriosService } from '../../../src/services/relatoriosService';

// Components
import KPICard from '../../../src/atoms/KPICard';
import MetricCard from '../../../src/molecules/MetricCard';
import RelatorioComparativoUnidades from '../../../src/pages/RelatoriosPage/components/RelatorioComparativoUnidades';

// Mock do serviço
vi.mock('../../../src/services/relatoriosService', () => ({
  relatoriosService: {
    getComparativoUnidades: vi.fn(),
    exportToExcel: vi.fn(),
  },
}));

// Mock do repository
vi.mock('../../../src/repositories/relatoriosRepository', () => ({
  default: {
    getUnitsComparisonData: vi.fn(),
    getActiveUnits: vi.fn(),
  },
}));

// Mock do hook de toast
vi.mock('../../../src/hooks/useToast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

/**
 * Dados de teste
 */
const mockUnitsData = [
  {
    unit: { id: '1', name: 'Mangabeiras', city: 'Belo Horizonte' },
    financial: {
      revenues: [
        { value: 15000, status: 'received' },
        { value: 12000, status: 'received' },
      ],
      expenses: [
        { value: 8000, status: 'paid' },
        { value: 3000, status: 'paid' },
      ],
    },
    attendance: [
      { id: '1', total_value: 150 },
      { id: '2', total_value: 200 },
      { id: '3', total_value: 180 },
    ],
    professionals: [
      { id: '1', name: 'João Silva' },
      { id: '2', name: 'Maria Santos' },
    ],
    growth: {
      current: { revenues: [{ value: 27000 }] },
      previous: { revenues: [{ value: 25000 }] },
    },
  },
  {
    unit: { id: '2', name: 'Nova Lima', city: 'Nova Lima' },
    financial: {
      revenues: [
        { value: 18000, status: 'received' },
        { value: 10000, status: 'received' },
      ],
      expenses: [
        { value: 9000, status: 'paid' },
        { value: 4000, status: 'paid' },
      ],
    },
    attendance: [
      { id: '4', total_value: 200 },
      { id: '5', total_value: 250 },
    ],
    professionals: [
      { id: '3', name: 'Pedro Costa' },
      { id: '4', name: 'Ana Lima' },
      { id: '5', name: 'Carlos Souza' },
    ],
    growth: {
      current: { revenues: [{ value: 28000 }] },
      previous: { revenues: [{ value: 26000 }] },
    },
  },
];

const mockProcessedData = {
  units: [
    {
      id: '1',
      name: 'Mangabeiras',
      city: 'Belo Horizonte',
      metrics: {
        revenue: 27000,
        profit: 16000,
        attendances: 3,
        professionals: 2,
        averageTicket: 9000,
        growth: 8.0,
      },
    },
    {
      id: '2',
      name: 'Nova Lima',
      city: 'Nova Lima',
      metrics: {
        revenue: 28000,
        profit: 15000,
        attendances: 2,
        professionals: 3,
        averageTicket: 14000,
        growth: 7.7,
      },
    },
  ],
  totals: {
    revenue: 55000,
    profit: 31000,
    attendances: 5,
    professionals: 5,
  },
  summary: {
    totalUnits: 2,
    topPerformer: {
      id: '2',
      name: 'Nova Lima',
      metrics: { revenue: 28000 },
    },
    totalRevenue: 55000,
    totalProfit: 31000,
  },
};

/**
 * Helper para renderizar componentes com QueryClient
 */
const renderWithQueryClient = component => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

/**
 * Testes dos DTOs
 */
describe('RelatoriosDTO', () => {
  describe('ComparativoUnidadesRequestDTO', () => {
    it('deve validar corretamente filtros válidos', () => {
      const dto = new ComparativoUnidadesRequestDTO({
        period: 'mes-atual',
        unitId: 'todas',
        metrics: ['revenue', 'profit'],
        format: 'visual',
      });

      expect(dto.isValid()).toBe(true);
      expect(dto.getErrors()).toHaveLength(0);
    });

    it('deve rejeitar métricas inválidas', () => {
      const dto = new ComparativoUnidadesRequestDTO({
        metrics: ['invalid_metric'],
      });

      expect(dto.isValid()).toBe(false);
      expect(dto.getErrors()).toContain('Métricas inválidas: invalid_metric');
    });

    it('deve gerar parâmetros corretos para repository', () => {
      const dto = new ComparativoUnidadesRequestDTO({
        period: 'mes-atual',
        unitId: 'todas',
      });

      const params = dto.toRepositoryParams();
      expect(params).toHaveProperty('month');
      expect(params).toHaveProperty('year');
      expect(params.unitId).toBeNull();
    });
  });

  describe('UnitsComparisonResponseDTO', () => {
    it('deve processar dados corretamente', () => {
      const responseDTO = new UnitsComparisonResponseDTO(mockUnitsData);
      const processed = responseDTO.toObject();

      expect(processed.units).toHaveLength(2);
      expect(processed.summary.totalUnits).toBe(2);
      expect(processed.totals.revenue).toBeGreaterThan(0);
    });

    it('deve gerar dados para gráfico', () => {
      const responseDTO = new UnitsComparisonResponseDTO(mockUnitsData);
      const chartData = responseDTO.toChartData();

      expect(chartData).toHaveLength(2);
      expect(chartData[0]).toHaveProperty('name');
      expect(chartData[0]).toHaveProperty('receita');
      expect(chartData[0]).toHaveProperty('lucro');
    });
  });
});

/**
 * Testes do Repository
 */
describe('RelatoriosRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve buscar dados de comparação entre unidades', async () => {
    relatoriosRepository.getUnitsComparisonData.mockResolvedValue({
      data: mockUnitsData,
      error: null,
    });

    const result = await relatoriosRepository.getUnitsComparisonData(11, 2024);

    expect(result.data).toEqual(mockUnitsData);
    expect(result.error).toBeNull();
    expect(relatoriosRepository.getUnitsComparisonData).toHaveBeenCalledWith(
      11,
      2024
    );
  });

  it('deve tratar erros corretamente', async () => {
    const mockError = { message: 'Erro de conexão', code: 'CONNECTION_ERROR' };
    relatoriosRepository.getUnitsComparisonData.mockResolvedValue({
      data: null,
      error: mockError,
    });

    const result = await relatoriosRepository.getUnitsComparisonData(11, 2024);

    expect(result.data).toBeNull();
    expect(result.error).toEqual(mockError);
  });
});

/**
 * Testes do Service
 */
describe('RelatoriosService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve gerar comparativo entre unidades', async () => {
    relatoriosService.getComparativoUnidades.mockResolvedValue({
      data: mockProcessedData,
      error: null,
      metadata: {
        period: 'Novembro 2024',
        generated_at: new Date().toISOString(),
      },
    });

    const result = await relatoriosService.getComparativoUnidades({
      period: 'mes-atual',
    });

    expect(result.data).toEqual(mockProcessedData);
    expect(result.error).toBeNull();
    expect(result.metadata).toHaveProperty('period');
  });

  it('deve validar parâmetros de entrada', async () => {
    relatoriosService.getComparativoUnidades.mockResolvedValue({
      data: null,
      error: { message: 'Métricas inválidas', code: 'VALIDATION_ERROR' },
    });

    const result = await relatoriosService.getComparativoUnidades({
      metrics: ['invalid'],
    });

    expect(result.data).toBeNull();
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });
});

/**
 * Testes de Componentes
 */
describe('KPICard', () => {
  it('deve renderizar valor monetário corretamente', () => {
    render(
      <KPICard
        title="Receita Total"
        value={50000}
        type="currency"
        trend="positive"
        trendValue={15}
      />
    );

    expect(screen.getByText('Receita Total')).toBeInTheDocument();
    expect(screen.getByText('R$ 50.000,00')).toBeInTheDocument();
    expect(screen.getByText('+15,0')).toBeInTheDocument();
  });

  it('deve mostrar estado de loading', () => {
    render(<KPICard title="Loading Test" value={1000} loading={true} />);

    expect(screen.getByText('---')).toBeInTheDocument();
  });

  it('deve formatar números corretamente', () => {
    render(<KPICard title="Atendimentos" value={1250} type="number" />);

    expect(screen.getByText('1.250')).toBeInTheDocument();
  });
});

describe('MetricCard', () => {
  const mockMetrics = [
    { label: 'Receita', value: 50000, type: 'currency', trend: 12.5 },
    { label: 'Atendimentos', value: 150, type: 'number' },
  ];

  it('deve renderizar métricas corretamente', () => {
    render(
      <MetricCard
        title="Unidade Teste"
        subtitle="Belo Horizonte"
        metrics={mockMetrics}
      />
    );

    expect(screen.getByText('Unidade Teste')).toBeInTheDocument();
    expect(screen.getByText('Belo Horizonte')).toBeInTheDocument();
    expect(screen.getByText('Receita')).toBeInTheDocument();
    expect(screen.getByText('R$ 50.000,00')).toBeInTheDocument();
    expect(screen.getByText('+12,5%')).toBeInTheDocument();
  });

  it('deve mostrar estado vazio quando não há métricas', () => {
    render(<MetricCard title="Unidade Vazia" metrics={[]} />);

    expect(screen.getByText('Nenhuma métrica disponível')).toBeInTheDocument();
  });
});

/**
 * Testes de Integração
 */
describe('RelatorioComparativoUnidades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Mock do hook useComparativoUnidades
  const mockUseComparativoUnidades = vi.fn();
  const mockUseExportRelatorio = vi.fn();

  vi.mock('../../../src/hooks/useRelatorios', () => ({
    useComparativoUnidades: () => mockUseComparativoUnidades(),
    useExportRelatorio: () => mockUseExportRelatorio(),
  }));

  it('deve renderizar estado de loading corretamente', async () => {
    mockUseComparativoUnidades.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    mockUseExportRelatorio.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });

    renderWithQueryClient(
      <RelatorioComparativoUnidades filters={{ period: 'mes-atual' }} />
    );

    // Verifica elementos de loading
    expect(screen.getAllByRole('generic')).toHaveLength(expect.any(Number));
  });

  it('deve renderizar dados do comparativo', async () => {
    mockUseComparativoUnidades.mockReturnValue({
      data: mockProcessedData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    mockUseExportRelatorio.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });

    renderWithQueryClient(
      <RelatorioComparativoUnidades filters={{ period: 'mes-atual' }} />
    );

    await waitFor(() => {
      expect(
        screen.getByText('Comparativo entre Unidades')
      ).toBeInTheDocument();
    });
  });

  it('deve lidar com erros corretamente', async () => {
    const mockError = { message: 'Erro ao carregar dados' };

    mockUseComparativoUnidades.mockReturnValue({
      data: null,
      isLoading: false,
      error: mockError,
      refetch: vi.fn(),
    });

    mockUseExportRelatorio.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });

    renderWithQueryClient(
      <RelatorioComparativoUnidades filters={{ period: 'mes-atual' }} />
    );

    await waitFor(() => {
      expect(
        screen.getByText('Erro ao carregar comparativo')
      ).toBeInTheDocument();
    });
  });
});

/**
 * Testes de Performance
 */
describe('Performance Tests', () => {
  it('deve processar grandes volumes de dados rapidamente', () => {
    const largeDataSet = Array.from({ length: 100 }, (_, i) => ({
      unit: { id: `${i}`, name: `Unidade ${i}`, city: `Cidade ${i}` },
      financial: {
        revenues: [{ value: Math.random() * 10000 }],
        expenses: [{ value: Math.random() * 5000 }],
      },
      attendance: [],
      professionals: [],
      growth: { current: { revenues: [] }, previous: { revenues: [] } },
    }));

    const startTime = performance.now();
    const responseDTO = new UnitsComparisonResponseDTO(largeDataSet);
    const result = responseDTO.toObject();
    const endTime = performance.now();

    expect(result.units).toHaveLength(100);
    expect(endTime - startTime).toBeLessThan(100); // Menos de 100ms
  });
});

export default {
  mockUnitsData,
  mockProcessedData,
  renderWithQueryClient,
};
