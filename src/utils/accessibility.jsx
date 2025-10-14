// Utilitários para acessibilidade e navegação por teclado

import { useEffect, useRef } from 'react';

// Hook para gerenciar foco em elementos
export function useFocusManagement() {
  const focusableElements = useRef([]);
  const currentFocusIndex = useRef(-1);

  const getFocusableElements = (container = document) => {
    return container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
  };

  const updateFocusableElements = (container) => {
    focusableElements.current = Array.from(getFocusableElements(container));
  };

  const focusNext = () => {
    if (focusableElements.current.length === 0) return;
    
    currentFocusIndex.current = (currentFocusIndex.current + 1) % focusableElements.current.length;
    focusableElements.current[currentFocusIndex.current]?.focus();
  };

  const focusPrevious = () => {
    if (focusableElements.current.length === 0) return;
    
    currentFocusIndex.current = currentFocusIndex.current <= 0 
      ? focusableElements.current.length - 1 
      : currentFocusIndex.current - 1;
    focusableElements.current[currentFocusIndex.current]?.focus();
  };

  const focusFirst = () => {
    if (focusableElements.current.length === 0) return;
    
    currentFocusIndex.current = 0;
    focusableElements.current[0]?.focus();
  };

  const focusLast = () => {
    if (focusableElements.current.length === 0) return;
    
    currentFocusIndex.current = focusableElements.current.length - 1;
    focusableElements.current[currentFocusIndex.current]?.focus();
  };

  const getFocusableElementsArray = () => focusableElements.current;

  return {
    updateFocusableElements,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    getFocusableElements: getFocusableElementsArray
  };
}

// Hook para navegação por teclado
export function useKeyboardNavigation(containerRef, options = {}) {
  const {
    enableArrowKeys = true,
    enableTabKey = true,
    enableEnterKey = true,
    enableEscapeKey = true,
    onEnter = null,
    onEscape = null,
    autoFocus = false
  } = options;

  const { updateFocusableElements, focusNext, focusPrevious, focusFirst } = useFocusManagement();

  useEffect(() => {
    if (!containerRef.current) return;

    updateFocusableElements(containerRef.current);

    if (autoFocus) {
      setTimeout(() => focusFirst(), 100);
    }

    const handleKeyDown = (event) => {
      if (!enableArrowKeys && !enableTabKey && !enableEnterKey && !enableEscapeKey) return;

      switch (event.key) {
        case 'ArrowDown':
          if (enableArrowKeys) {
            event.preventDefault();
            focusNext();
          }
          break;
        case 'ArrowUp':
          if (enableArrowKeys) {
            event.preventDefault();
            focusPrevious();
          }
          break;
        case 'Tab':
          if (enableTabKey) {
            // Deixar comportamento padrão do Tab, mas atualizar lista
            setTimeout(() => updateFocusableElements(containerRef.current), 0);
          }
          break;
        case 'Enter':
          if (enableEnterKey && onEnter) {
            onEnter(event);
          }
          break;
        case 'Escape':
          if (enableEscapeKey && onEscape) {
            onEscape(event);
          }
          break;
      }
    };

    const container = containerRef.current;
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, enableArrowKeys, enableTabKey, enableEnterKey, enableEscapeKey, onEnter, onEscape, autoFocus, updateFocusableElements, focusNext, focusPrevious, focusFirst]);

  return { updateFocusableElements };
}

// Hook para trap de foco (útil em modais)
export function useFocusTrap(containerRef, isActive = true) {
  const { updateFocusableElements } = useFocusManagement();
  const firstElementRef = useRef(null);
  const lastElementRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !isActive) return;

    const container = containerRef.current;
    updateFocusableElements(container);
    
    const focusableElements = Array.from(
      container.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );

    if (focusableElements.length === 0) return;

    firstElementRef.current = focusableElements[0];
    lastElementRef.current = focusableElements[focusableElements.length - 1];

    // Foco inicial no primeiro elemento
    firstElementRef.current?.focus();

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      // Se Shift+Tab no primeiro elemento, vai para o último
      if (e.shiftKey && document.activeElement === firstElementRef.current) {
        e.preventDefault();
        lastElementRef.current?.focus();
      }
      // Se Tab no último elemento, vai para o primeiro
      else if (!e.shiftKey && document.activeElement === lastElementRef.current) {
        e.preventDefault();
        firstElementRef.current?.focus();
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [containerRef, isActive, updateFocusableElements]);
}

