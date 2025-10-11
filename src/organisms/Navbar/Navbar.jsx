import React from 'react';
import { ThemeToggleCompact } from '../../atoms/ThemeToggle';
import { Menu, Bell, Search, User, ChevronDown } from 'lucide-react';

export function Navbar({ onMenuToggle }) {

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
                <span className="text-white font-bold text-sm">BA</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-text-light-primary dark:text-text-dark-primary font-semibold text-lg">
                  Barber Analytics
                </h1>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs">
                  Pro Dashboard
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
            <div className="relative">
              <button className="flex items-center gap-2 p-2 rounded-lg text-text-light-secondary dark:text-text-dark-secondary hover:bg-light-bg dark:hover:bg-dark-bg transition-colors duration-300">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-text-light-primary dark:text-text-dark-primary text-sm font-medium">
                    João Silva
                  </p>
                  <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs">
                    Administrador
                  </p>
                </div>
                <ChevronDown className="hidden sm:block h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}