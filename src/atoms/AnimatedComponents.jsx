import React from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FadeIn - Componente de animação de fade in
 *
 * @component
 * @example
 * <FadeIn>
 *   <div>Conteúdo com fade in</div>
 * </FadeIn>
 */
export const FadeIn = ({ children, delay = 0, duration = 0.3 }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  );
};

FadeIn.propTypes = {
  children: PropTypes.node.isRequired,
  delay: PropTypes.number,
  duration: PropTypes.number,
};

/**
 * SlideIn - Componente de animação de slide
 *
 * @component
 * @example
 * <SlideIn direction="left">
 *   <div>Conteúdo com slide</div>
 * </SlideIn>
 */
export const SlideIn = ({
  children,
  direction = 'left', // 'left', 'right', 'top', 'bottom'
  delay = 0,
  duration = 0.3,
}) => {
  const directions = {
    left: { x: -20, y: 0 },
    right: { x: 20, y: 0 },
    top: { x: 0, y: -20 },
    bottom: { x: 0, y: 20 },
  };

  const initial = directions[direction];

  return (
    <motion.div
      initial={{ opacity: 0, ...initial }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...initial }}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  );
};

SlideIn.propTypes = {
  children: PropTypes.node.isRequired,
  direction: PropTypes.oneOf(['left', 'right', 'top', 'bottom']),
  delay: PropTypes.number,
  duration: PropTypes.number,
};

/**
 * ScaleIn - Componente de animação de escala
 *
 * @component
 * @example
 * <ScaleIn>
 *   <div>Conteúdo com escala</div>
 * </ScaleIn>
 */
export const ScaleIn = ({ children, delay = 0, duration = 0.3 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  );
};

ScaleIn.propTypes = {
  children: PropTypes.node.isRequired,
  delay: PropTypes.number,
  duration: PropTypes.number,
};

/**
 * StaggerChildren - Componente para animar lista de itens em sequência
 *
 * @component
 * @example
 * <StaggerChildren>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </StaggerChildren>
 */
export const StaggerChildren = ({
  children,
  stagger = 0.1,
  duration = 0.3,
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: stagger,
          },
        },
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

StaggerChildren.propTypes = {
  children: PropTypes.node.isRequired,
  stagger: PropTypes.number,
  duration: PropTypes.number,
};

/**
 * AnimatedList - Componente para animar adição/remoção de itens em lista
 *
 * @component
 * @example
 * <AnimatedList>
 *   {items.map(item => (
 *     <div key={item.id}>{item.name}</div>
 *   ))}
 * </AnimatedList>
 */
export const AnimatedList = ({ children }) => {
  return (
    <AnimatePresence mode="popLayout">
      {React.Children.map(children, child => (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          {child}
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

AnimatedList.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * PulseAnimation - Componente de animação de pulso (para chamar atenção)
 *
 * @component
 * @example
 * <PulseAnimation>
 *   <div>Conteúdo que pulsa</div>
 * </PulseAnimation>
 */
export const PulseAnimation = ({ children, scale = 1.05 }) => {
  return (
    <motion.div
      animate={{
        scale: [1, scale, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
};

PulseAnimation.propTypes = {
  children: PropTypes.node.isRequired,
  scale: PropTypes.number,
};

/**
 * ShakeAnimation - Componente de animação de shake (para erros)
 *
 * @component
 * @example
 * <ShakeAnimation trigger={hasError}>
 *   <input />
 * </ShakeAnimation>
 */
export const ShakeAnimation = ({ children, trigger }) => {
  return (
    <motion.div
      animate={
        trigger
          ? {
              x: [0, -10, 10, -10, 10, 0],
            }
          : {}
      }
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
};

ShakeAnimation.propTypes = {
  children: PropTypes.node.isRequired,
  trigger: PropTypes.bool,
};

/**
 * CollapsibleContent - Componente de conteúdo colapsável animado
 *
 * @component
 * @example
 * <CollapsibleContent isOpen={isOpen}>
 *   <div>Conteúdo colapsável</div>
 * </CollapsibleContent>
 */
export const CollapsibleContent = ({ children, isOpen }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

CollapsibleContent.propTypes = {
  children: PropTypes.node.isRequired,
  isOpen: PropTypes.bool.isRequired,
};

export default {
  FadeIn,
  SlideIn,
  ScaleIn,
  StaggerChildren,
  AnimatedList,
  PulseAnimation,
  ShakeAnimation,
  CollapsibleContent,
};
