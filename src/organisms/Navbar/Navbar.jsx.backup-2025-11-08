/**
 * @file Navbar.jsx
 * @description Barra de navegação superior do sistema
 * Refatorado para seguir 100% o Design System (DESIGN_SYSTEM.md)
 * @author Barber Analytics Pro Team
 * @date 2025-10-26
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggleCompact } from '../../atoms/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Bell,
  Search,
  User,
  ChevronDown,
  Settings,
  LogOut,
  UserCircle,
} from 'lucide-react';
export function Navbar({ onMenuToggle }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = event => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
  };
  const handleProfileClick = () => {
    navigate('/profile');
    setIsUserMenuOpen(false);
  };
  const getUserDisplayName = () => {
    return user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  };
  const getUserRole = () => {
    const role = user?.user_metadata?.role || 'barbeiro';
    const roles = {
      admin: 'Administrador',
      gerente: 'Gerente',
      manager: 'Gerente',
      barbeiro: 'Barbeiro',
      barber: 'Barbeiro',
      recepcionista: 'Recepcionista',
      receptionist: 'Recepcionista',
    };
    return roles[role] || 'Usuário';
  };
  return (
    <nav className="sticky top-0 z-50 border-b border-light-border bg-light-surface/95 shadow-sm backdrop-blur-md transition-all duration-200 dark:border-dark-border dark:bg-dark-surface/95">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left section - Menu & Logo */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button - Design System */}
            <button
              onClick={onMenuToggle}
              className="dark:hover:card-theme/5 rounded-lg p-2 text-text-light-secondary transition-all duration-200 hover:bg-light-bg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:text-text-dark-secondary dark:focus:ring-offset-dark-surface lg:hidden"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo - Design System */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-md">
                <span className="text-dark-text-primary text-base font-bold">
                  TB
                </span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-semibold leading-tight text-text-light-primary dark:text-text-dark-primary">
                  Gestão Trato de Barbados
                </h1>
                <p className="text-xs leading-tight text-text-light-secondary dark:text-text-dark-secondary">
                  Sistema de Gestão
                </p>
              </div>
            </div>
          </div>

          {/* Center section - Search Bar - Design System */}
          <div className="mx-8 hidden max-w-md flex-1 md:flex">
            <div className="group relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-text-light-secondary transition-colors duration-200 group-focus-within:text-primary dark:text-text-dark-secondary" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full rounded-lg border border-light-border bg-light-bg py-2 pl-10 pr-4 text-text-light-primary transition-all duration-200 placeholder:text-text-light-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:placeholder:text-text-dark-secondary"
                aria-label="Campo de busca"
              />
            </div>
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center gap-2">
            {/* Search button (mobile) - Design System */}
            <button
              className="dark:hover:card-theme/5 rounded-lg p-2 text-text-light-secondary transition-all duration-200 hover:bg-light-bg hover:text-text-light-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:text-text-dark-secondary dark:hover:text-text-dark-primary dark:focus:ring-offset-dark-surface md:hidden"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Notifications - Design System */}
            <button
              className="dark:hover:card-theme/5 relative rounded-lg p-2 text-text-light-secondary transition-all duration-200 hover:bg-light-bg hover:text-text-light-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:text-text-dark-secondary dark:hover:text-text-dark-primary dark:focus:ring-offset-dark-surface"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-light-surface dark:bg-red-400 dark:ring-dark-surface"></span>
            </button>

            {/* Theme toggle */}
            <ThemeToggleCompact />

            {/* User menu - Design System */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="dark:hover:card-theme/5 flex items-center gap-2 rounded-lg p-2 text-text-light-secondary transition-all duration-200 hover:bg-light-bg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:text-text-dark-secondary dark:focus:ring-offset-dark-surface"
                aria-label="Menu do usuário"
                aria-expanded={isUserMenuOpen}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary shadow-md ring-2 ring-light-surface dark:ring-dark-surface">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Avatar do usuário"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="text-dark-text-primary h-5 w-5" />
                  )}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold leading-tight text-text-light-primary dark:text-text-dark-primary">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs leading-tight text-text-light-secondary dark:text-text-dark-secondary">
                    {getUserRole()}
                  </p>
                </div>
                <ChevronDown
                  className={`hidden h-4 w-4 transition-transform duration-200 sm:block ${isUserMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown menu - Design System */}
              {isUserMenuOpen && (
                <div className="card-theme animate-in fade-in slide-in-from-top-2 absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-light-border shadow-xl duration-200 dark:border-dark-border">
                  {/* User Info Header */}
                  <div className="border-b border-light-border bg-primary/5 p-4 dark:border-dark-border dark:bg-primary/10">
                    <p className="truncate font-semibold text-text-light-primary dark:text-text-dark-primary">
                      {getUserDisplayName()}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      {user?.email}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                      {getUserRole()}
                    </span>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1.5">
                    <button
                      onClick={handleProfileClick}
                      className="dark:hover:card-theme/5 dark:focus:card-theme/5 flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-light-secondary transition-all duration-200 hover:bg-light-bg hover:text-text-light-primary focus:bg-light-bg focus:outline-none dark:text-text-dark-secondary dark:hover:text-text-dark-primary"
                    >
                      <UserCircle className="h-4 w-4 flex-shrink-0" />
                      <span>Meu Perfil</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate('/settings');
                        setIsUserMenuOpen(false);
                      }}
                      className="dark:hover:card-theme/5 dark:focus:card-theme/5 flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-light-secondary transition-all duration-200 hover:bg-light-bg hover:text-text-light-primary focus:bg-light-bg focus:outline-none dark:text-text-dark-secondary dark:hover:text-text-dark-primary"
                    >
                      <Settings className="h-4 w-4 flex-shrink-0" />
                      <span>Configurações</span>
                    </button>
                  </div>

                  {/* Logout - Design System */}
                  <div className="border-t border-light-border py-1.5 dark:border-dark-border">
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 transition-all duration-200 hover:bg-red-500/10 focus:bg-red-500/10 focus:outline-none dark:text-red-400 dark:hover:bg-red-400/10 dark:focus:bg-red-400/10"
                    >
                      <LogOut className="h-4 w-4 flex-shrink-0" />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
