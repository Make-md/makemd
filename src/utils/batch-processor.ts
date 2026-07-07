/**
 * Batch processing utilities for performance optimization
 */

/**
 * Process items in batches with concurrency limit
 * @param items - Array of items to process
 * @param processor - Async function to process each item
 * @param batchSize - Maximum number of concurrent operations (default: 4)
 * @returns Array of results in the same order as input items
 */
export async function processInBatches<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  batchSize: number = 4
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, Math.min(i + batchSize, items.length));
    const batchPromises = batch.map((item, idx) => 
      processor(item, i + idx).then(result => {
        results[i + idx] = result;
        return result;
      })
    );
    await Promise.all(batchPromises);
  }
  
  return results;
}

/**
 * Process items with concurrency limit using a worker pool approach
 * @param items - Array of items to process
 * @param processor - Async function to process each item
 * @param concurrency - Maximum number of concurrent operations (default: 4)
 * @returns Array of results in the same order as input items
 */
export async function processWithConcurrencyLimit<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  concurrency: number = 4
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;
  
  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      const item = items[index];
      results[index] = await processor(item, index);
    }
  }
  
  // Create worker promises
  const workerCount = Math.min(concurrency, items.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  
  await Promise.all(workers);
  return results;
}

/**
 * Run async operations with timeout and fallback
 * @param promise - The promise to execute with timeout
 * @param timeoutMs - Timeout in milliseconds
 * @param fallback - Fallback value if timeout occurs
 * @returns Result or fallback value
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs))
  ]);
}

/**
 * Debounce async function calls
 * @param fn - Async function to debounce
 * @param delayMs - Delay in milliseconds
 * @returns Debounced function
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => ReturnType<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCall: Promise<ReturnType<T>> | null = null;
  
  return function(...args: Parameters<T>): ReturnType<T> {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const callPromise = new Promise<ReturnType<T>>((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delayMs);
    });
    
    lastCall = callPromise as Promise<ReturnType<T>>;
    return callPromise as ReturnType<T>;
  };
}
