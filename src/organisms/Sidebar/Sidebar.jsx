/**
 * @file Sidebar.jsx
 * @description Sidebar/Navbar principal do sistema
 * Refatorado para seguir 100% o Design System (DESIGN_SYSTEM.md)
 * @author Barber Analytics Pro Team
 * @date 2025-10-26
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UnitSelector from '../../atoms/UnitSelector/UnitSelector';
import {
  LayoutDashboard,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  X,
  Building2,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Package,
  Tags,
  Target,
  Scissors,
  FileText,
  TrendingUp,
} from 'lucide-react';

// Estrutura hierárquica do menu organizada por grupos funcionais
const menuGroups = [
  {
    id: 'gestao',
    title: 'GESTÃO',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/',
        badge: null,
      },
      {
        id: 'financial',
        label: 'Financeiro',
        icon: DollarSign,
        path: '/financial',
        badge: null,
      },
      {
        id: 'reports',
        label: 'Relatórios',
        icon: BarChart3,
        path: '/reports',
        badge: null,
      },
    ],
  },
  {
    id: 'operacao',
    title: 'OPERAÇÃO',
    items: [
      {
        id: 'caixa',
        label: 'Caixa',
        icon: DollarSign,
        path: '/caixa',
        badge: null,
        roles: ['admin', 'gerente', 'recepcionista'],
      },
      {
        id: 'comandas',
        label: 'Comandas',
        icon: FileText,
        path: '/comandas',
        badge: null,
      },
      {
        id: 'servicos',
        label: 'Serviços',
        icon: Scissors,
        path: '/servicos',
        badge: null,
      },
      {
        id: 'comissoes',
        label: 'Comissões',
        icon: TrendingUp,
        path: '/comissoes',
        badge: null,
      },
      {
        id: 'professionals',
        label: 'Profissionais',
        icon: Users,
        path: '/professionals',
        badge: null,
      },
      {
        id: 'queue',
        label: 'Lista da Vez',
        icon: Calendar,
        path: '/queue',
        badge: 3,
      },
      {
        id: 'units',
        label: 'Unidades',
        icon: Building2,
        path: '/units',
        badge: null,
      },
    ],
  },
  {
    id: 'administracao',
    title: 'ADMINISTRAÇÃO',
    items: [
      {
        id: 'cadastros',
        label: 'Cadastros',
        icon: FolderOpen,
        badge: null,
        hasSubmenu: true,
        submenu: [
          {
            id: 'payment-methods',
            label: 'Formas de Pagamento',
            icon: CreditCard,
            path: '/cadastros/formas-pagamento',
          },
          {
            id: 'suppliers',
            label: 'Fornecedores',
            icon: Package,
            path: '/cadastros/fornecedores',
          },
          {
            id: 'clients',
            label: 'Clientes',
            icon: Users,
            path: '/cadastros/clientes',
          },
          {
            id: 'products',
            label: 'Produtos',
            icon: Package,
            path: '/cadastros/produtos',
          },
          {
            id: 'categories',
            label: 'Categorias',
            icon: Tags,
            path: '/cadastros/categorias',
          },
          {
            id: 'goals',
            label: 'Metas',
            icon: Target,
            path: '/cadastros/metas',
          },
        ],
      },
      {
        id: 'user-management',
        label: 'Usuários',
        icon: Users,
        path: '/user-management',
        badge: null,
        adminOnly: true,
      },
      {
        id: 'settings',
        label: 'Configurações',
        icon: Settings,
        path: '/settings',
      },
    ],
  },
];

const bottomMenuItems = [
  {
    id: 'logout',
    label: 'Sair',
    icon: LogOut,
    path: '/logout',
  },
];

export function Sidebar({ isOpen, onClose, activeItem = 'dashboard' }) {
  const navigate = useNavigate();
  const { signOut, isAdmin, receptionistStatus, gerenteStatus, adminStatus } =
    useAuth();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  // Lista de itens bloqueados para gerente
  const gerenteBlockedItems = [
    'payment-methods',
    'products',
    'professionals',
    'units',
    'settings',
    'user-management',
    'reports',
  ];
  const gerenteBlockedPaths = [
    '/cadastros/formas-pagamento',
    '/cadastros/produtos',
    '/professionals',
    '/units',
    '/settings',
    '/user-management',
    '/reports',
  ];

  // Filtrar grupos do menu baseado nas permissões do usuário
  const filteredMenuGroups = menuGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        // Se for Recepcionista, mostrar apenas "Lista da Vez"
        if (receptionistStatus) {
          return item.id === 'queue';
        }

        // Se for Gerente, bloquear itens específicos
        if (gerenteStatus && !adminStatus) {
          // Bloquear itens principais bloqueados
          if (gerenteBlockedItems.includes(item.id)) {
            return false;
          }

          // Bloquear pelo path
          if (item.path && gerenteBlockedPaths.includes(item.path)) {
            return false;
          }

          // Se tem submenu, filtrar os subitens
          if (item.hasSubmenu && item.submenu) {
            item.submenu = item.submenu.filter(subItem => {
              return (
                !gerenteBlockedItems.includes(subItem.id) &&
                !gerenteBlockedPaths.includes(subItem.path)
              );
            });
            // Se não sobrou nenhum subitem, ocultar o item pai
            if (item.submenu.length === 0) {
              return false;
            }
          }
        }

        // Lógica normal para outros papéis
        if (item.adminOnly) {
          return isAdmin();
        }
        return true;
      }),
    }))
    .filter(group => group.items.length > 0);

  const handleItemClick = async item => {
    // Se tem submenu, toggle o submenu
    if (item.hasSubmenu) {
      setOpenSubmenu(openSubmenu === item.id ? null : item.id);
      return;
    }

    // Navega para a página correspondente
    if (item.id === 'logout') {
      // Faz logout e redireciona para login
      await signOut();
      navigate('/login');
    } else if (item.path) {
      navigate(item.path);
    }

    if (window.innerWidth < 1024) {
      onClose(); // Fecha sidebar no mobile após clique
    }
  };

  const handleSubmenuClick = submenuItem => {
    navigate(submenuItem.path);

    if (window.innerWidth < 1024) {
      onClose(); // Fecha sidebar no mobile após clique
    }
  };

  return (
    <>
      {/* Overlay para mobile - Design System compliant */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-label="Fechar menu"
        />
      )}

      {/* Sidebar - Usando tokens do Design System */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
          w-64 h-full 
          bg-light-surface dark:bg-dark-surface 
          border-r border-light-border dark:border-dark-border
          flex-shrink-0
          transform transition-transform duration-300 ease-in-out lg:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        aria-label="Menu de navegação principal"
      >
        {/* Custom Scrollbar - Design System */}
        <style>{`
          .sidebar-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb {
            background-color: rgba(77, 163, 255, 0.2);
            border-radius: 10px;
            transition: background-color 0.2s;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background-color: rgba(77, 163, 255, 0.4);
          }
          .sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          
          /* Dark mode scrollbar */
          .dark .sidebar-scroll::-webkit-scrollbar-thumb {
            background-color: rgba(77, 163, 255, 0.15);
          }
          .dark .sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background-color: rgba(77, 163, 255, 0.3);
          }
        `}</style>

        <div className="flex flex-col h-full">
          {/* Header Mobile - Design System Typography */}
          <div className="flex items-center justify-between p-4 border-b border-light-border dark:border-dark-border lg:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-base">TB</span>
              </div>
              <div>
                <h2 className="text-text-light-primary dark:text-text-dark-primary font-semibold text-sm">
                  Gestão Trato de Barbados
                </h2>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs">
                  Sistema de Gestão
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-text-light-secondary dark:text-text-dark-secondary hover:bg-light-bg dark:hover:bg-dark-bg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark-surface"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Unit Selector - Design System Card Theme */}
          <div className="px-4 py-4 border-b border-light-border dark:border-dark-border bg-primary-light dark:bg-primary/5">
            <label className="block text-xs text-text-light-secondary dark:text-text-dark-secondary mb-2 font-medium uppercase tracking-wide">
              Unidade:
            </label>
            <UnitSelector className="w-full" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto sidebar-scroll">
            {filteredMenuGroups.map((group, groupIndex) => (
              <div key={group.id} className={groupIndex > 0 ? 'mt-6' : ''}>
                {/* Group Title - Design System Typography */}
                {group.title && (
                  <div className="px-3 mb-2 mt-4 first:mt-0">
                    <h3 className="text-xs font-semibold tracking-wider text-text-light-secondary dark:text-text-dark-secondary uppercase opacity-70">
                      {group.title}
                    </h3>
                  </div>
                )}

                {/* Itens do Grupo */}
                <div className="space-y-1">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeItem === item.id;
                    const isSubmenuOpen = openSubmenu === item.id;

                    return (
                      <div key={item.id}>
                        {/* Menu Item Principal - Design System */}
                        <button
                          onClick={() => handleItemClick(item)}
                          aria-label={item.label}
                          aria-current={isActive ? 'page' : undefined}
                          className={`
                            group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                            text-left text-sm font-medium cursor-pointer
                            transition-all duration-200 ease-in-out
                            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark-surface
                            ${
                              isActive
                                ? 'bg-primary/10 dark:bg-primary/15 text-primary shadow-sm'
                                : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-light-bg dark:hover:bg-white/5 hover:text-text-light-primary dark:hover:text-text-dark-primary'
                            }
                          `}
                        >
                          <Icon
                            className={`h-5 w-5 flex-shrink-0 transition-all duration-200 ${
                              isActive
                                ? 'opacity-100 scale-110'
                                : 'opacity-70 group-hover:opacity-100 group-hover:scale-105'
                            }`}
                          />
                          <span className="flex-1">{item.label}</span>

                          {/* Badge - Design System */}
                          {item.badge && !item.hasSubmenu && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/15 text-primary">
                              {item.badge}
                            </span>
                          )}

                          {/* Active Indicator */}
                          {isActive && !item.hasSubmenu && (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          )}

                          {/* Submenu Chevron - Design System */}
                          {item.hasSubmenu && (
                            <ChevronRight
                              className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
                                isSubmenuOpen ? 'rotate-90' : ''
                              }`}
                            />
                          )}
                        </button>

                        {/* Submenu - Design System */}
                        {item.hasSubmenu && isSubmenuOpen && item.submenu && (
                          <div className="ml-4 mt-1 mb-2 space-y-0.5 border-l-2 border-primary/20 dark:border-primary/15 pl-3">
                            {item.submenu.map(subItem => {
                              const SubIcon = subItem.icon;
                              const isSubActive = activeItem === subItem.id;

                              return (
                                <button
                                  key={subItem.id}
                                  onClick={() => handleSubmenuClick(subItem)}
                                  aria-label={subItem.label}
                                  aria-current={
                                    isSubActive ? 'page' : undefined
                                  }
                                  className={`
                                    group relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                                    text-left text-sm font-medium cursor-pointer
                                    transition-all duration-200 ease-in-out
                                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark-surface
                                    ${
                                      isSubActive
                                        ? 'bg-primary/10 dark:bg-primary/15 text-primary'
                                        : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-light-bg dark:hover:bg-white/5 hover:text-text-light-primary dark:hover:text-text-dark-primary'
                                    }
                                  `}
                                >
                                  <SubIcon
                                    className={`h-4 w-4 flex-shrink-0 transition-all duration-200 ${
                                      isSubActive
                                        ? 'opacity-100 scale-105'
                                        : 'opacity-70 group-hover:opacity-100'
                                    }`}
                                  />
                                  <span className="flex-1">
                                    {subItem.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom Menu - Design System */}
          <div className="px-3 py-4 border-t border-light-border dark:border-dark-border bg-light-bg/50 dark:bg-dark-bg/30">
            {bottomMenuItems.map(item => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  aria-label={item.label}
                  className="
                    group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    text-left text-sm font-medium cursor-pointer
                    text-text-light-secondary dark:text-text-dark-secondary
                    hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400
                    transition-all duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-dark-surface
                  "
                >
                  <Icon className="h-5 w-5 flex-shrink-0 transition-all duration-200 group-hover:scale-110" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
