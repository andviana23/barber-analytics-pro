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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={onClose}
          aria-label="Fechar menu"
        />
      )}

      {/* Sidebar - Usando tokens do Design System */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 h-full w-64 flex-shrink-0 transform border-r border-light-border bg-light-surface transition-transform duration-300 ease-in-out dark:border-dark-border dark:bg-dark-surface lg:static lg:z-auto lg:transform-none ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} `}
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

        <div className="flex h-full flex-col">
          {/* Header Mobile - Design System Typography */}
          <div className="flex items-center justify-between border-b border-light-border p-4 dark:border-dark-border lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-md">
                <span className="text-dark-text-primary text-base font-bold">
                  TB
                </span>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                  Gestão Trato de Barbados
                </h2>
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  Sistema de Gestão
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-text-light-secondary transition-all duration-200 hover:bg-light-bg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:text-text-dark-secondary dark:hover:bg-dark-bg dark:focus:ring-offset-dark-surface"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Unit Selector - Design System Card Theme */}
          <div className="border-b border-light-border bg-primary-light px-4 py-4 dark:border-dark-border dark:bg-primary/5">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary">
              Unidade:
            </label>
            <UnitSelector className="w-full" />
          </div>

          {/* Navigation */}
          <nav className="sidebar-scroll flex-1 overflow-y-auto p-4">
            {filteredMenuGroups.map((group, groupIndex) => (
              <div key={group.id} className={groupIndex > 0 ? 'mt-6' : ''}>
                {/* Título do Grupo */}
                <div className="mb-2 mt-6 px-3">
                  <h3 className="text-light-text-muted dark:text-dark-text-muted dark:text-light-text-muted text-sm font-semibold uppercase tracking-wide">
                    {group.title}
                  </h3>
                </div>

                {/* Itens do Grupo */}
                <div className="space-y-1">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeItem === item.id;
                    const isSubmenuOpen = openSubmenu === item.id;
                    return (
                      <div key={item.id}>
                        {/* Menu Item Principal */}
                        <button
                          onClick={() => handleItemClick(item)}
                          aria-label={item.label}
                          className={`group relative flex h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-xs font-medium transition-all duration-200 ease-in-out ${isActive ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm dark:from-primary/20 dark:to-primary/10' : 'text-gray-300 hover:bg-white/5 hover:text-gray-100 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-gray-100'} `}
                        >
                          {/* Linha Lateral Dourada (Active State) */}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-amber-500 shadow-glow-amber dark:bg-amber-400" />
                          )}

                          <Icon
                            className={`h-4 w-4 flex-shrink-0 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                          />
                          <span className="hidden flex-1 lg:block">
                            {item.label}
                          </span>

                          {/* Badge */}
                          {item.badge && !item.hasSubmenu && (
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-all duration-200 ${isActive ? 'bg-primary text-white' : 'bg-primary/20 text-primary group-hover:bg-primary/30'} `}
                            >
                              {item.badge}
                            </span>
                          )}

                          {/* Ícone de submenu */}
                          {item.hasSubmenu && (
                            <div className="text-amber-500 dark:text-amber-400">
                              {isSubmenuOpen ? (
                                <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200" />
                              )}
                            </div>
                          )}
                        </button>

                        {/* Submenu */}
                        {item.hasSubmenu && isSubmenuOpen && item.submenu && (
                          <div className="ml-5 mt-1 space-y-1 border-l border-dark-border pl-2 dark:border-dark-border">
                            {item.submenu.map(subItem => {
                              const SubIcon = subItem.icon;
                              const isSubActive = activeItem === subItem.id;
                              return (
                                <button
                                  key={subItem.id}
                                  onClick={() => handleSubmenuClick(subItem)}
                                  aria-label={subItem.label}
                                  className={`group relative flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-xs font-medium transition-all duration-200 ease-in-out ${isSubActive ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'text-gray-300 hover:bg-white/5 hover:text-gray-100 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-gray-100'} `}
                                >
                                  <SubIcon
                                    className={`h-3.5 w-3.5 flex-shrink-0 transition-opacity duration-200 ${isSubActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                                  />
                                  <span className="hidden lg:block">
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

          {/* Bottom menu */}
          <div className="border-t border-light-border px-4 py-3 dark:border-dark-border">
            {bottomMenuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  aria-label={item.label}
                  className="group flex h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-red-500 opacity-80 transition-all duration-200 hover:translate-x-1 hover:opacity-100 dark:text-red-400"
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden lg:block">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
