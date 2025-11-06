/**
 * PartySelector.jsx
 *
 * Select com search para clientes/fornecedores
 * Integração com partiesService para busca de parties por unidade
 *
 * Autor: Sistema Barber Analytics Pro
 * Data: 2024
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Search, ChevronDown, User, Building, X, Plus } from 'lucide-react';
import { partiesService } from '../../services/partiesService';
import { useToast } from '../../context/ToastContext';
const PartySelector = ({
  value,
  onChange,
  unitId,
  tipo = 'all',
  // 'cliente', 'fornecedor', 'all'
  placeholder = 'Selecione um cliente/fornecedor',
  className = '',
  disabled = false,
  clearable = true,
  allowCreate = false,
  onCreateNew,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const searchRef = useRef(null);
  const containerRef = useRef(null);
  const createInputRef = useRef(null);
  const { addToast } = useToast();

  // Carregar parties ao abrir ou mudar filtros
  useEffect(() => {
    if (isOpen && unitId) {
      loadParties();
    }
  }, [isOpen, unitId, tipo]);

  // Atualizar party selecionada quando value muda
  useEffect(() => {
    if (value && parties.length > 0) {
      const party = parties.find(p => p.id === value);
      setSelectedParty(party || null);
    } else if (!value) {
      setSelectedParty(null);
    }
  }, [value, parties]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Carregar lista de parties
  const loadParties = async () => {
    if (!unitId) return;
    setLoading(true);
    try {
      const normalizedTipo = (() => {
        if (!tipo) return null;
        const lowerTipo = tipo.toLowerCase();
        if (lowerTipo === 'all') return null;
        if (lowerTipo === 'cliente') return 'Cliente';
        if (lowerTipo === 'fornecedor') return 'Fornecedor';
        return tipo;
      })();
      const filters = {
        unitId,
      };
      if (normalizedTipo) {
        filters.tipo = normalizedTipo;
      }
      const { data, error } = await partiesService.getParties(filters);
      if (error) {
        addToast(error, 'error');
        return;
      }
      setParties(data || []);
    } catch (err) {
      addToast('Erro ao carregar clientes/fornecedores', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar parties baseado no termo de busca
  const filteredParties = parties.filter(party => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      party.nome.toLowerCase().includes(searchLower) ||
      (party.cpf_cnpj && party.cpf_cnpj.includes(searchTerm)) ||
      (party.email && party.email.toLowerCase().includes(searchLower))
    );
  });

  // Selecionar party
  const handleSelectParty = party => {
    setSelectedParty(party);
    onChange(party.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Limpar seleção
  const handleClear = e => {
    e.stopPropagation();
    setSelectedParty(null);
    onChange(null);
  };

  // Abrir dropdown e focar no search
  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setTimeout(() => {
      if (searchRef.current) {
        searchRef.current.focus();
      }
    }, 100);
  };

  // Criar novo party
  const handleCreateNew = () => {
    if (searchTerm && searchTerm.trim()) {
      // Se tem termo de busca, usar como nome inicial
      setNewPartyName(searchTerm.trim());
    } else {
      setNewPartyName('');
    }
    setShowCreateModal(true);
    setIsOpen(false);

    // Focar no input após renderização
    setTimeout(() => {
      if (createInputRef.current) {
        createInputRef.current.focus();
      }
    }, 100);
  };

  // Confirmar criação
  const handleConfirmCreate = async () => {
    if (!newPartyName || !newPartyName.trim()) {
      addToast({
        type: 'error',
        title: 'Nome obrigatório',
        message: 'Digite um nome para continuar.',
      });
      return;
    }
    if (onCreateNew) {
      setIsCreating(true);
      try {
        await onCreateNew(newPartyName.trim());
        // Fechar modal e resetar
        setShowCreateModal(false);
        setNewPartyName('');
        setSearchTerm('');
        // Recarregar lista de parties
        await loadParties();
      } catch (err) {
        // Erro já tratado no callback pai
      } finally {
        setIsCreating(false);
      }
    }
  };

  // Cancelar criação
  const handleCancelCreate = () => {
    setShowCreateModal(false);
    setNewPartyName('');
  };

  // Tecla Enter para confirmar criação
  const handleCreateKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmCreate();
    } else if (e.key === 'Escape') {
      handleCancelCreate();
    }
  };

  // Formatar exibição do party
  const formatPartyDisplay = party => {
    if (!party) return '';
    let display = party.nome;
    if (party.cpf_cnpj) {
      display += ` (${party.cpf_cnpj})`;
    }
    return display;
  };

  // Ícone baseado no tipo
  const getPartyIcon = partyTipo => {
    return partyTipo === 'cliente' ? (
      <User className="h-4 w-4 text-blue-500" />
    ) : (
      <Building className="h-4 w-4 text-green-500" />
    );
  };
  const containerClasses = `relative ${className}`;
  const triggerClasses = `
    flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md
    bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer'}
    ${selectedParty ? 'text-gray-900' : 'text-gray-500'}
  `;
  return (
    <div className={containerClasses} ref={containerRef}>
      {/* Trigger */}
      <div
        className={triggerClasses}
        onClick={disabled ? undefined : handleOpen}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={e => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleOpen();
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
      >
        <div className="flex min-w-0 flex-1 items-center">
          {selectedParty && getPartyIcon(selectedParty.tipo)}
          <span className="ml-2 truncate">
            {selectedParty ? formatPartyDisplay(selectedParty) : placeholder}
          </span>
        </div>

        <div className="ml-2 flex flex-shrink-0 items-center">
          {clearable && selectedParty && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handleClear(e);
              }}
              className="hover:card-theme rounded p-0.5 transition-colors dark:hover:bg-gray-700"
              title="Limpar"
              aria-label="Limpar seleção"
            >
              <X className="text-light-text-muted dark:text-dark-text-muted h-3 w-3" />
            </button>
          )}
          <ChevronDown
            className={`ml-1 h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="card-theme absolute z-50 mt-1 flex max-h-80 w-full flex-col overflow-hidden rounded-md border border-light-border shadow-lg dark:border-dark-border dark:bg-dark-surface">
          {/* Search */}
          <div className="flex-shrink-0 border-b border-light-border p-3 dark:border-dark-border">
            <div className="relative">
              <Search className="text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, CPF/CNPJ ou email..."
                className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-md border border-light-border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
              />
            </div>
          </div>

          {/* Lista de parties */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              maxHeight: '240px',
            }}
          >
            {loading ? (
              <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted p-3 text-center text-sm">
                Carregando...
              </div>
            ) : filteredParties.length > 0 ? (
              <>
                {filteredParties.map(party => (
                  <button
                    key={party.id}
                    type="button"
                    onClick={() => handleSelectParty(party)}
                    className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedParty?.id === party.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'} `}
                  >
                    {getPartyIcon(party.tipo)}
                    <div className="ml-2 min-w-0 flex-1">
                      <div className="truncate font-medium">{party.nome}</div>
                      {party.cpf_cnpj && (
                        <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted truncate text-xs">
                          {party.cpf_cnpj} • {party.tipo}
                        </div>
                      )}
                      {party.email && (
                        <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted truncate text-xs">
                          {party.email}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <div className="p-3">
                <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-center text-sm">
                  {searchTerm
                    ? 'Nenhum resultado encontrado'
                    : 'Nenhum cliente/fornecedor cadastrado'}
                </div>

                {/* Opção para criar novo com termo de busca */}
                {allowCreate && searchTerm && (
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="mt-2 flex w-full items-center justify-center rounded-md px-3 py-2 text-sm text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar "{searchTerm}"
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer com ação de criar */}
          {allowCreate && (
            <div className="card-theme flex-shrink-0 border-t border-light-border p-2 dark:border-dark-border dark:bg-dark-surface">
              <button
                type="button"
                onClick={handleCreateNew}
                className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                <Plus className="h-4 w-4" />
                Cadastrar novo fornecedor
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Inline de Criação Rápida */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="card-theme w-full max-w-md animate-fadeIn space-y-4 rounded-lg p-6 shadow-2xl dark:bg-dark-surface">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-light-border pb-4 dark:border-dark-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                  <Building className="text-dark-text-primary h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
                    Novo Fornecedor
                  </h3>
                  <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-xs">
                    Criação rápida - apenas o nome
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelCreate}
                className="hover:card-theme rounded-lg p-1 transition-colors dark:hover:bg-gray-700"
              >
                <X className="text-theme-secondary h-5 w-5" />
              </button>
            </div>

            {/* Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                Nome do Fornecedor *
              </label>
              <input
                ref={createInputRef}
                type="text"
                value={newPartyName}
                onChange={e => setNewPartyName(e.target.value)}
                onKeyDown={handleCreateKeyDown}
                placeholder="Ex: João da Silva, Empresa LTDA..."
                disabled={isCreating}
                className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border-2 border-light-border px-4 py-3 text-sm placeholder-gray-400 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:bg-gray-700 dark:placeholder-gray-500"
              />
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-xs">
                Você poderá adicionar CPF/CNPJ e outros dados depois.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelCreate}
                disabled={isCreating}
                className="card-theme flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:text-gray-600 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={isCreating || !newPartyName.trim()}
                className="text-dark-text-primary flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-medium shadow-md transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-light-surface border-t-transparent dark:border-dark-surface" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Criar Fornecedor
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
PartySelector.propTypes = {
  /**
   * ID do party selecionado
   */
  value: PropTypes.string,
  /**
   * Callback quando seleção muda
   */
  onChange: PropTypes.func.isRequired,
  /**
   * ID da unidade para filtrar parties
   */
  unitId: PropTypes.string.isRequired,
  /**
   * Tipo de party a exibir
   */
  tipo: PropTypes.oneOf(['cliente', 'fornecedor', 'all']),
  /**
   * Placeholder quando nenhum valor selecionado
   */
  placeholder: PropTypes.string,
  /**
   * Classes CSS adicionais
   */
  className: PropTypes.string,
  /**
   * Componente desabilitado
   */
  disabled: PropTypes.bool,
  /**
   * Permite limpar seleção
   */
  clearable: PropTypes.bool,
  /**
   * Permite criar novo party
   */
  allowCreate: PropTypes.bool,
  /**
   * Callback para criar novo party
   */
  onCreateNew: PropTypes.func,
};

// Componente de preview para demonstração
export const PartySelectorPreview = () => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedAny, setSelectedAny] = useState(null);

  // Mock unitId - em produção viria do contexto
  const mockUnitId = 'unit-1';
  const handleCreateNew = searchTerm => {
    alert(`Criar novo com termo: "${searchTerm}"`);
  };
  return (
    <div className="max-w-md space-y-6 p-4">
      <h3 className="text-lg font-semibold">PartySelector Preview</h3>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
          Apenas Clientes:
        </label>
        <PartySelector
          value={selectedClient}
          onChange={setSelectedClient}
          unitId={mockUnitId}
          tipo="cliente"
          placeholder="Selecione um cliente"
          allowCreate={true}
          onCreateNew={handleCreateNew}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
          Apenas Fornecedores:
        </label>
        <PartySelector
          value={selectedSupplier}
          onChange={setSelectedSupplier}
          unitId={mockUnitId}
          tipo="fornecedor"
          placeholder="Selecione um fornecedor"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
          Clientes e Fornecedores:
        </label>
        <PartySelector
          value={selectedAny}
          onChange={setSelectedAny}
          unitId={mockUnitId}
          tipo="all"
          placeholder="Selecione qualquer party"
          clearable={false}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
          Desabilitado:
        </label>
        <PartySelector
          value={selectedAny}
          onChange={setSelectedAny}
          unitId={mockUnitId}
          disabled={true}
          placeholder="Componente desabilitado"
        />
      </div>

      {/* Display dos valores selecionados */}
      <div className="mt-6 rounded-md bg-light-bg p-3 dark:bg-dark-bg">
        <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
          Valores selecionados:
        </h4>
        <div className="space-y-1 text-xs">
          <div>Cliente: {selectedClient || 'nenhum'}</div>
          <div>Fornecedor: {selectedSupplier || 'nenhum'}</div>
          <div>Qualquer: {selectedAny || 'nenhum'}</div>
        </div>
      </div>
    </div>
  );
};
export default PartySelector;
