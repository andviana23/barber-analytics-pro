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
  tipo = 'all', // 'cliente', 'fornecedor', 'all'
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

      const filters = { unitId };
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
      <User className="w-4 h-4 text-blue-500" />
    ) : (
      <Building className="w-4 h-4 text-green-500" />
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
        <div className="flex items-center min-w-0 flex-1">
          {selectedParty && getPartyIcon(selectedParty.tipo)}
          <span className="truncate ml-2">
            {selectedParty ? formatPartyDisplay(selectedParty) : placeholder}
          </span>
        </div>

        <div className="flex items-center ml-2 flex-shrink-0">
          {clearable && selectedParty && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handleClear(e);
              }}
              className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Limpar"
              aria-label="Limpar seleção"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 ml-1 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg overflow-hidden flex flex-col max-h-80">
          {/* Search */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, CPF/CNPJ ou email..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Lista de parties */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ maxHeight: '240px' }}
          >
            {loading ? (
              <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                Carregando...
              </div>
            ) : filteredParties.length > 0 ? (
              <>
                {filteredParties.map(party => (
                  <button
                    key={party.id}
                    type="button"
                    onClick={() => handleSelectParty(party)}
                    className={`
                      w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors
                      ${
                        selectedParty?.id === party.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-900 dark:text-gray-100'
                      }
                    `}
                  >
                    {getPartyIcon(party.tipo)}
                    <div className="ml-2 flex-1 min-w-0">
                      <div className="font-medium truncate">{party.nome}</div>
                      {party.cpf_cnpj && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {party.cpf_cnpj} • {party.tipo}
                        </div>
                      )}
                      {party.email && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {party.email}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <div className="p-3">
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  {searchTerm
                    ? 'Nenhum resultado encontrado'
                    : 'Nenhum cliente/fornecedor cadastrado'}
                </div>

                {/* Opção para criar novo com termo de busca */}
                {allowCreate && searchTerm && (
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="w-full mt-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar "{searchTerm}"
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer com ação de criar */}
          {allowCreate && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-2 flex-shrink-0 bg-white dark:bg-gray-800">
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full px-3 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md flex items-center justify-center transition-colors gap-2"
              >
                <Plus className="w-4 h-4" />
                Cadastrar novo fornecedor
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Inline de Criação Rápida */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Novo Fornecedor
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Criação rápida - apenas o nome
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelCreate}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                className="w-full px-4 py-3 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  placeholder-gray-400 dark:placeholder-gray-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Você poderá adicionar CPF/CNPJ e outros dados depois.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelCreate}
                disabled={isCreating}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 
                  bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 
                  rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={isCreating || !newPartyName.trim()}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white
                  bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
                  rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-md hover:shadow-lg
                  flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
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
    <div className="space-y-6 p-4 max-w-md">
      <h3 className="text-lg font-semibold">PartySelector Preview</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
      <div className="mt-6 p-3 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Valores selecionados:
        </h4>
        <div className="text-xs space-y-1">
          <div>Cliente: {selectedClient || 'nenhum'}</div>
          <div>Fornecedor: {selectedSupplier || 'nenhum'}</div>
          <div>Qualquer: {selectedAny || 'nenhum'}</div>
        </div>
      </div>
    </div>
  );
};

export default PartySelector;