// Hook para anúncios de screen reader
export function useScreenReader() {
  const announceToScreenReader = (message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove o elemento após 1 segundo
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const announcePageChange = (pageTitle) => {
    announceToScreenReader(`Navegou para ${pageTitle}`, 'assertive');
  };

  const announceAction = (action) => {
    announceToScreenReader(action, 'polite');
  };

  const announceError = (error) => {
    announceToScreenReader(`Erro: ${error}`, 'assertive');
  };

  const announceSuccess = (message) => {
    announceToScreenReader(`Sucesso: ${message}`, 'polite');
  };

  return {
    announceToScreenReader,
    announcePageChange,
    announceAction,
    announceError,
    announceSuccess
  };
}

// Componente wrapper para melhorar acessibilidade
export function AccessibleContainer({ 
  children, 
  role = 'main',
  ariaLabel,
  ariaLabelledBy,
  className = '',
  enableKeyboardNav = false,
  keyboardNavOptions = {},
  ...props 
}) {
  const containerRef = useRef(null);

  // Sempre chama o hook, mas passa um parâmetro para desabilitar se necessário
  useKeyboardNavigation(
    containerRef, 
    enableKeyboardNav ? keyboardNavOptions : { 
      enableArrowKeys: false, 
      enableTabKey: false, 
      enableEnterKey: false, 
      enableEscapeKey: false 
    }
  );

  return (
    <div
      ref={containerRef}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={`focus-within:outline-none ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// Hook para skip links
export function useSkipLinks() {
  const addSkipLink = (targetId, linkText = 'Pular para o conteúdo principal') => {
    // Verifica se o skip link já existe
    if (document.getElementById('skip-link')) return;

    const skipLink = document.createElement('a');
    skipLink.id = 'skip-link';
    skipLink.href = `#${targetId}`;
    skipLink.textContent = linkText;
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-primary focus:text-white focus:underline';
    
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView();
      }
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  };

  const removeSkipLink = () => {
    const skipLink = document.getElementById('skip-link');
    if (skipLink) {
      skipLink.remove();
    }
  };

  return { addSkipLink, removeSkipLink };
}

// Utilitários para validação de contraste
export const contrastUtils = {
  // Calcula o contraste entre duas cores
  calculateContrast: (color1, color2) => {
    const getLuminance = (rgb) => {
      const [r, g, b] = rgb.map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ] : null;
    };

    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;

    const lum1 = getLuminance(rgb1);
    const lum2 = getLuminance(rgb2);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Verifica se o contraste atende aos padrões WCAG
  meetsWCAGStandard: (contrast, level = 'AA') => {
    const standards = {
      'AA': 4.5,
      'AAA': 7
    };
    return contrast >= standards[level];
  },

  // Sugere cores com melhor contraste
  suggestBetterContrast: (baseColor, level = 'AA') => {
    const targetContrast = level === 'AAA' ? 7 : 4.5;
    // Implementação simplificada - em produção, seria mais complexa
    return {
      lighterOption: '#FFFFFF',
      darkerOption: '#000000',
      targetContrast
    };
  }
};

// Classes CSS de utilitário para acessibilidade (para adicionar ao Tailwind)
export const a11yClasses = `
  /* Screen reader only - visível apenas para leitores de tela */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Torna visível quando focado */
  .focus\\:not-sr-only:focus {
    position: static;
    width: auto;
    height: auto;
    padding: inherit;
    margin: inherit;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }

  /* Indicador de foco visível */
  .focus-visible {
    outline: 2px solid theme('colors.primary.DEFAULT');
    outline-offset: 2px;
  }

  /* Remove outline padrão mas mantém para teclado */
  .focus-visible-only:focus:not(:focus-visible) {
    outline: none;
  }

  /* Modo de alto contraste */
  @media (prefers-contrast: high) {
    .high-contrast\\:border-2 {
      border-width: 2px;
    }
    
    .high-contrast\\:bg-black {
      background-color: black;
    }
    
    .high-contrast\\:text-white {
      color: white;
    }
  }

  /* Redução de movimento */
  @media (prefers-reduced-motion: reduce) {
    .motion-reduce\\:transition-none {
      transition: none;
    }
    
    .motion-reduce\\:animate-none {
      animation: none;
    }
  }
`;

export default {
  useFocusManagement,
  useKeyboardNavigation,
  useFocusTrap,
  useScreenReader,
  AccessibleContainer,
  useSkipLinks,
  contrastUtils,
  a11yClasses
};