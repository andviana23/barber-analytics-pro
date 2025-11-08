/**
 * @file Modal.jsx
 * @description Componente Atom - Modal genérico reutilizável
 * @module Components/Atoms/Modal
 * @author Andrey Viana
 * @date 2025-10-26
 * @version 2.0 - Refatorado seguindo Design System
 *
 * 🎨 Design System Compliance:
 * - Utiliza tokens de cor do tailwind.config.js
 * - Classes utilitárias temáticas (.card-theme, .text-theme-*)
 * - Suporte a dark mode via 'class'
 * - Acessibilidade (ESC, foco, aria-labels)
 * - Responsivo (breakpoints padrão)
 */

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

/**
 * Modal - Componente de modal genérico
 *
 * ✨ Features:
 * - Backdrop com blur e overlay escuro
 * - Fecha com ESC ou clique fora
 * - Previne scroll do body
 * - Suporte a múltiplos tamanhos
 * - Header customizável com título e botão fechar
 * - Dark mode automático
 *
 * @component
 * @example
 * ```jsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Título do Modal"
 *   maxWidth="2xl"
 * >
 *   <div className="p-6">Conteúdo aqui</div>
 * </Modal>
 * ```
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  fullHeight = false,
  showCloseButton = true,
  className = '',
}) => {
  // ♿ Previne scroll do body quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ⌨️ ESC para fechar (acessibilidade)
  useEffect(() => {
    const handleEscape = e => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 📐 Breakpoints de largura seguindo Design System
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`card-theme rounded-lg shadow-2xl ${maxWidthClasses[maxWidth] || maxWidthClasses.md} w-full ${fullHeight ? 'h-full' : 'max-h-[90vh]'} flex flex-col overflow-hidden border border-light-border dark:border-dark-border ${className} `}
        onClick={e => e.stopPropagation()}
      >
        {/* 📋 Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between border-b border-light-border bg-light-surface/50 px-6 py-4 dark:border-dark-border dark:bg-dark-hover/50">
            {title && (
              <h2
                id="modal-title"
                className="text-theme-primary text-xl font-bold"
              >
                {title}
              </h2>
            )}
            {!title && <div />}
            {showCloseButton && onClose && (
              <button
                onClick={onClose}
                className="text-theme-secondary hover:text-theme-primary rounded-lg p-2 transition-colors hover:bg-light-surface focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:hover:bg-dark-hover dark:focus:ring-offset-dark-bg"
                aria-label="Fechar modal"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* 📄 Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  /** Se o modal está aberto */
  isOpen: PropTypes.bool.isRequired,
  /** Callback ao fechar */
  onClose: PropTypes.func,
  /** Título do modal */
  title: PropTypes.string,
  /** Conteúdo do modal */
  children: PropTypes.node.isRequired,
  /** Largura máxima do modal */
  maxWidth: PropTypes.oneOf([
    'sm',
    'md',
    'lg',
    'xl',
    '2xl',
    '3xl',
    '4xl',
    '5xl',
    '6xl',
    '7xl',
    'full',
  ]),
  /** Se o modal deve ocupar altura total */
  fullHeight: PropTypes.bool,
  /** Se deve mostrar botão de fechar */
  showCloseButton: PropTypes.bool,
  /** Classes CSS adicionais */
  className: PropTypes.string,
};

export default Modal;
