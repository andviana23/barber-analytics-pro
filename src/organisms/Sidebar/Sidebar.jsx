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
  const { signOut, isAdmin } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState(null);
  
  // Filtrar grupos do menu baseado nas permissões do usuário
  const filteredMenuGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.adminOnly) {
        return isAdmin();
      }
      return true;
    }),
  })).filter(group => group.items.length > 0);

  const handleItemClick = async (item) => {
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

  const handleSubmenuClick = (submenuItem) => {
    navigate(submenuItem.path);
    
    if (window.innerWidth < 1024) {
      onClose(); // Fecha sidebar no mobile após clique
    }
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className="w-64 h-full bg-light-surface dark:bg-dark-surface border-r border-light-border dark:border-dark-border flex-shrink-0"
      >
        <style>{`
          /* Custom Scrollbar - Minimalista e Elegante */
          .sidebar-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb {
            background-color: rgba(197, 166, 118, 0.35);
            border-radius: 10px;
          }
          .sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
        `}</style>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-light-border dark:border-dark-border lg:hidden">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BA</span>
              </div>
              <div>
                <h2 className="text-text-light-primary dark:text-text-dark-primary font-semibold">
                  Barber Analytics
                </h2>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs">
                  Pro Dashboard
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-text-light-secondary dark:text-text-dark-secondary hover:bg-light-bg dark:hover:bg-dark-bg transition-colors duration-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Unit selector - Topo */}
          <div className="px-4 py-2.5 border-b border-light-border dark:border-dark-border">
            <label className="block text-[10px] text-gray-500 dark:text-gray-500 mb-1 font-medium">
              Unidade:
            </label>
            <UnitSelector className="w-full bg-transparent border-none p-0 text-[11px] text-gray-300 focus:outline-none" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto sidebar-scroll">
            {filteredMenuGroups.map((group, groupIndex) => (
              <div key={group.id} className={groupIndex > 0 ? 'mt-6' : ''}>
                {/* Título do Grupo */}
                <div className="px-3 mb-2 mt-6">
                  <h3 className="text-sm font-semibold tracking-wide text-gray-400 dark:text-gray-400 uppercase">
                    {group.title}
                  </h3>
                </div>

                {/* Itens do Grupo */}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeItem === item.id;
                    const isSubmenuOpen = openSubmenu === item.id;

                    return (
                      <div key={item.id}>
                        {/* Menu Item Principal */}
                        <button
                          onClick={() => handleItemClick(item)}
                          aria-label={item.label}
                          className={`
                            group relative w-full h-9 flex items-center gap-2 px-2 rounded-md
                            text-left text-xs font-medium cursor-pointer
                            transition-all duration-200 ease-in-out
                            ${
                              isActive
                                ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary dark:from-primary/20 dark:to-primary/10 shadow-sm'
                                : 'text-gray-300 dark:text-gray-300 hover:bg-white/5 dark:hover:bg-white/5 hover:text-gray-100 dark:hover:text-gray-100'
                            }
                          `}
                        >
                          {/* Linha Lateral Dourada (Active State) */}
                          {isActive && (
                            <div 
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-[#C5A676] rounded-r-full"
                              style={{ boxShadow: '0 0 8px rgba(197, 166, 118, 0.5)' }}
                            />
                          )}

                          <Icon 
                            className={`h-4 w-4 flex-shrink-0 transition-opacity duration-200 ${
                              isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                            }`}
                          />
                          <span className="flex-1 lg:block hidden">{item.label}</span>
                          
                          {/* Badge */}
                          {item.badge && !item.hasSubmenu && (
                            <span
                              className={`
                                px-1.5 py-0.5 text-[10px] font-semibold rounded-full
                                transition-all duration-200
                                ${
                                  isActive
                                    ? 'bg-primary text-white'
                                    : 'bg-primary/20 text-primary group-hover:bg-primary/30'
                                }
                              `}
                            >
                              {item.badge}
                            </span>
                          )}

                          {/* Ícone de submenu */}
                          {item.hasSubmenu && (
                            <div className="text-[#C5A676]">
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
                          <div className="ml-5 mt-1 space-y-1 border-l border-gray-700 dark:border-gray-700 pl-2">
                            {item.submenu.map((subItem) => {
                              const SubIcon = subItem.icon;
                              const isSubActive = activeItem === subItem.id;

                              return (
                                <button
                                  key={subItem.id}
                                  onClick={() => handleSubmenuClick(subItem)}
                                  aria-label={subItem.label}
                                  className={`
                                    group relative w-full h-8 flex items-center gap-2 px-2 rounded-md
                                    text-left text-xs font-medium cursor-pointer
                                    transition-all duration-200 ease-in-out
                                    ${
                                      isSubActive
                                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                        : 'text-gray-300 dark:text-gray-300 hover:bg-white/5 dark:hover:bg-white/5 hover:text-gray-100 dark:hover:text-gray-100'
                                    }
                                  `}
                                >
                                  <SubIcon 
                                    className={`h-3.5 w-3.5 flex-shrink-0 transition-opacity duration-200 ${
                                      isSubActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                                    }`}
                                  />
                                  <span className="lg:block hidden">{subItem.label}</span>
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
          <div className="px-4 py-3 border-t border-light-border dark:border-dark-border">
            {bottomMenuItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  aria-label={item.label}
                  className="group w-full h-9 flex items-center gap-2 px-2 rounded-md text-left text-sm font-medium cursor-pointer text-[#e74c3c] dark:text-[#e74c3c] opacity-80 hover:opacity-100 hover:translate-x-1 transition-all duration-200"
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="lg:block hidden">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}