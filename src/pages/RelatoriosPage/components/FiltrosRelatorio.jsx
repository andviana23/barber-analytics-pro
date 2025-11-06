import React, { useState, useEffect } from 'react';
import { Calendar, Building2, User, Loader2 } from 'lucide-react';
import { Input } from '../../../atoms';
import unitsService from '../../../services/unitsService';
import { useProfissionais } from '../../../hooks/useProfissionais';
const FiltrosRelatorio = ({ filters, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const { profissionais: professionals, loading: loadingProfessionals } =
    useProfissionais({
      unit_id: localFilters.unidade !== 'todas' ? localFilters.unidade : null,
      is_active: true,
    });
  useEffect(() => {
    const loadUnits = async () => {
      setLoadingUnits(true);
      try {
        const { data, error } = await unitsService.getUnits({
          includeInactive: false,
        });
        if (error) {
          throw error;
        }
        setUnits(data || []);
      } catch (error) {
        console.error('Erro ao carregar unidades:', error);
        setUnits([]);
      } finally {
        setLoadingUnits(false);
      }
    };
    loadUnits();
  }, []);
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange(localFilters);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [localFilters, onFiltersChange]);
  const handlePeriodoChange = (campo, valor) => {
    setLocalFilters(prev => ({
      ...prev,
      periodo: {
        ...prev.periodo,
        [campo]: valor,
      },
    }));
  };
  const handleUnidadeChange = unidade => {
    setLocalFilters(prev => ({
      ...prev,
      unidade,
      profissional: 'todos',
    }));
  };
  const handleProfissionalChange = profissional => {
    setLocalFilters(prev => ({
      ...prev,
      profissional,
    }));
  };
  const meses = [
    {
      valor: 1,
      nome: 'Janeiro',
    },
    {
      valor: 2,
      nome: 'Fevereiro',
    },
    {
      valor: 3,
      nome: 'Mar�o',
    },
    {
      valor: 4,
      nome: 'Abril',
    },
    {
      valor: 5,
      nome: 'Maio',
    },
    {
      valor: 6,
      nome: 'Junho',
    },
    {
      valor: 7,
      nome: 'Julho',
    },
    {
      valor: 8,
      nome: 'Agosto',
    },
    {
      valor: 9,
      nome: 'Setembro',
    },
    {
      valor: 10,
      nome: 'Outubro',
    },
    {
      valor: 11,
      nome: 'Novembro',
    },
    {
      valor: 12,
      nome: 'Dezembro',
    },
  ];
  const anoAtual = new Date().getFullYear();
  const anos = Array.from(
    {
      length: 8,
    },
    (_, i) => anoAtual - 5 + i
  );
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
          <Calendar size={16} />
          <span>Per�odo</span>
        </label>
        <select
          value={localFilters.periodo.tipo}
          onChange={e => handlePeriodoChange('tipo', e.target.value)}
          className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-md border border-light-border px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
          data-testid="filtro-periodo-tipo"
        >
          <option value="mes">Mensal</option>
          <option value="trimestre">Trimestral</option>
          <option value="ano">Anual</option>
          <option value="custom">Personalizado</option>
        </select>
        {localFilters.periodo.tipo === 'mes' && (
          <div className="grid grid-cols-2 gap-2">
            <select
              value={localFilters.periodo.mes}
              onChange={e =>
                handlePeriodoChange('mes', parseInt(e.target.value))
              }
              className="card-theme rounded-md border border-light-border px-2 py-1 text-sm dark:border-dark-border dark:bg-gray-700"
              data-testid="filtro-mes"
            >
              {meses.map(m => (
                <option key={m.valor} value={m.valor}>
                  {m.nome.substring(0, 3)}
                </option>
              ))}
            </select>
            <select
              value={localFilters.periodo.ano}
              onChange={e =>
                handlePeriodoChange('ano', parseInt(e.target.value))
              }
              className="card-theme rounded-md border border-light-border px-2 py-1 text-sm dark:border-dark-border dark:bg-gray-700"
              data-testid="filtro-ano"
            >
              {anos.map(a => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        )}
        {localFilters.periodo.tipo === 'custom' && (
          <div className="space-y-2">
            <Input
              type="date"
              value={localFilters.periodo.dataInicio || ''}
              onChange={e => handlePeriodoChange('dataInicio', e.target.value)}
              data-testid="filtro-data-inicio"
            />
            <Input
              type="date"
              value={localFilters.periodo.dataFim || ''}
              onChange={e => handlePeriodoChange('dataFim', e.target.value)}
              data-testid="filtro-data-fim"
            />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
          <Building2 size={16} />
          <span>Unidade</span>
          {loadingUnits && <Loader2 size={14} className="animate-spin" />}
        </label>
        <select
          value={localFilters.unidade}
          onChange={e => handleUnidadeChange(e.target.value)}
          disabled={loadingUnits}
          className="card-theme w-full rounded-md border border-light-border px-3 py-2 disabled:opacity-50 dark:border-dark-border dark:bg-gray-700"
          data-testid="filtro-unidade"
        >
          <option value="todas">Todas as Unidades</option>
          {units.map(u => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
          <User size={16} />
          <span>Profissional</span>
          {loadingProfessionals && (
            <Loader2 size={14} className="animate-spin" />
          )}
        </label>
        <select
          value={localFilters.profissional}
          onChange={e => handleProfissionalChange(e.target.value)}
          disabled={loadingProfessionals}
          className="card-theme w-full rounded-md border border-light-border px-3 py-2 disabled:opacity-50 dark:border-dark-border dark:bg-gray-700"
          data-testid="filtro-profissional"
        >
          <option value="todos">Todos os Profissionais</option>
          {professionals.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} - {p.role}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium opacity-0">A��es</label>
        <button
          onClick={() => {
            const d = {
              periodo: {
                tipo: 'mes',
                mes: new Date().getMonth() + 1,
                ano: new Date().getFullYear(),
                dataInicio: null,
                dataFim: null,
              },
              unidade: 'todas',
              profissional: 'todos',
            };
            setLocalFilters(d);
            onFiltersChange(d);
          }}
          className="card-theme w-full rounded-md border border-light-border px-3 py-2 text-sm hover:bg-light-bg dark:border-dark-border dark:bg-dark-bg dark:bg-gray-700"
          data-testid="btn-limpar-filtros"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
};
export default FiltrosRelatorio;
