import React, { createContext, useContext, useEffect, useState } from 'react';

// Contexto do tema
const ThemeContext = createContext(undefined);

// Provider do tema
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('barber-analytics-theme');
    return savedTheme || 'system';
  });

  const getSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  };

  // Calcula o tema atual baseado na configuração
  const actualTheme = theme === 'system' ? getSystemTheme() : theme;

  const applyTheme = themeToApply => {
    const root = document.documentElement;

    if (themeToApply === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const handleSetTheme = newTheme => {
    setTheme(newTheme);
    localStorage.setItem('barber-analytics-theme', newTheme);

    if (newTheme === 'system') {
      applyTheme(getSystemTheme());
    } else {
      applyTheme(newTheme);
    }
  };

  const toggleTheme = () => {
    if (theme === 'system') {
      const systemTheme = getSystemTheme();
      handleSetTheme(systemTheme === 'light' ? 'dark' : 'light');
    } else {
      handleSetTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  // Effect para aplicar o tema ao DOM
  useEffect(() => {
    applyTheme(actualTheme);
  }, [actualTheme]);

  // Effect para escutar mudanças do sistema quando tema é 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = () => {
      // Force re-render quando preferência do sistema muda
      setTheme('system');
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]);

  const value = {
    theme,
    actualTheme,
    setTheme: handleSetTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }

  return context;
}
