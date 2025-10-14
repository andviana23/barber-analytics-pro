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
  onCreateNew
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  
  const searchRef = useRef(null);
  const containerRef = useRef(null);
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
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
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
  const handleSelectParty = (party) => {
    setSelectedParty(party);
    onChange(party.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Limpar seleção
  const handleClear = (e) => {
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
    if (onCreateNew) {
      onCreateNew(searchTerm);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  // Formatar exibição do party
  const formatPartyDisplay = (party) => {
    if (!party) return '';
    
    let display = party.nome;
    if (party.cpf_cnpj) {
      display += ` (${party.cpf_cnpj})`;
    }
    return display;
  };

  // Ícone baseado no tipo
  const getPartyIcon = (partyTipo) => {
    return partyTipo === 'cliente' 
      ? <User className="w-4 h-4 text-blue-500" />
      : <Building className="w-4 h-4 text-green-500" />;
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
      <button
        type="button"
        className={triggerClasses}
        onClick={handleOpen}
        disabled={disabled}
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
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-100 rounded"
              title="Limpar"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
          <ChevronDown 
            className={`w-4 h-4 ml-1 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, CPF/CNPJ ou email..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Lista de parties */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-center text-sm text-gray-500">
                Carregando...
              </div>
            ) : filteredParties.length > 0 ? (
              <>
                {filteredParties.map((party) => (
                  <button
                    key={party.id}
                    type="button"
                    onClick={() => handleSelectParty(party)}
                    className={`
                      w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center
                      ${selectedParty?.id === party.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                    `}
                  >
                    {getPartyIcon(party.tipo)}
                    <div className="ml-2 flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {party.nome}
                      </div>
                      {party.cpf_cnpj && (
                        <div className="text-xs text-gray-500 truncate">
                          {party.cpf_cnpj} • {party.tipo}
                        </div>
                      )}
                      {party.email && (
                        <div className="text-xs text-gray-500 truncate">
                          {party.email}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <div className="p-3">
                <div className="text-sm text-gray-500 text-center">
                  {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum cliente/fornecedor cadastrado'}
                </div>
                
                {/* Opção para criar novo */}
                {allowCreate && searchTerm && (
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="w-full mt-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar "{searchTerm}"
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer com ação de criar */}
          {allowCreate && !searchTerm && (
            <div className="border-t border-gray-200 p-2">
              <button
                type="button"
                onClick={() => onCreateNew && onCreateNew('')}
                className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md flex items-center justify-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar novo
              </button>
            </div>
          )}
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
  onCreateNew: PropTypes.func
};

// Componente de preview para demonstração
export const PartySelectorPreview = () => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedAny, setSelectedAny] = useState(null);

  // Mock unitId - em produção viria do contexto
  const mockUnitId = 'unit-1';

  const handleCreateNew = (searchTerm) => {
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
        <h4 className="text-sm font-medium text-gray-700 mb-2">Valores selecionados:</h4>
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
