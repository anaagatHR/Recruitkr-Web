import { ApiError } from './ApiError.js';

/**
 * Bounded in-process task queue / stack with a concurrency cap.
 *
 * Why: on a small instance (Render free = 512MB / 0.5 CPU) the way the server
 * dies is N heavy jobs (PDF render, video upload, AI parse, SMTP send) landing
 * at once. This primitive serializes them:
 *
 *   - at most `concurrency` tasks run at the same time
 *   - up to `maxQueue` tasks wait in line
 *   - beyond that, callers get an immediate 503 ("try again") instead of
 *     piling up in RAM until the OOM-killer takes everyone down
 *
 * Ordering:
 *   - 'fifo' (queue) — fair, first-come-first-served. Default; right for
 *     user-facing work where fairness matters.
 *   - 'lifo' (stack) — newest-first. Right for latency-sensitive work under
 *     overload where the newest request is the one a user is still waiting on
 *     (older ones have likely timed out client-side anyway).
 *
 * No external broker (Redis etc.) — free tier is a single process, so an
 * in-process gate is exactly as strong as a distributed one here, with zero
 * extra RAM footprint.
 */
export class TaskQueue {
  constructor({
    name = 'queue',
    concurrency = 1,
    maxQueue = 25,
    order = 'fifo',
    busyMessage = 'Server is busy right now. Please try again in a moment.',
  } = {}) {
    this.name = name;
    this.concurrency = Math.max(1, Number(concurrency) || 1);
    this.maxQueue = Math.max(0, Number(maxQueue) || 0);
    this.order = order === 'lifo' ? 'lifo' : 'fifo';
    this.busyMessage = busyMessage;
    this.active = 0;
    this.waiters = [];
    // Lifetime counters — cheap visibility into pressure via /health.
    this.completed = 0;
    this.rejected = 0;
  }

  stats() {
    return {
      name: this.name,
      order: this.order,
      active: this.active,
      waiting: this.waiters.length,
      concurrency: this.concurrency,
      maxQueue: this.maxQueue,
      completed: this.completed,
      rejected: this.rejected,
    };
  }

  /**
   * Run `task` (an async function) under this queue's concurrency cap.
   * Resolves/rejects with the task's own result. Rejects with a 503 ApiError
   * without ever invoking the task when the wait line is full.
   */
  async run(task) {
    await this.#acquire();
    try {
      const result = await task();
      this.completed += 1;
      return result;
    } finally {
      this.#release();
    }
  }

  #acquire() {
    if (this.active < this.concurrency) {
      this.active += 1;
      return Promise.resolve();
    }
    if (this.waiters.length >= this.maxQueue) {
      this.rejected += 1;
      return Promise.reject(new ApiError(503, this.busyMessage));
    }
    return new Promise((resolve) => {
      this.waiters.push(resolve);
    });
  }

  #release() {
    // LIFO pops the newest waiter (stack); FIFO shifts the oldest (queue).
    const next = this.order === 'lifo' ? this.waiters.pop() : this.waiters.shift();
    if (next) {
      next(); // slot handed over directly; `active` count unchanged
    } else {
      this.active = Math.max(0, this.active - 1);
    }
  }
}

// ---------------------------------------------------------------------------
// Registry: every queue created through createQueue() is visible in one place
// so /health can report live pressure across the whole app.
// ---------------------------------------------------------------------------
const registry = new Map();

export const createQueue = (options) => {
  const queue = new TaskQueue(options);
  registry.set(queue.name, queue);
  return queue;
};

export const allQueueStats = () => Array.from(registry.values()).map((queue) => queue.stats());
