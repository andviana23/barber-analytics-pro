/**
 * 📝 Logger Wrapper (CommonJS → ESM)
 * Barber Analytics Pro - v2.0.0
 *
 * @description Wrapper para importar logger.ts como .js no Node.js
 * @author Andrey Viana
 * @created 2025-11-13
 */

// Importar o logger TypeScript usando tsx/ts-node OU versão simplificada
let logger;

try {
  // Tentar importar versão TypeScript (se tsx estiver disponível)
  const loggerModule = await import('./logger.ts');
  logger = loggerModule.logger;
} catch (err) {
  // Fallback: Logger simplificado para Node.js
  logger = {
    info(message, meta = {}) {
      const timestamp = new Date().toISOString();
      console.log(
        JSON.stringify({
          timestamp,
          level: 'INFO',
          message,
          ...meta,
        })
      );
    },

    error(message, meta = {}) {
      const timestamp = new Date().toISOString();
      console.error(
        JSON.stringify({
          timestamp,
          level: 'ERROR',
          message,
          ...meta,
        })
      );
    },

    warn(message, meta = {}) {
      const timestamp = new Date().toISOString();
      console.warn(
        JSON.stringify({
          timestamp,
          level: 'WARN',
          message,
          ...meta,
        })
      );
    },

    debug(message, meta = {}) {
      const timestamp = new Date().toISOString();
      console.log(
        JSON.stringify({
          timestamp,
          level: 'DEBUG',
          message,
          ...meta,
        })
      );
    },
  };
}

export { logger };
