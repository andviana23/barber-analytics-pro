import React from 'react';

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseClasses =
    'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg transition-colors duration-300';

  const variants = {
    default: '',
    elevated: 'shadow-sm hover:shadow-md',
    bordered: 'border-2',
    highlight: 'border-l-4 border-l-primary',
    success:
      'border-l-4 border-l-feedback-light-success dark:border-l-feedback-dark-success',
    error:
      'border-l-4 border-l-feedback-light-error dark:border-l-feedback-dark-error',
    warning:
      'border-l-4 border-l-feedback-light-warning dark:border-l-feedback-dark-warning',
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const classes = `${baseClasses} ${variants[variant]} ${paddings[padding]} ${className}`;

  // Filtrar apenas atributos válidos para div
  const validDivProps = {};
  const validDivAttributes = [
    'id', 'title', 'onClick', 'onMouseEnter', 'onMouseLeave', 'onFocus',
    'onBlur', 'onKeyDown', 'onKeyUp', 'aria-label', 'aria-describedby',
    'role', 'tabIndex'
  ];
  
  Object.keys(props).forEach(key => {
    if (validDivAttributes.includes(key)) {
      validDivProps[key] = props[key];
    }
  });

  return (
    <div className={classes} {...validDivProps}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => {
  // Filtrar props válidas
  const validProps = {};
  const validAttributes = [
    'id', 'title', 'onClick', 'onMouseEnter', 'onMouseLeave',
    'aria-label', 'aria-describedby', 'role'
  ];
  
  Object.keys(props).forEach(key => {
    if (validAttributes.includes(key)) {
      validProps[key] = props[key];
    }
  });

  return (
    <div
      className={`border-b border-light-border dark:border-dark-border pb-4 mb-4 ${className}`}
      {...validProps}
    >
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = '', ...props }) => {
  // Filtrar props válidas
  const validProps = {};
  const validAttributes = [
    'id', 'title', 'onClick', 'aria-label', 'aria-describedby', 'role'
  ];
  
  Object.keys(props).forEach(key => {
    if (validAttributes.includes(key)) {
      validProps[key] = props[key];
    }
  });

  return (
    <h3
      className={`text-text-light-primary dark:text-text-dark-primary text-lg font-semibold ${className}`}
      {...validProps}
    >
      {children}
    </h3>
  );
};

const CardContent = ({ children, className = '', ...props }) => {
  // Filtrar props válidas
  const validProps = {};
  const validAttributes = [
    'id', 'title', 'onClick', 'onMouseEnter', 'onMouseLeave',
    'aria-label', 'aria-describedby', 'role'
  ];
  
  Object.keys(props).forEach(key => {
    if (validAttributes.includes(key)) {
      validProps[key] = props[key];
    }
  });

  return (
    <div
      className={`text-text-light-primary dark:text-text-dark-primary ${className}`}
      {...validProps}
    >
      {children}
    </div>
  );
};

const CardFooter = ({ children, className = '', ...props }) => {
  // Filtrar props válidas
  const validProps = {};
  const validAttributes = [
    'id', 'title', 'onClick', 'onMouseEnter', 'onMouseLeave',
    'aria-label', 'aria-describedby', 'role'
  ];
  
  Object.keys(props).forEach(key => {
    if (validAttributes.includes(key)) {
      validProps[key] = props[key];
    }
  });

  return (
    <div
      className={`border-t border-light-border dark:border-dark-border pt-4 mt-4 ${className}`}
      {...validProps}
    >
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
