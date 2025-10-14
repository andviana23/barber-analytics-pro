/**
 * CalendarEventCard.jsx
 * 
 * Card para eventos do calendário financeiro
 * Exibe receitas/despesas programadas com status, valor, party e ações rápidas
 * 
 * Autor: Sistema Barber Analytics Pro
 * Data: 2024
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  User, 
  Building, 
  DollarSign, 
  Edit3, 
  Trash2, 
  Check, 
  Link,
  AlertTriangle,
  FileText,
  MoreHorizontal
} from 'lucide-react';
import StatusBadge from '../../atoms/StatusBadge';

const CalendarEventCard = ({
  event,
  onEdit,
  onDelete,
  onMarkAsPaid,
  onReconcile,
  onViewDetails,
  showActions = true,
  compact = false,
  className = ''
}) => {
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  if (!event) return null;

  // Mapear tipos de evento para cores e ícones
  const eventTypeConfig = {
    receita: {
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: DollarSign,
      label: 'Receita'
    },
    despesa: {
      color: 'red', 
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: DollarSign,
      label: 'Despesa'
    },
    compensacao: {
      color: 'green',
      bgColor: 'bg-green-50', 
      borderColor: 'border-green-200',
      icon: Link,
      label: 'Compensação'
    }
  };

  // Mapear status para badges
  const statusMap = {
    'Pendente': 'pending',
    'Atrasado': 'overdue', 
    'Recebido': 'received',
    'Pago': 'paid',
    'Cancelado': 'cancelled',
    'Parcial': 'partially_paid',
    'Previsto': 'scheduled',
    'Compensado': 'reconciled'
  };

  const config = eventTypeConfig[event.tipo] || eventTypeConfig.receita;
  const IconComponent = config.icon;

  // Formatação de valores
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Formatação de datas
  const formatEventDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatEventTime = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'HH:mm', { locale: ptBR });
  };

  // Verificar se o evento está atrasado
  const isOverdue = () => {
    if (!event.event_date) return false;
    const today = new Date();
    const eventDate = new Date(event.event_date);
    return eventDate < today && ['Pendente', 'Previsto'].includes(event.status);
  };

  // Ações disponíveis baseadas no tipo e status
  const getAvailableActions = () => {
    const actions = [];

    // Visualizar detalhes - sempre disponível
    actions.push({
      id: 'details',
      label: 'Ver detalhes',
      icon: FileText,
      onClick: () => onViewDetails && onViewDetails(event)
    });

    // Marcar como pago/recebido - apenas para pendentes
    if (['Pendente', 'Atrasado', 'Parcial'].includes(event.status)) {
      const actionLabel = event.tipo === 'receita' ? 'Marcar como recebido' : 'Marcar como pago';
      actions.push({
        id: 'markPaid',
        label: actionLabel,
        icon: Check,
        onClick: () => onMarkAsPaid && onMarkAsPaid(event),
        primary: true
      });
    }

    // Conciliar - apenas para recebidos/pagos não reconciliados
    if (['Recebido', 'Pago'].includes(event.status)) {
      actions.push({
        id: 'reconcile',
        label: 'Conciliar',
        icon: Link,
        onClick: () => onReconcile && onReconcile(event)
      });
    }

    // Editar - não disponível para compensações
    if (event.tipo !== 'compensacao') {
      actions.push({
        id: 'edit',
        label: 'Editar',
        icon: Edit3,
        onClick: () => onEdit && onEdit(event)
      });
    }

    // Excluir - apenas para não compensados
    if (event.status !== 'Compensado') {
      actions.push({
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: () => onDelete && onDelete(event),
        destructive: true
      });
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  // Classes CSS dinâmicas
  const cardClasses = `
    relative bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow
    ${config.borderColor} ${config.bgColor}
    ${compact ? 'p-3' : 'p-4'}
    ${className}
  `;

  const titleClasses = `
    font-medium text-gray-900 truncate
    ${compact ? 'text-sm' : 'text-base'}
  `;

  return (
    <div className={cardClasses}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center min-w-0 flex-1">
          <IconComponent className={`w-4 h-4 text-${config.color}-500 mr-2 flex-shrink-0`} />
          <div className="min-w-0 flex-1">
            <h3 className={titleClasses} title={event.titulo}>
              {event.titulo || `${config.label} ${event.id?.slice(0, 8)}`}
            </h3>
            {!compact && event.descricao && (
              <p className="text-sm text-gray-600 truncate mt-1" title={event.descricao}>
                {event.descricao}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center ml-2 flex-shrink-0">
          <StatusBadge 
            status={statusMap[event.status] || 'pending'} 
            size={compact ? 'sm' : 'md'}
          />
          
          {/* Menu de ações */}
          {showActions && availableActions.length > 0 && (
            <div className="relative ml-2">
              <button
                type="button"
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>

              {showActionsMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  {availableActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => {
                        action.onClick();
                        setShowActionsMenu(false);
                      }}
                      className={`
                        w-full px-3 py-2 text-left text-sm flex items-center hover:bg-gray-50
                        ${action.primary ? 'text-blue-600' : action.destructive ? 'text-red-600' : 'text-gray-700'}
                      `}
                    >
                      <action.icon className="w-4 h-4 mr-2" />
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Valor */}
      <div className="mb-3">
        <div className={`font-semibold ${compact ? 'text-lg' : 'text-xl'}`}>
          {event.tipo === 'despesa' ? '-' : ''}
          {formatCurrency(event.valor)}
        </div>
        {event.valor_bruto && event.valor_bruto !== event.valor && (
          <div className="text-xs text-gray-500">
            Bruto: {formatCurrency(event.valor_bruto)}
            {event.taxas && ` | Taxas: ${formatCurrency(event.taxas)}`}
          </div>
        )}
      </div>

      {/* Informações do evento */}
      <div className="space-y-2 text-sm text-gray-600">
        {/* Data do evento */}
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          <span>{formatEventDate(event.event_date)}</span>
          {event.event_date && formatEventTime(event.event_date) !== '00:00' && (
            <>
              <Clock className="w-4 h-4 ml-3 mr-1" />
              <span>{formatEventTime(event.event_date)}</span>
            </>
          )}
          {isOverdue() && (
            <AlertTriangle className="w-4 h-4 ml-2 text-amber-500" title="Evento em atraso" />
          )}
        </div>

        {/* Party (cliente/fornecedor) */}
        {event.party_nome && (
          <div className="flex items-center">
            {event.party_tipo === 'cliente' ? (
              <User className="w-4 h-4 mr-2" />
            ) : (
              <Building className="w-4 h-4 mr-2" />
            )}
            <span className="truncate" title={event.party_nome}>
              {event.party_nome}
            </span>
          </div>
        )}

        {/* Competência (se diferente da data do evento) */}
        {event.competencia_inicio && event.competencia_inicio !== event.event_date && (
          <div className="text-xs">
            Competência: {formatEventDate(event.competencia_inicio)}
            {event.competencia_fim && event.competencia_fim !== event.competencia_inicio && (
              ` - ${formatEventDate(event.competencia_fim)}`
            )}
          </div>
        )}
      </div>

      {/* Indicador de reconciliação */}
      {event.reconciliation_id && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex items-center text-xs text-green-600">
            <Link className="w-3 h-3 mr-1" />
            Reconciliado
          </div>
        </div>
      )}

      {/* Overlay para click fora do menu */}
      {showActionsMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowActionsMenu(false)}
        />
      )}
    </div>
  );
};

