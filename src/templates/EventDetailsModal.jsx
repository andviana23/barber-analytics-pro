import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { X, Calendar, Clock, User, MapPin, DollarSign, FileText, Edit3, Trash2, CheckCircle, MoreVertical, Eye, Copy, Send } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import StatusBadge from '../atoms/StatusBadge';

/**
 * Modal para visualização e edição detalhada de eventos do calendário financeiro
 * Inclui CRUD completo, ações contextuais e integração com transações
 */
const EventDetailsModal = ({
  isOpen = false,
  onClose = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onMarkAsPaid = () => {},
  onMarkAsReceived = () => {},
  onReconcile = () => {},
  onDuplicate = () => {},
  onSendReminder = () => {},
  eventData = null,
  canEdit = true,
  canDelete = true,
  loading = false,
  userRole = 'barbeiro'
}) => {
  // Estados de controle
  const [activeTab, setActiveTab] = useState('details');
  const [showActions, setShowActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});

  // Configurações de tipos de evento
  const eventTypeConfig = {
    receita_pendente: {
      label: 'Receita Pendente',
      icon: DollarSign,
      color: 'amber',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    receita_recebida: {
      label: 'Receita Recebida',
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    despesa_pendente: {
      label: 'Despesa Pendente',
      icon: FileText,
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    despesa_paga: {
      label: 'Despesa Paga',
      icon: CheckCircle,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    vencimento: {
      label: 'Vencimento',
      icon: Clock,
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    reconciliacao: {
      label: 'Reconciliação',
      icon: Eye,
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  };

  // Inicializar dados de edição quando eventData mudar
  React.useEffect(() => {
    if (eventData) {
      setEditedData({
        titulo: eventData.titulo || '',
        descricao: eventData.descricao || '',
        valor: eventData.valor?.toString() || '',
        data_evento: eventData.data_evento || '',
        observacoes: eventData.observacoes || ''
      });
    }
  }, [eventData]);

  // Função para calcular dias até o evento
  const getDaysUntilEvent = useCallback(() => {
    if (!eventData?.data_evento) return null;
    
    const eventDate = typeof eventData.data_evento === 'string' 
      ? parseISO(eventData.data_evento) 
      : eventData.data_evento;
    
    const today = new Date();
    const days = differenceInDays(eventDate, today);
    
    if (days < 0) return { days: Math.abs(days), type: 'overdue' };
    if (days === 0) return { days: 0, type: 'today' };
    return { days, type: 'upcoming' };
  }, [eventData]);

  // Função para obter ações disponíveis baseadas no tipo de evento e permissões
  const getAvailableActions = useCallback(() => {
    if (!eventData) return [];

    const actions = [];

    // Ações baseadas no tipo de evento
    switch (eventData.tipo) {
      case 'receita_pendente':
        if (userRole !== 'barbeiro') {
          actions.push({
            id: 'mark_received',
            label: 'Marcar como Recebida',
            icon: CheckCircle,
            color: 'green',
            onClick: () => onMarkAsReceived(eventData.id)
          });
        }
        break;
        
      case 'despesa_pendente':
        if (userRole !== 'barbeiro') {
          actions.push({
            id: 'mark_paid',
            label: 'Marcar como Paga',
            icon: CheckCircle,
            color: 'blue',
            onClick: () => onMarkAsPaid(eventData.id)
          });
        }
        break;
        
      case 'vencimento':
        if (!eventData.reconciliado) {
          actions.push({
            id: 'reconcile',
            label: 'Reconciliar',
            icon: Eye,
            color: 'purple',
            onClick: () => onReconcile(eventData.id)
          });
        }
        break;
    }

    // Ações gerais disponíveis para todos os tipos
    actions.push(
      {
        id: 'duplicate',
        label: 'Duplicar',
        icon: Copy,
        color: 'gray',
        onClick: () => onDuplicate(eventData)
      },
      {
        id: 'send_reminder',
        label: 'Enviar Lembrete',
        icon: Send,
        color: 'blue',
        onClick: () => onSendReminder(eventData.id)
      }
    );

    return actions;
  }, [eventData, userRole, onMarkAsReceived, onMarkAsPaid, onReconcile, onDuplicate, onSendReminder]);

  // Função para salvar edição
  const handleSaveEdit = useCallback(async () => {
    if (!eventData?.id) return;

    const updatedData = {
      id: eventData.id,
      ...editedData,
      valor: parseFloat(editedData.valor) || 0
    };

    await onEdit(updatedData);
    setIsEditing(false);
  }, [eventData, editedData, onEdit]);

  // Função para cancelar edição
  const handleCancelEdit = useCallback(() => {
    setEditedData({
      titulo: eventData.titulo || '',
      descricao: eventData.descricao || '',
      valor: eventData.valor?.toString() || '',
      data_evento: eventData.data_evento || '',
      observacoes: eventData.observacoes || ''
    });
    setIsEditing(false);
  }, [eventData]);

  if (!isOpen || !eventData) return null;

  const typeConfig = eventTypeConfig[eventData.tipo] || eventTypeConfig.vencimento;
  const IconComponent = typeConfig.icon;
  const daysInfo = getDaysUntilEvent();
  const availableActions = getAvailableActions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`p-6 ${typeConfig.bgColor} ${typeConfig.borderColor} border-b`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`flex items-center justify-center w-12 h-12 bg-${typeConfig.color}-100 rounded-lg`}>
                <IconComponent className={`w-6 h-6 text-${typeConfig.color}-600`} />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.titulo}
                    onChange={(e) => setEditedData(prev => ({ ...prev, titulo: e.target.value }))}
                    className="text-xl font-semibold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                    placeholder="Título do evento"
                  />
                ) : (
                  <h2 className="text-xl font-semibold text-gray-900">
                    {eventData.titulo}
                  </h2>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <StatusBadge 
                    status={eventData.status || eventData.tipo} 
                    size="sm" 
                  />
                  <span className="text-sm text-gray-600">
                    {typeConfig.label}
                  </span>
                  {daysInfo && (
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      daysInfo.type === 'overdue' 
                        ? 'bg-red-100 text-red-700' 
                        : daysInfo.type === 'today'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {daysInfo.type === 'overdue' 
                        ? `${daysInfo.days} dias em atraso`
                        : daysInfo.type === 'today'
                        ? 'Hoje'
                        : `Em ${daysInfo.days} dias`
                      }
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Actions Menu */}
              {availableActions.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-white hover:bg-opacity-50 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {showActions && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                      {availableActions.map((action) => {
                        const ActionIcon = action.icon;
                        return (
                          <button
                            key={action.id}
                            onClick={() => {
                              action.onClick();
                              setShowActions(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left`}
                          >
                            <ActionIcon className={`w-4 h-4 text-${action.color}-500`} />
                            {action.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-white hover:bg-opacity-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'details', label: 'Detalhes', icon: FileText },
              { id: 'timeline', label: 'Histórico', icon: Clock },
              { id: 'related', label: 'Relacionados', icon: User }
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? `border-${typeConfig.color}-500 text-${typeConfig.color}-600`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {activeTab === 'details' && (
            <div className="p-6 space-y-6">
              {/* Informações Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Data e Horário */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data do Evento
                  </label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {isEditing ? (
                      <input
                        type="date"
                        value={editedData.data_evento ? format(new Date(editedData.data_evento), 'yyyy-MM-dd') : ''}
                        onChange={(e) => setEditedData(prev => ({ ...prev, data_evento: e.target.value }))}
                        className="border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      <span>
                        {eventData.data_evento && format(
                          typeof eventData.data_evento === 'string' 
                            ? parseISO(eventData.data_evento) 
                            : eventData.data_evento,
                          "dd 'de' MMMM 'de' yyyy",
                          { locale: ptBR }
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Valor */}
                {eventData.valor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor
                    </label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editedData.valor}
                          onChange={(e) => setEditedData(prev => ({ ...prev, valor: e.target.value }))}
                          className="border border-gray-300 rounded px-2 py-1 w-32"
                          placeholder="0,00"
                        />
                      ) : (
                        <span className="font-medium">
                          R$ {eventData.valor.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Cliente/Fornecedor */}
                {eventData.party && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {eventData.tipo?.includes('receita') ? 'Cliente' : 'Fornecedor'}
                    </label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{eventData.party.nome}</span>
                      {eventData.party.email && (
                        <span className="text-sm text-gray-500">
                          ({eventData.party.email})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Conta */}
                {eventData.conta && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conta
                    </label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{eventData.conta.nome}</span>
                      {eventData.conta.banco && (
                        <span className="text-sm text-gray-500">
                          - {eventData.conta.banco}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Descrição */}
              {(eventData.descricao || isEditing) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editedData.descricao}
                      onChange={(e) => setEditedData(prev => ({ ...prev, descricao: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Descrição do evento..."
                    />
                  ) : (
                    <p className="text-gray-700 bg-gray-50 rounded-lg p-3">
                      {eventData.descricao}
                    </p>
                  )}
                </div>
              )}

              {/* Observações */}
              {(eventData.observacoes || isEditing) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editedData.observacoes}
                      onChange={(e) => setEditedData(prev => ({ ...prev, observacoes: e.target.value }))}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Observações internas..."
                    />
                  ) : (
                    <p className="text-gray-600 text-sm bg-gray-50 rounded-lg p-3">
                      {eventData.observacoes}
                    </p>
                  )}
                </div>
              )}

              {/* Tags */}
              {eventData.tags && eventData.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {eventData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 text-xs rounded-full bg-${typeConfig.color}-100 text-${typeConfig.color}-700`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadados */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="block font-medium">Criado em:</span>
                    {eventData.created_at && format(
                      parseISO(eventData.created_at),
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR }
                    )}
                  </div>
                  {eventData.updated_at && eventData.updated_at !== eventData.created_at && (
                    <div>
                      <span className="block font-medium">Atualizado em:</span>
                      {format(
                        parseISO(eventData.updated_at),
                        "dd/MM/yyyy 'às' HH:mm",
                        { locale: ptBR }
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="p-6">
              <div className="space-y-4">
                {eventData.timeline && eventData.timeline.length > 0 ? (
                  eventData.timeline.map((entry, index) => (
                    <div key={index} className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full bg-${typeConfig.color}-500 mt-2 flex-shrink-0`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {entry.action}
                          </p>
                          <span className="text-xs text-gray-500">
                            {format(parseISO(entry.timestamp), "dd/MM/yyyy HH:mm")}
                          </span>
                        </div>
                        {entry.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {entry.description}
                          </p>
                        )}
                        {entry.user && (
                          <p className="text-xs text-gray-500 mt-1">
                            por {entry.user.nome}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Nenhum histórico disponível
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'related' && (
            <div className="p-6">
              <div className="space-y-4">
                {eventData.related && eventData.related.length > 0 ? (
                  eventData.related.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-${item.color}-100 flex items-center justify-center`}>
                          <span className={`text-${item.color}-600 text-xs font-medium`}>
                            {item.type}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-700">
                        {item.value && `R$ ${item.value.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}`}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Nenhum item relacionado
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {eventData.id && (
                  <span className="text-sm text-gray-500">
                    ID: {eventData.id.substring(0, 8)}...
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar
                  </button>
                )}
                
                {canDelete && userRole !== 'barbeiro' && (
                  <>
                    {confirmDelete ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-red-600">Confirmar exclusão?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDelete(eventData.id);
                            setConfirmDelete(false);
                          }}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="px-4 py-2 text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    )}
                  </>
                )}
                
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

EventDetailsModal.propTypes = {
  /** Se o modal está aberto */
  isOpen: PropTypes.bool,
  /** Função chamada ao fechar o modal */
  onClose: PropTypes.func,
  /** Função chamada ao editar o evento */
  onEdit: PropTypes.func,
  /** Função chamada ao excluir o evento */
  onDelete: PropTypes.func,
  /** Função chamada ao marcar despesa como paga */
  onMarkAsPaid: PropTypes.func,
  /** Função chamada ao marcar receita como recebida */
  onMarkAsReceived: PropTypes.func,
  /** Função chamada ao reconciliar transação */
  onReconcile: PropTypes.func,
  /** Função chamada ao duplicar evento */
  onDuplicate: PropTypes.func,
  /** Função chamada ao enviar lembrete */
  onSendReminder: PropTypes.func,
  /** Dados do evento */
  eventData: PropTypes.object,
  /** Se pode editar o evento */
  canEdit: PropTypes.bool,
  /** Se pode excluir o evento */
  canDelete: PropTypes.bool,
  /** Se está carregando */
  loading: PropTypes.bool,
  /** Papel do usuário atual */
  userRole: PropTypes.oneOf(['barbeiro', 'gerente', 'admin'])
};

export default EventDetailsModal;

// Preview Component
export const EventDetailsModalPreview = () => {
  const [isOpen, setIsOpen] = React.useState(true);
  const [selectedEvent, setSelectedEvent] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const mockEvents = [
    {
      id: 'evt-001',
      titulo: 'Receita - Serviços de Dezembro',
      descricao: 'Receita referente aos serviços prestados durante o mês de dezembro',
      tipo: 'receita_pendente',
      status: 'pendente',
      valor: 2500.00,
      data_evento: '2024-12-31T00:00:00Z',
      party: {
        nome: 'Cliente Premium Ltda',
        email: 'contato@clientepremium.com'
      },
      conta: {
        nome: 'Conta Corrente Principal',
        banco: 'Banco do Brasil'
      },
      observacoes: 'Aguardando confirmação do cliente para fechamento',
      tags: ['servicos', 'mensal', 'premium'],
      created_at: '2024-12-01T09:00:00Z',
      updated_at: '2024-12-15T14:30:00Z',
      timeline: [
        {
          action: 'Evento criado',
          description: 'Receita adicionada ao calendário',
          timestamp: '2024-12-01T09:00:00Z',
          user: { nome: 'Sistema' }
        },
        {
          action: 'Status atualizado',
          description: 'Status alterado para pendente',
          timestamp: '2024-12-15T14:30:00Z',
          user: { nome: 'João Silva' }
        }
      ],
      related: [
        {
          type: 'REF',
          title: 'Referência #12345',
          description: 'Contrato de prestação de serviços',
          color: 'blue',
          value: 2500.00
        }
      ]
    },
    {
      id: 'evt-002',
      titulo: 'Despesa - Aluguel Janeiro',
      descricao: 'Pagamento do aluguel referente ao mês de janeiro/2025',
      tipo: 'despesa_pendente',
      status: 'aprovada',
      valor: 3200.00,
      data_evento: '2025-01-05T00:00:00Z',
      party: {
        nome: 'Imobiliária São Paulo',
        email: 'cobranca@imobiliaria.com'
      },
      conta: {
        nome: 'Conta Corrente',
        banco: 'Itaú'
      },
      observacoes: 'Pagar até o dia 5 para evitar multa',
      tags: ['aluguel', 'fixo', 'prioritario'],
      created_at: '2024-12-20T10:00:00Z',
      timeline: [
        {
          action: 'Despesa aprovada',
          description: 'Despesa aprovada pelo gerente',
          timestamp: '2024-12-20T10:00:00Z',
          user: { nome: 'Maria Santos' }
        }
      ],
      related: []
    }
  ];

  const handleAction = async (action) => {
    setLoading(true);
    // Simular ação no sistema - logs removidos para produção
    
    // Simular delay da ação
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLoading(false);
    alert(`${action} executada com sucesso!`);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Event Details Modal - Preview
          </h2>
          <p className="text-gray-600 mb-6">
            Modal completo para visualização e edição de eventos do calendário financeiro.
            Inclui CRUD completo, ações contextuais e histórico de alterações.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setSelectedEvent(event);
                  setIsOpen(true);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">
                    {event.titulo}
                  </h3>
                  <StatusBadge status={event.status} size="sm" />
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {event.descricao}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {format(parseISO(event.data_evento), "dd/MM/yyyy")}
                  </span>
                  <span className="font-medium text-green-600">
                    R$ {event.valor.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedEvent && (
          <EventDetailsModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onEdit={() => handleAction('Editar evento')}
            onDelete={() => handleAction('Excluir evento')}
            onMarkAsPaid={() => handleAction('Marcar como pago')}
            onMarkAsReceived={() => handleAction('Marcar como recebido')}
            onReconcile={() => handleAction('Reconciliar')}
            onDuplicate={() => handleAction('Duplicar evento')}
            onSendReminder={() => handleAction('Enviar lembrete')}
            eventData={selectedEvent}
            canEdit={true}
            canDelete={true}
            loading={loading}
            userRole="admin"
          />
        )}
      </div>
    </div>
  );
};