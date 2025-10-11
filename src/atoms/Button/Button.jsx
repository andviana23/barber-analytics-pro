import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) => {
  const baseClasses =
    'font-medium rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white',
    secondary:
      'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-text-light-primary dark:text-text-dark-primary hover:bg-primary/10 hover:border-primary/20',
    success:
      'bg-feedback-light-success dark:bg-feedback-dark-success hover:opacity-90 text-white',
    error:
      'bg-feedback-light-error dark:bg-feedback-dark-error hover:opacity-90 text-white',
    warning:
      'bg-feedback-light-warning dark:bg-feedback-dark-warning hover:opacity-90 text-white',
    ghost:
      'text-text-light-primary dark:text-text-dark-primary hover:bg-primary/10',
    outline:
      'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

export { Button };