CalendarEventCard.propTypes = {
  /**
   * Objeto do evento do calendário
   */
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    tipo: PropTypes.oneOf(['receita', 'despesa', 'compensacao']).isRequired,
    titulo: PropTypes.string,
    descricao: PropTypes.string,
    valor: PropTypes.number.isRequired,
    valor_bruto: PropTypes.number,
    taxas: PropTypes.number,
    status: PropTypes.string.isRequired,
    event_date: PropTypes.string.isRequired,
    competencia_inicio: PropTypes.string,
    competencia_fim: PropTypes.string,
    party_nome: PropTypes.string,
    party_tipo: PropTypes.oneOf(['cliente', 'fornecedor']),
    reconciliation_id: PropTypes.string,
    ref_type: PropTypes.string,
    ref_id: PropTypes.string
  }).isRequired,

  /**
   * Callback para editar evento
   */
  onEdit: PropTypes.func,

  /**
   * Callback para excluir evento
   */
  onDelete: PropTypes.func,

  /**
   * Callback para marcar como pago/recebido
   */
  onMarkAsPaid: PropTypes.func,

  /**
   * Callback para reconciliar
   */
  onReconcile: PropTypes.func,

  /**
   * Callback para visualizar detalhes
   */
  onViewDetails: PropTypes.func,

  /**
   * Exibir menu de ações
   */
  showActions: PropTypes.bool,

  /**
   * Modo compacto (menor)
   */
  compact: PropTypes.bool,

  /**
   * Classes CSS adicionais
   */
  className: PropTypes.string
};

