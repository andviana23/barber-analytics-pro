import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggleCompact } from '../../atoms/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, Search, User, ChevronDown, Settings, LogOut, UserCircle } from 'lucide-react';

export function Navbar({ onMenuToggle }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
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
    const role = user?.user_metadata?.role || 'barber';
    const roles = {
      admin: 'Administrador',
      manager: 'Gerente', 
      barber: 'Barbeiro'
    };
    return roles[role] || 'Barbeiro';
  };

  return (
    <nav className="sticky top-0 z-50 bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-sm border-b border-light-border dark:border-dark-border transition-colors duration-300">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg text-text-light-secondary dark:text-text-dark-secondary hover:bg-light-bg dark:hover:bg-dark-bg transition-colors duration-300"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TB</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-text-light-primary dark:text-text-dark-primary font-semibold text-lg">
                  Gestão Trato de Barbados
                </h1>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs">
                  Sistema de Gestão
                </p>
              </div>
            </div>
          </div>

          {/* Center section - Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-300"
              />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Search button (mobile) */}
            <button className="md:hidden p-2 rounded-lg text-text-light-secondary dark:text-text-dark-secondary hover:bg-light-bg dark:hover:bg-dark-bg transition-colors duration-300">
              <Search className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-text-light-secondary dark:text-text-dark-secondary hover:bg-light-bg dark:hover:bg-dark-bg transition-colors duration-300">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-feedback-light-error dark:bg-feedback-dark-error rounded-full"></span>
            </button>

            {/* Theme toggle */}
            <ThemeToggleCompact />

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg text-text-light-secondary dark:text-text-dark-secondary hover:bg-light-bg dark:hover:bg-dark-bg transition-colors duration-300"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  {user?.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="Avatar" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-text-light-primary dark:text-text-dark-primary text-sm font-medium">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs">
                    {getUserRole()}
                  </p>
                </div>
                <ChevronDown className="hidden sm:block h-4 w-4" />
              </button>

              {/* Dropdown menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-light-border dark:border-dark-border">
                    <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      {user?.email}
                    </p>
                    <span className="inline-flex items-center gap-1 px-2 py-1 mt-2 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {getUserRole()}
                    </span>
                  </div>
                  
                  <div className="py-2">
                    <button
                      onClick={handleProfileClick}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-text-light-secondary dark:text-text-dark-secondary hover:bg-light-bg dark:hover:bg-dark-bg transition-colors duration-200"
                    >
                      <UserCircle className="h-4 w-4" />
                      Meu Perfil
                    </button>
                    
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setIsUserMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-text-light-secondary dark:text-text-dark-secondary hover:bg-light-bg dark:hover:bg-dark-bg transition-colors duration-200"
                    >
                      <Settings className="h-4 w-4" />
                      Configurações
                    </button>
                  </div>
                  
                  <div className="border-t border-light-border dark:border-dark-border py-2">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-feedback-light-error dark:text-feedback-dark-error hover:bg-feedback-light-error/10 dark:hover:bg-feedback-dark-error/10 transition-colors duration-200"
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