import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, Clock, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '../../atoms';
import BarbeiroCard from './components/BarbeiroCard';
import filaService from '../../services/filaService';

export default function ListaDaVezPage() {
  const [filaMangabeiras, setFilaMangabeiras] = useState([]);
  const [filaNovLima, setFilaNovLima] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // IDs das unidades (deverão vir de um contexto ou configuração)
  const UNIDADES = {
    MANGABEIRAS: 'unidade-mangabeiras-id', // Substituir pelo ID real
    NOVA_LIMA: 'unidade-nova-lima-id'      // Substituir pelo ID real
  };

  const carregarFilas = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [mangabeiras, novaLima] = await Promise.all([
        filaService.getFilaOrdenada(UNIDADES.MANGABEIRAS),
        filaService.getFilaOrdenada(UNIDADES.NOVA_LIMA)
      ]);

      setFilaMangabeiras(mangabeiras);
      setFilaNovLima(novaLima);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
      // eslint-disable-next-line no-console
      console.error('Erro ao carregar filas:', err);
    } finally {
      setLoading(false);
    }
  }, [UNIDADES.MANGABEIRAS, UNIDADES.NOVA_LIMA]);

  useEffect(() => {
    carregarFilas();

    // Atualizar automaticamente a cada 30 segundos
    const interval = setInterval(carregarFilas, 30000);
    
    return () => clearInterval(interval);
  }, [carregarFilas]);

  const formatLastUpdate = () => {
    return lastUpdate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTotalBarbeiros = () => {
    return filaMangabeiras.length + filaNovLima.length;
  };

  const getBarbeirosAtivos = () => {
    const ativosMangabeiras = filaMangabeiras.filter(b => b.status === 'active').length;
    const ativosNovaLima = filaNovLima.filter(b => b.status === 'active').length;
    return ativosMangabeiras + ativosNovaLima;
  };

  const getBarbeirosAtendendo = () => {
    const atendendoMangabeiras = filaMangabeiras.filter(b => b.status === 'attending').length;
    const atendendoNovaLima = filaNovLima.filter(b => b.status === 'attending').length;
    return atendendoMangabeiras + atendendoNovaLima;
  };

  if (loading && filaMangabeiras.length === 0 && filaNovLima.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map(i => (
              <div key={i} className="space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            Lista da Vez
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerenciamento da fila de atendimento em tempo real
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Estatísticas rápidas */}
          <div className="hidden sm:flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {getTotalBarbeiros()}
              </div>
              <div className="text-gray-500 dark:text-gray-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {getBarbeirosAtivos()}
              </div>
              <div className="text-gray-500 dark:text-gray-400">Disponíveis</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {getBarbeirosAtendendo()}
              </div>
              <div className="text-gray-500 dark:text-gray-400">Atendendo</div>
            </div>
          </div>

          {/* Botão atualizar */}
          <Button
            onClick={carregarFilas}
            variant="outline"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status da última atualização */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Clock className="h-4 w-4" />
        Última atualização: {formatLastUpdate()}
        {error && (
          <div className="flex items-center gap-1 text-red-600 ml-4">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>

      {/* Grid principal - Divisão por unidades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Coluna Mangabeiras */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              Mangabeiras
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filaMangabeiras.length} barbeiro(s)
            </span>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            {filaMangabeiras.length > 0 ? (
              <div className="space-y-4">
                {filaMangabeiras.map((barbeiro, index) => (
                  <BarbeiroCard
                    key={barbeiro.barbeiro_id}
                    barbeiro={barbeiro}
                    posicao={index + 1}
                    unidadeId={UNIDADES.MANGABEIRAS}
                    onUpdate={carregarFilas}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum barbeiro na fila hoje</p>
              </div>
            )}
          </div>
        </div>

        {/* Coluna Nova Lima */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Nova Lima
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filaNovLima.length} barbeiro(s)
            </span>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            {filaNovLima.length > 0 ? (
              <div className="space-y-4">
                {filaNovLima.map((barbeiro, index) => (
                  <BarbeiroCard
                    key={barbeiro.barbeiro_id}
                    barbeiro={barbeiro}
                    posicao={index + 1}
                    unidadeId={UNIDADES.NOVA_LIMA}
                    onUpdate={carregarFilas}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum barbeiro na fila hoje</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rodapé com instruções */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          💡 Como funciona a Lista da Vez:
        </h3>
        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <p>• <strong>Ordem:</strong> Barbeiros com menos atendimentos ficam na frente</p>
          <p>• <strong>Empate:</strong> Quem entrou na fila há mais tempo tem prioridade</p>
          <p>• <strong>Status:</strong> Verde (disponível), Azul (atendendo), Cinza (pausado)</p>
          <p>• <strong>Atualização:</strong> Automática a cada 30 segundos</p>
        </div>
      </div>
    </div>
  );
}