// Componente de preview para demonstração
export const CalendarEventCardPreview = () => {
  const mockEvents = [
    {
      id: 'event-1',
      tipo: 'receita',
      titulo: 'Pagamento Serviço Premium',
      descricao: 'Corte + Barba + Tratamento',
      valor: 150.00,
      valor_bruto: 180.00,
      taxas: 30.00,
      status: 'Pendente',
      event_date: '2025-10-15T14:30:00',
      party_nome: 'João Silva',
      party_tipo: 'cliente',
      competencia_inicio: '2025-10-01',
      competencia_fim: '2025-10-31'
    },
    {
      id: 'event-2', 
      tipo: 'despesa',
      titulo: 'Compra de Produtos',
      valor: 450.00,
      status: 'Atrasado',
      event_date: '2025-10-10T09:00:00',
      party_nome: 'Distribuidora Alpha',
      party_tipo: 'fornecedor'
    },
    {
      id: 'event-3',
      tipo: 'receita',
      titulo: 'Mensalidade Plano Gold',
      valor: 89.90,
      status: 'Recebido',
      event_date: '2025-10-13T00:00:00',
      party_nome: 'Maria Santos',
      party_tipo: 'cliente',
      reconciliation_id: 'rec-123'
    },
    {
      id: 'event-4',
      tipo: 'compensacao',
      titulo: 'Reconciliação Automática',
      valor: 89.90,
      status: 'Compensado',
      event_date: '2025-10-13T16:45:00'
    }
  ];

  const handleAction = (action, event) => {
    alert(`Ação: ${action} para evento ${event.id}`);
  };

  return (
    <div className="space-y-4 p-4 max-w-md">
      <h3 className="text-lg font-semibold">CalendarEventCard Preview</h3>
      
      {mockEvents.map((event) => (
        <CalendarEventCard
          key={event.id}
          event={event}
          onEdit={(e) => handleAction('Editar', e)}
          onDelete={(e) => handleAction('Excluir', e)}
          onMarkAsPaid={(e) => handleAction('Marcar como Pago/Recebido', e)}
          onReconcile={(e) => handleAction('Reconciliar', e)}
          onViewDetails={(e) => handleAction('Ver Detalhes', e)}
        />
      ))}

      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Modo Compacto:</h4>
        <CalendarEventCard
          event={mockEvents[0]}
          onEdit={(e) => handleAction('Editar', e)}
          onMarkAsPaid={(e) => handleAction('Marcar como Pago', e)}
          compact={true}
        />
      </div>
    </div>
  );
};

export default CalendarEventCard;