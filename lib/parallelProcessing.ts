/**
 * @fileoverview Parallel Processing Utilities
 * @module lib/parallelProcessing
 * @description Processamento paralelo em batches para evitar timeouts
 */

/**
 * Processa itens em batches paralelos
 * @param items Array de itens a processar
 * @param processor Função que processa cada item
 * @param batchSize Tamanho do batch (padrão: 5)
 * @returns Array de resultados na mesma ordem dos itens
 */
export async function processInBatches<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  batchSize: number = 5
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((item, batchIndex) => processor(item, i + batchIndex))
    );

    // Processar resultados (sucesso ou falha)
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // Em caso de falha, adicionar erro como resultado
        results.push(result.reason as R);
      }
    }
  }

  return results;
}

/**
 * Processa itens em batches com retry individual
 */
export async function processInBatchesWithRetry<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  batchSize: number = 5,
  maxRetries: number = 2
): Promise<Array<{ success: boolean; result?: R; error?: Error; item: T }>> {
  const results: Array<{ success: boolean; result?: R; error?: Error; item: T }> = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map(async (item, batchIndex) => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await processor(item, i + batchIndex);
          return { success: true, result, item };
        } catch (error: any) {
          lastError = error;
          if (attempt < maxRetries) {
            // Aguardar antes de retry
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }
      }

      return { success: false, error: lastError || new Error('Unknown error'), item };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Processa itens com limite de concorrência
 */
export async function processWithConcurrencyLimit<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = processor(item).then(result => {
      results.push(result);
      executing.splice(executing.indexOf(promise), 1);
    });

    executing.push(promise as Promise<void>);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

