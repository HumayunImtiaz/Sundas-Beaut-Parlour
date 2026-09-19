export const CART_UPDATED_EVENT = 'sundas-cart-updated';

export type CartUpdatedDetail = { itemCount?: number; delta?: number };

export function notifyCartUpdated(detail: CartUpdatedDetail = {}) {
  window.dispatchEvent(new CustomEvent<CartUpdatedDetail>(CART_UPDATED_EVENT, { detail }));
}
