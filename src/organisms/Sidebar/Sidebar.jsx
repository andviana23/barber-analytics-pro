import React from 'react';
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
} from 'lucide-react';

const menuItems = [
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
    id: 'reports',
    label: 'Relatórios',
    icon: BarChart3,
    path: '/reports',
    badge: null,
  },
  {
    id: 'units',
    label: 'Unidades',
    icon: Building2,
    path: '/units',
    badge: null,
  },
];

const bottomMenuItems = [
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    path: '/settings',
  },
  {
    id: 'logout',
    label: 'Sair',
    icon: LogOut,
    path: '/logout',
  },
];

export function Sidebar({ isOpen, onClose, activeItem = 'dashboard' }) {
  const handleItemClick = () => {
    // TODO: Implementar navegação com React Router
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
        className={`
          fixed top-0 left-0 z-50 w-64 h-full
          bg-light-surface dark:bg-dark-surface
          border-r border-light-border dark:border-dark-border
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
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

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    text-left transition-colors duration-300
                    ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-light-bg dark:hover:bg-dark-bg hover:text-text-light-primary dark:hover:text-text-dark-primary'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`
                        ml-auto px-2 py-0.5 text-xs rounded-full
                        ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-primary text-white'
                        }
                      `}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Unit selector */}
          <div className="p-4 border-t border-light-border dark:border-dark-border">
            <div className="mb-3">
              <label className="text-text-light-secondary dark:text-text-dark-secondary text-xs font-medium">
                UNIDADE ATUAL
              </label>
            </div>
            <select className="w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-text-light-primary dark:text-text-dark-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-300">
              <option value="mangabeiras">Mangabeiras</option>
              <option value="nova-lima">Nova Lima</option>
              <option value="all">Todas as Unidades</option>
            </select>
          </div>

          {/* Bottom menu */}
          <div className="p-4 border-t border-light-border dark:border-dark-border space-y-2">
            {bottomMenuItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-text-light-secondary dark:text-text-dark-secondary hover:bg-light-bg dark:hover:bg-dark-bg hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors duration-300"
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User info */}
          <div className="p-4 border-t border-light-border dark:border-dark-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">JS</span>
              </div>
              <div>
                <p className="text-text-light-primary dark:text-text-dark-primary text-sm font-medium">
                  João Silva
                </p>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs">
                  Administrador
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}