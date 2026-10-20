type QueueHandlers<TCart> = {
  onSuccess: (cart: TCart) => void;
  onError: (error: Error) => void;
};

type QueueWaiter<TCart> = {
  resolve: (cart: TCart) => void;
  reject: (error: Error) => void;
};

type PendingQuantity = {
  quantity: number;
  version: number;
  ready: boolean;
  timer: ReturnType<typeof setTimeout> | null;
  handlers: QueueHandlers<unknown>;
  waiters: QueueWaiter<unknown>[];
};

const DEBOUNCE_MS = 500;
const RETRY_DELAY_MS = 1500;
const MAX_RETRIES = 2;
const pendingQuantities = new Map<string, PendingQuantity>();
let requestInFlight = false;

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

async function sendNextQuantity() {
  if (requestInFlight) return;
  const nextEntry = [...pendingQuantities.entries()].find(([, entry]) => entry.ready);
  if (!nextEntry) return;

  const [lineItemId, entry] = nextEntry;
  requestInFlight = true;
  entry.ready = false;
  let attemptedVersion = entry.version;

  try {
    let retries = 0;
    while (true) {
      attemptedVersion = entry.version;
      const quantity = entry.quantity;
      const response = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_item_id: lineItemId, quantity }),
      });

      if (response.status === 500 && retries < MAX_RETRIES) {
        retries += 1;
        await delay(RETRY_DELAY_MS);
        continue;
      }
      if (!response.ok) throw new Error('Unable to update cart quantity.');

      const result = (await response.json()) as { cart?: unknown };
      if (!result.cart) throw new Error('Cart update returned no cart.');

      if (entry.version === attemptedVersion) {
        try {
          entry.handlers.onSuccess(result.cart);
        } finally {
          for (const waiter of entry.waiters) waiter.resolve(result.cart);
          pendingQuantities.delete(lineItemId);
        }
      }
      break;
    }
  } catch (requestError) {
    if (entry.version === attemptedVersion) {
      const error = requestError instanceof Error
        ? requestError
        : new Error('Unable to update cart quantity.');
      try {
        entry.handlers.onError(error);
      } finally {
        for (const waiter of entry.waiters) waiter.reject(error);
        pendingQuantities.delete(lineItemId);
      }
    }
  } finally {
    requestInFlight = false;
    void sendNextQuantity();
  }
}

export function queueCartQuantityUpdate<TCart>(
  lineItemId: string,
  quantity: number,
  handlers: QueueHandlers<TCart>,
): Promise<TCart> {
  return new Promise<TCart>((resolve, reject) => {
    let entry = pendingQuantities.get(lineItemId);
    if (!entry) {
      entry = {
        quantity,
        version: 0,
        ready: false,
        timer: null,
        handlers: handlers as QueueHandlers<unknown>,
        waiters: [],
      };
      pendingQuantities.set(lineItemId, entry);
    }

    entry.quantity = quantity;
    entry.version += 1;
    entry.ready = false;
    entry.handlers = handlers as QueueHandlers<unknown>;
    entry.waiters.push({
      resolve: resolve as (cart: unknown) => void,
      reject,
    });

    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = setTimeout(() => {
      entry!.timer = null;
      entry!.ready = true;
      void sendNextQuantity();
    }, DEBOUNCE_MS);
  });
}