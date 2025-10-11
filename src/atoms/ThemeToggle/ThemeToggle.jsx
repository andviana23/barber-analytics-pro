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
        className="
          p-2 rounded-lg transition-colors duration-300
          bg-light-surface dark:bg-dark-surface
          border border-light-border dark:border-dark-border
          hover:bg-primary/10
          text-text-light-primary dark:text-text-dark-primary
        "
        title={`Alternar tema (atual: ${theme})`}
      >
        {getIcon()}
      </button>

      {/* Seletor de tema completo */}
      <div className="flex items-center rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-1">
        <button
          onClick={() => setTheme('light')}
          className={`
            p-2 rounded-md transition-colors duration-300
            ${
              theme === 'light'
                ? 'bg-primary text-white'
                : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-primary/10'
            }
          `}
          title="Modo claro"
        >
          <Sun className="h-4 w-4" />
        </button>

        <button
          onClick={() => setTheme('dark')}
          className={`
            p-2 rounded-md transition-colors duration-300
            ${
              theme === 'dark'
                ? 'bg-primary text-white'
                : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-primary/10'
            }
          `}
          title="Modo escuro"
        >
          <Moon className="h-4 w-4" />
        </button>

        <button
          onClick={() => setTheme('system')}
          className={`
            p-2 rounded-md transition-colors duration-300
            ${
              theme === 'system'
                ? 'bg-primary text-white'
                : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-primary/10'
            }
          `}
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
      className="
        p-2 rounded-lg transition-all duration-300
        bg-light-surface dark:bg-dark-surface
        border border-light-border dark:border-dark-border
        hover:bg-primary/10 hover:border-primary/20
        text-text-light-primary dark:text-text-dark-primary
        hover:text-primary
        shadow-sm hover:shadow-md
      "
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
