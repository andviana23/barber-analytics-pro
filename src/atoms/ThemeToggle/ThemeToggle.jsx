import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
export function ThemeToggle() {
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme();

  // Função para obter o ícone baseado no tema atual
  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="h-4 w-4" />;
    }
    return actualTheme === 'light' ? (
      <Sun className="h-4 w-4" />
    ) : (
      <Moon className="h-4 w-4" />
    );
  };
  return (
    <div className="flex items-center gap-2">
      {/* Botão de toggle rápido */}
      <button
        onClick={toggleTheme}
        className="card-theme rounded-lg border border-light-border p-2 text-text-light-primary transition-colors duration-300 hover:bg-primary/10 dark:border-dark-border dark:text-text-dark-primary"
        title={`Alternar tema (atual: ${theme})`}
      >
        {getIcon()}
      </button>

      {/* Seletor de tema completo */}
      <div className="card-theme flex items-center rounded-lg border border-light-border p-1 dark:border-dark-border">
        <button
          onClick={() => setTheme('light')}
          className={`rounded-md p-2 transition-colors duration-300 ${theme === 'light' ? 'bg-primary text-white' : 'text-text-light-secondary hover:bg-primary/10 dark:text-text-dark-secondary'} `}
          title="Modo claro"
        >
          <Sun className="h-4 w-4" />
        </button>

        <button
          onClick={() => setTheme('dark')}
          className={`rounded-md p-2 transition-colors duration-300 ${theme === 'dark' ? 'bg-primary text-white' : 'text-text-light-secondary hover:bg-primary/10 dark:text-text-dark-secondary'} `}
          title="Modo escuro"
        >
          <Moon className="h-4 w-4" />
        </button>

        <button
          onClick={() => setTheme('system')}
          className={`rounded-md p-2 transition-colors duration-300 ${theme === 'system' ? 'bg-primary text-white' : 'text-text-light-secondary hover:bg-primary/10 dark:text-text-dark-secondary'} `}
          title="Seguir sistema"
        >
          <Monitor className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Versão compacta (apenas toggle)
export function ThemeToggleCompact() {
  const { actualTheme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="card-theme rounded-lg border border-light-border p-2 text-text-light-primary shadow-sm transition-all duration-300 hover:border-primary/20 hover:bg-primary/10 hover:text-primary hover:shadow-md dark:border-dark-border dark:text-text-dark-primary"
      title={`Alternar para modo ${actualTheme === 'light' ? 'escuro' : 'claro'}`}
    >
      {actualTheme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </button>
  );
}
