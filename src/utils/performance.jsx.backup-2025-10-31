import React, { lazy, Suspense, memo, useCallback, useMemo } from 'react';
import { LoadingSpinner } from '../components/LoadingComponents';

// HOC para lazy loading com loading state personalizado
export function withLazyLoading(
  Component,
  fallback = <LoadingSpinner fullScreen />
) {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));

  const WrappedComponent = memo(props => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  ));

  WrappedComponent.displayName = `LazyLoaded(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook para performance de listas grandes
export function useVirtualization(
  items,
  itemHeight = 50,
  containerHeight = 400
) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback(e => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    ...visibleItems,
    handleScroll,
  };
}

// Componente de lista virtualizada para performance
export function VirtualizedList({
  items,
  renderItem,
  itemHeight = 50,
  containerHeight = 400,
  className = '',
}) {
  const { startIndex, visibleItems, totalHeight, offsetY, handleScroll } =
    useVirtualization(items, itemHeight, containerHeight);

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      role="listbox"
      aria-label={`Lista com ${items.length} itens`}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
              role="option"
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hook para debounce (otimização de performance em inputs)
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook para throttle (otimização de performance em scroll/resize)
export function useThrottle(callback, delay = 100) {
  const callbackRef = React.useRef(callback);
  const throttleRef = React.useRef();

  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return React.useCallback(
    (...args) => {
      if (throttleRef.current) return;

      throttleRef.current = setTimeout(() => {
        callbackRef.current(...args);
        throttleRef.current = null;
      }, delay);
    },
    [delay]
  );
}

// Hook para intersection observer (lazy loading de imagens/componentes)
export function useIntersectionObserver(options = {}) {
  const [ref, setRef] = React.useState(null);
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, options]);

  return [setRef, isIntersecting];
}

// Componente para lazy loading de imagens
export function LazyImage({
  src,
  alt,
  placeholder = '/placeholder.jpg',
  className = '',
  ...props
}) {
  const [imgRef, isIntersecting] = useIntersectionObserver();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  return (
    <div ref={imgRef} className={`overflow-hidden ${className}`}>
      {isIntersecting && (
        <img
          src={error ? placeholder : src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`
            transition-opacity duration-300
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${className}
          `}
          loading="lazy"
          {...props}
        />
      )}
      {!isIntersecting && (
        <div
          className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
        />
      )}
    </div>
  );
}

// Função utilitária para medição de performance
export function measurePerformance(fn, label = 'Operation') {
  return (...args) => {
    const startTime = performance.now();
    const result = fn(...args);
    const endTime = performance.now();

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug(`${label} took ${endTime - startTime} milliseconds`);
    }

    return result;
  };
}

// Hook para monitoramento de performance
export function usePerformanceMonitor(componentName) {
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      const startTime = performance.now();

      return () => {
        const endTime = performance.now();
        // eslint-disable-next-line no-console
        console.debug(`${componentName} render time: ${endTime - startTime}ms`);
      };
    }
  });
}

// Wrapper para componentes com monitoramento de performance
export function withPerformanceMonitoring(Component, componentName) {
  const PerformanceWrappedComponent = memo(props => {
    usePerformanceMonitor(componentName);
    return <Component {...props} />;
  });

  PerformanceWrappedComponent.displayName = `WithPerformance(${Component.displayName || Component.name})`;

  return PerformanceWrappedComponent;
}

// Hook para cache de dados com TTL
export function useDataCache(key, fetcher, ttl = 5 * 60 * 1000) {
  // 5 minutos default
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const cacheRef = React.useRef(new Map());

  const fetchData = useCallback(async () => {
    const cached = cacheRef.current.get(key);

    // Verificar cache válido
    if (cached && Date.now() - cached.timestamp < ttl) {
      setData(cached.data);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await fetcher();

      // Armazenar no cache
      cacheRef.current.set(key, {
        data: result,
        timestamp: Date.now(),
      });

      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const invalidateCache = useCallback(() => {
    cacheRef.current.delete(key);
    fetchData();
  }, [key, fetchData]);

  return { data, loading, error, refetch: fetchData, invalidateCache };
}

// Componente para preload de recursos
export function ResourcePreloader({ resources = [] }) {
  React.useEffect(() => {
    resources.forEach(resource => {
      if (resource.type === 'image') {
        const img = new Image();
        img.src = resource.src;
      } else if (resource.type === 'font') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.href = resource.src;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });
  }, [resources]);

  return null;
}

// Performance metrics hook
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = React.useState({});

  React.useEffect(() => {
    if ('performance' in window) {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const newMetrics = {};

        entries.forEach(entry => {
          if (entry.entryType === 'measure') {
            newMetrics[entry.name] = entry.duration;
          }
        });

        setMetrics(prev => ({ ...prev, ...newMetrics }));
      });

      observer.observe({ entryTypes: ['measure', 'navigation'] });

      return () => observer.disconnect();
    }
  }, []);

  const startMeasure = useCallback(name => {
    performance.mark(`${name}-start`);
  }, []);

  const endMeasure = useCallback(name => {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }, []);

  return { metrics, startMeasure, endMeasure };
}

export default {
  withLazyLoading,
  useVirtualization,
  VirtualizedList,
  useDebounce,
  useThrottle,
  useIntersectionObserver,
  LazyImage,
  measurePerformance,
  usePerformanceMonitor,
  withPerformanceMonitoring,
  useDataCache,
  ResourcePreloader,
  usePerformanceMetrics,
};
