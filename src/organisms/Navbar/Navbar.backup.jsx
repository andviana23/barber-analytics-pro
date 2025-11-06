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
    <nav className="sticky top-0 z-50 border-b border-light-border bg-light-surface/80 backdrop-blur-sm transition-colors duration-300 dark:border-dark-border dark:bg-dark-surface/80">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={onMenuToggle}
              className="rounded-lg p-2 text-text-light-secondary transition-colors duration-300 hover:bg-light-bg dark:text-text-dark-secondary dark:hover:bg-dark-bg lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-dark-text-primary text-sm font-bold">
                  TB
                </span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                  Gestão Trato de Barbados
                </h1>
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  Sistema de Gestão
                </p>
              </div>
            </div>
          </div>

          {/* Center section - Search */}
          <div className="mx-8 hidden max-w-md flex-1 md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-text-light-secondary dark:text-text-dark-secondary" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full rounded-lg border border-light-border bg-light-bg py-2 pl-10 pr-4 text-text-light-primary transition-colors duration-300 placeholder:text-text-light-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:placeholder:text-text-dark-secondary"
              />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Search button (mobile) */}
            <button className="rounded-lg p-2 text-text-light-secondary transition-colors duration-300 hover:bg-light-bg dark:text-text-dark-secondary dark:hover:bg-dark-bg md:hidden">
              <Search className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <button className="relative rounded-lg p-2 text-text-light-secondary transition-colors duration-300 hover:bg-light-bg dark:text-text-dark-secondary dark:hover:bg-dark-bg">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-feedback-light-error dark:bg-feedback-dark-error"></span>
            </button>

            {/* Theme toggle */}
            <ThemeToggleCompact />

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 rounded-lg p-2 text-text-light-secondary transition-colors duration-300 hover:bg-light-bg dark:text-text-dark-secondary dark:hover:bg-dark-bg"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="text-dark-text-primary h-4 w-4" />
                  )}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    {getUserRole()}
                  </p>
                </div>
                <ChevronDown className="hidden h-4 w-4 sm:block" />
              </button>

              {/* Dropdown menu */}
              {isUserMenuOpen && (
                <div className="card-theme absolute right-0 z-50 mt-2 w-56 rounded-lg border border-light-border shadow-lg dark:border-dark-border">
                  <div className="border-b border-light-border p-4 dark:border-dark-border">
                    <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      {user?.email}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {getUserRole()}
                    </span>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={handleProfileClick}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-text-light-secondary transition-colors duration-200 hover:bg-light-bg dark:text-text-dark-secondary dark:hover:bg-dark-bg"
                    >
                      <UserCircle className="h-4 w-4" />
                      Meu Perfil
                    </button>

                    <button
                      onClick={() => {
                        navigate('/settings');
                        setIsUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-text-light-secondary transition-colors duration-200 hover:bg-light-bg dark:text-text-dark-secondary dark:hover:bg-dark-bg"
                    >
                      <Settings className="h-4 w-4" />
                      Configurações
                    </button>
                  </div>

                  <div className="border-t border-light-border py-2 dark:border-dark-border">
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-feedback-light-error transition-colors duration-200 hover:bg-feedback-light-error/10 dark:text-feedback-dark-error dark:hover:bg-feedback-dark-error/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
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
