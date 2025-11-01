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
    <nav className="sticky top-0 z-50 bg-light-surface/95 dark:bg-dark-surface/95 backdrop-blur-md border-b border-light-border dark:border-dark-border transition-all duration-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section - Menu & Logo */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button - Design System */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg text-text-light-secondary dark:text-text-dark-secondary hover:bg-light-bg dark:hover:card-theme/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark-surface"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo - Design System */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-md">
                <span className="text-dark-text-primary font-bold text-base">
                  TB
                </span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-text-light-primary dark:text-text-dark-primary font-semibold text-base leading-tight">
                  Gestão Trato de Barbados
                </h1>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs leading-tight">
                  Sistema de Gestão
                </p>
              </div>
            </div>
          </div>

          {/* Center section - Search Bar - Design System */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary group-focus-within:text-primary transition-colors duration-200" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                aria-label="Campo de busca"
              />
            </div>
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center gap-2">
            {/* Search button (mobile) - Design System */}
            <button
              className="md:hidden p-2 rounded-lg text-text-light-secondary dark:text-text-dark-secondary hover:bg-light-bg dark:hover:card-theme/5 hover:text-text-light-primary dark:hover:text-text-dark-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark-surface"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Notifications - Design System */}
            <button
              className="relative p-2 rounded-lg text-text-light-secondary dark:text-text-dark-secondary hover:bg-light-bg dark:hover:card-theme/5 hover:text-text-light-primary dark:hover:text-text-dark-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark-surface"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full ring-2 ring-light-surface dark:ring-dark-surface"></span>
            </button>

            {/* Theme toggle */}
            <ThemeToggleCompact />

            {/* User menu - Design System */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg text-text-light-secondary dark:text-text-dark-secondary hover:bg-light-bg dark:hover:card-theme/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark-surface"
                aria-label="Menu do usuário"
                aria-expanded={isUserMenuOpen}
              >
                <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center shadow-md ring-2 ring-light-surface dark:ring-dark-surface">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Avatar do usuário"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-dark-text-primary" />
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-text-light-primary dark:text-text-dark-primary text-sm font-semibold leading-tight">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs leading-tight">
                    {getUserRole()}
                  </p>
                </div>
                <ChevronDown
                  className={`hidden sm:block h-4 w-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown menu - Design System */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 card-theme border border-light-border dark:border-dark-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User Info Header */}
                  <div className="p-4 bg-primary/5 dark:bg-primary/10 border-b border-light-border dark:border-dark-border">
                    <p className="font-semibold text-text-light-primary dark:text-text-dark-primary truncate">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary truncate mt-0.5">
                      {user?.email}
                    </p>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-2 rounded-full text-xs font-semibold bg-primary/15 text-primary">
                      {getUserRole()}
                    </span>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1.5">
                    <button
                      onClick={handleProfileClick}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:bg-light-bg dark:hover:card-theme/5 hover:text-text-light-primary dark:hover:text-text-dark-primary transition-all duration-200 focus:outline-none focus:bg-light-bg dark:focus:card-theme/5"
                    >
                      <UserCircle className="h-4 w-4 flex-shrink-0" />
                      <span>Meu Perfil</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate('/settings');
                        setIsUserMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:bg-light-bg dark:hover:card-theme/5 hover:text-text-light-primary dark:hover:text-text-dark-primary transition-all duration-200 focus:outline-none focus:bg-light-bg dark:focus:card-theme/5"
                    >
                      <Settings className="h-4 w-4 flex-shrink-0" />
                      <span>Configurações</span>
                    </button>
                  </div>

                  {/* Logout - Design System */}
                  <div className="border-t border-light-border dark:border-dark-border py-1.5">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-400/10 transition-all duration-200 focus:outline-none focus:bg-red-500/10 dark:focus:bg-red-400/10"
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
