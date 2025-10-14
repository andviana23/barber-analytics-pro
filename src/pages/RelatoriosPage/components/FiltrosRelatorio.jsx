import React, { useState, useEffect } from 'react';
import { Calendar, Building2, User } from 'lucide-react';
import { Input } from '../../../atoms';

const FiltrosRelatorio = ({ filters, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  // Sincronizar com os filtros externos quando mudarem
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Aplicar filtros com debounce
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
        [campo]: valor
      }
    }));
  };

  const handleUnidadeChange = (unidade) => {
    setLocalFilters(prev => ({
      ...prev,
      unidade
    }));
  };

  const handleProfissionalChange = (profissional) => {
    setLocalFilters(prev => ({
      ...prev,
      profissional
    }));
  };

  // Gerar lista de meses para o select
  const meses = [
    { valor: 1, nome: 'Janeiro' },
    { valor: 2, nome: 'Fevereiro' },
    { valor: 3, nome: 'Março' },
    { valor: 4, nome: 'Abril' },
    { valor: 5, nome: 'Maio' },
    { valor: 6, nome: 'Junho' },
    { valor: 7, nome: 'Julho' },
    { valor: 8, nome: 'Agosto' },
    { valor: 9, nome: 'Setembro' },
    { valor: 10, nome: 'Outubro' },
    { valor: 11, nome: 'Novembro' },
    { valor: 12, nome: 'Dezembro' }
  ];

  // Gerar lista de anos (últimos 5 anos + próximos 2)
  const anoAtual = new Date().getFullYear();
  const anos = Array.from({ length: 8 }, (_, i) => anoAtual - 5 + i);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Filtro de Período */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Calendar size={16} />
          <span>Período</span>
        </label>
        
        <select
          value={localFilters.periodo.tipo}
          onChange={(e) => handlePeriodoChange('tipo', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="mes">Mensal</option>
          <option value="trimestre">Trimestral</option>
          <option value="semestre">Semestral</option>
          <option value="ano">Anual</option>
          <option value="custom">Personalizado</option>
        </select>

        {/* Seletores específicos para cada tipo de período */}
        {localFilters.periodo.tipo === 'mes' && (
          <div className="grid grid-cols-2 gap-2">
            <select
              value={localFilters.periodo.mes}
              onChange={(e) => handlePeriodoChange('mes', parseInt(e.target.value))}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            >
              {meses.map(mes => (
                <option key={mes.valor} value={mes.valor}>
                  {mes.nome.substring(0, 3)}
                </option>
              ))}
            </select>
            <select
              value={localFilters.periodo.ano}
              onChange={(e) => handlePeriodoChange('ano', parseInt(e.target.value))}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            >
              {anos.map(ano => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>
        )}

        {localFilters.periodo.tipo === 'ano' && (
          <select
            value={localFilters.periodo.ano}
            onChange={(e) => handlePeriodoChange('ano', parseInt(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
          >
            {anos.map(ano => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>
        )}

        {localFilters.periodo.tipo === 'custom' && (
          <div className="space-y-2">
            <Input
              type="date"
              value={localFilters.periodo.dataInicio || ''}
              onChange={(e) => handlePeriodoChange('dataInicio', e.target.value)}
              placeholder="Data Início"
              className="text-sm"
            />
            <Input
              type="date"
              value={localFilters.periodo.dataFim || ''}
              onChange={(e) => handlePeriodoChange('dataFim', e.target.value)}
              placeholder="Data Fim"
              className="text-sm"
            />
          </div>
        )}
      </div>

      {/* Filtro de Unidade */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Building2 size={16} />
          <span>Unidade</span>
        </label>
        
        <select
          value={localFilters.unidade}
          onChange={(e) => handleUnidadeChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="todas">Todas as Unidades</option>
          <option value="mangabeiras">Mangabeiras</option>
          <option value="nova-lima">Nova Lima</option>
        </select>
      </div>

      {/* Filtro de Profissional */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <User size={16} />
          <span>Profissional</span>
        </label>
        
        <select
          value={localFilters.profissional}
          onChange={(e) => handleProfissionalChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="todos">Todos os Profissionais</option>
          {/* TODO: Carregar profissionais do banco de dados */}
          <option value="joao">João Silva</option>
          <option value="pedro">Pedro Santos</option>
          <option value="carlos">Carlos Oliveira</option>
          <option value="marcos">Marcos Lima</option>
          <option value="rafael">Rafael Costa</option>
          <option value="diego">Diego Ferreira</option>
        </select>
      </div>

      {/* Botão de Aplicar/Resetar */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 opacity-0">
          Ações
        </label>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              const filtrosDefault = {
                periodo: {
                  tipo: 'mes',
                  mes: new Date().getMonth() + 1,
                  ano: new Date().getFullYear(),
                  dataInicio: null,
                  dataFim: null
                },
                unidade: 'todas',
                profissional: 'todos'
              };
              setLocalFilters(filtrosDefault);
              onFiltersChange(filtrosDefault);
            }}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiltrosRelatorio;