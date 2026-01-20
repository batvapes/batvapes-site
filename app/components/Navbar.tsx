"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MeAdmin = { id: string; username: string } | null;
type MeCustomer = { id: string; snapchat: string } | null;

export default function Navbar() {
  const [admin, setAdmin] = useState<MeAdmin>(null);
  const [customer, setCustomer] = useState<MeCustomer>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  async function loadMe() {
    setLoading(true);
    try {
      const [aRes, cRes] = await Promise.all([
        fetch("/api/auth/admin/me", { cache: "no-store" }),
        fetch("/api/auth/customer/me", { cache: "no-store" }),
      ]);

      const a = await aRes.json().catch(() => ({}));
      const c = await cRes.json().catch(() => ({}));

      setAdmin(a?.admin ?? null);
      setCustomer(c?.customer ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  const role: "admin" | "customer" | "none" = admin ? "admin" : customer ? "customer" : "none";

  const brandHref = role === "admin" ? "/dashboard/customers" : "/shop";

  const menuItems = useMemo(() => {
    if (role === "admin") {
      return [
        { href: "/dashboard/customers", label: "Dashboard" },
        { href: "/dashboard/orders", label: "Bestellingen" },
        { href: "/dashboard/stock", label: "Stock" },
      ];
    }
    if (role === "customer") {
      return [
        { href: "/shop", label: "Shop" },
        { href: "/my-orders", label: "Mijn bestellingen" },
      ];
    }
    return [{ href: "/login", label: "Login" }];
  }, [role]);

  async function logout() {
    if (role === "admin") await fetch("/api/auth/admin", { method: "DELETE" });
    if (role === "customer") await fetch("/api/auth/customer", { method: "DELETE" });
    window.location.href = "/login";
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <>
      {/* TOP BAR */}
      <div className="sticky top-0 z-50 border-b bg-black text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
          {/* LEFT: hamburger */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-10 w-10 rounded-lg border border-[#FFD700] flex items-center justify-center bg-black"
            aria-label="Open menu"
          >
            <div className="flex flex-col gap-1">
              <span className="h-[2px] w-5 bg-[#FFD700]" />
              <span className="h-[2px] w-5 bg-[#FFD700]" />
              <span className="h-[2px] w-5 bg-[#FFD700]" />
            </div>
          </button>

          {/* CENTER: brand (white) */}
          <div className="flex-1 text-center">
            <Link href={brandHref} className="text-lg font-black tracking-wide text-white">
              BatVapes
            </Link>
          </div>

          {/* RIGHT */}
          <div className="flex items-center justify-end">
            {role === "customer" ? (
              <Link
                href="/cart"
                className="h-10 px-3 rounded-lg border border-[#FFD700] bg-black text-[#FFD700] flex items-center gap-2 font-bold"
                aria-label="Winkelmand"
              >
                <span className="text-lg">🛒</span>
                <span className="hidden sm:inline">Winkelmand</span>
              </Link>
            ) : (
              <div className="h-10 w-10" />
            )}
          </div>
        </div>
      </div>

      {/* DRAWER */}
      {open && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/50" onClick={closeMenu} aria-hidden="true" />

          <div className="absolute left-0 top-0 h-full w-[85%] max-w-xs bg-black text-white shadow-xl relative flex flex-col border-r border-[#FFD700]">
            <div className="flex items-center justify-between border-b border-[#FFD700] p-4">
              <div className="font-black text-lg text-white">BatVapes</div>
              <button
                type="button"
                onClick={closeMenu}
                className="h-10 w-10 rounded-lg border border-[#FFD700] flex items-center justify-center bg-black text-[#FFD700]"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div className="border-b border-[#FFD700] p-4 text-sm">
              {loading ? (
                <div className="opacity-70">Laden…</div>
              ) : role === "admin" ? (
                <div>
                  Admin: <b className="text-[#FFD700]">{admin?.username}</b>
                </div>
              ) : role === "customer" ? (
                <div>
                  Klant: <b className="text-[#FFD700]">{customer?.snapchat}</b>
                </div>
              ) : (
                <div className="opacity-70">Niet ingelogd</div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {menuItems.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={closeMenu}
                  className="block rounded-xl px-4 py-3 text-base font-semibold hover:bg-[#0f0f0f] border border-transparent hover:border-[#FFD700]"
                >
                  {it.label}
                </Link>
              ))}

              <div className="h-24" />
            </div>

            <div className="border-t border-[#FFD700] p-4 bg-black">
              {role === "none" ? (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="block w-full rounded-xl border border-[#FFD700] bg-black py-3 text-center font-bold text-[#FFD700]"
                >
                  Login
                </Link>
              ) : (
                <button
                  onClick={logout}
                  className="w-full rounded-xl border border-[#FFD700] bg-black py-3 text-center font-bold text-[#FFD700]"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
