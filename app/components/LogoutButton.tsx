"use client";

export default function LogoutButtons() {
  async function logoutCustomer() {
    await fetch("/api/auth/customer", { method: "DELETE" });
    window.location.href = "/login";
  }

  async function logoutAdmin() {
    await fetch("/api/auth/admin", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={logoutCustomer} style={{ padding: "8px 10px" }}>
        Logout klant
      </button>
      <button onClick={logoutAdmin} style={{ padding: "8px 10px" }}>
        Logout admin
      </button>
    </div>
  );
}
