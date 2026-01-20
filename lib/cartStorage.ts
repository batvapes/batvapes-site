export type CartLine = { productId: string; quantity: number };

const KEY = "batvapes_cart_v1";

function isBrowser() {
  return typeof window !== "undefined";
}

export function readCart(): CartLine[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => ({
        productId: typeof x?.productId === "string" ? x.productId : "",
        quantity: Number(x?.quantity),
      }))
      .filter((x) => x.productId && Number.isFinite(x.quantity) && x.quantity > 0);
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(KEY, JSON.stringify(lines));
}

export function clearCart() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(KEY);
}

export function addToCart(productId: string, qty: number) {
  const q = Math.floor(qty);
  if (!productId || !Number.isFinite(q) || q <= 0) return;

  const cart = readCart();
  const idx = cart.findIndex((c) => c.productId === productId);
  if (idx === -1) cart.push({ productId, quantity: q });
  else cart[idx] = { productId, quantity: cart[idx].quantity + q };
  writeCart(cart);
}

export function setQty(productId: string, qty: number) {
  const q = Math.floor(qty);
  const cart = readCart();

  if (q <= 0) {
    writeCart(cart.filter((c) => c.productId !== productId));
    return;
  }

  const idx = cart.findIndex((c) => c.productId === productId);
  if (idx === -1) cart.push({ productId, quantity: q });
  else cart[idx] = { productId, quantity: q };
  writeCart(cart);
}
