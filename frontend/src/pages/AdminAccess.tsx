import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";

type Role = "admin" | "member" | "public";

type UserRow = {
  email: string;
  name?: string | null;
  picture?: string | null;
  role: Role;
  last_login?: string | null;
  created_at?: string | null;
};

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "public", label: "Viewer" },       // UI label
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
];

const GOOGLE_TOKEN_KEY = "google_credential";
const API_BASE = (import.meta.env.VITE_API_URL as string) ?? "";

export default function AdminAccess() {
  const { user } = useAuth();
  const token = useMemo(() => localStorage.getItem(GOOGLE_TOKEN_KEY) || "", []);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function loadUsers() {
    setLoading(true);
    setErr("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to load users (${res.status}) ${text}`);
      }

      const data = (await res.json()) as UserRow[];
      setUsers(data);
    } catch (e: any) {
      setErr(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateRole(email: string, newRole: Role) {
    setErr("");

    // optimistic update
    const prev = users;
    setUsers((list) => list.map((u) => (u.email === email ? { ...u, role: newRole } : u)));

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(email)}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Update failed (${res.status}) ${text}`);
      }
    } catch (e: any) {
      setUsers(prev); // rollback
      setErr(e?.message || "Update failed");
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Admin: User Access</h2>
          <div style={{ opacity: 0.8, marginTop: 6 }}>
            Signed in as <b>{user?.email}</b>
          </div>
        </div>

        <button
          onClick={loadUsers}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "white",
            cursor: "pointer",
            height: 40,
          }}
        >
          Refresh
        </button>
      </div>

      {err && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid #f2c9c9", background: "#fff5f5" }}>
          {err}
        </div>
      )}

      <div style={{ marginTop: 16, border: "1px solid #e6e6e6", borderRadius: 14, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 12,
            padding: "12px 14px",
            background: "#fafafa",
            borderBottom: "1px solid #eee",
            fontWeight: 600,
          }}
        >
          <div>User</div>
          <div>Role</div>
        </div>

        {loading ? (
          <div style={{ padding: 14 }}>Loading…</div>
        ) : users.length === 0 ? (
          <div style={{ padding: 14 }}>No users found.</div>
        ) : (
          users.map((u) => (
            <div
              key={u.email}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: 12,
                padding: "12px 14px",
                borderBottom: "1px solid #f1f1f1",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {u.picture ? (
                  <img
                    src={u.picture}
                    alt=""
                    style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid #ddd" }} />
                )}

                <div>
                  <div style={{ fontWeight: 600 }}>{u.name || "(no name)"}</div>
                  <div style={{ fontSize: 13, opacity: 0.75 }}>{u.email}</div>
                </div>
              </div>

              <select
                value={u.role}
                onChange={(e) => updateRole(u.email, e.target.value as Role)}
                disabled={u.email === user?.email} // optional: prevent changing yourself
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "white",
                }}
                title={u.email === user?.email ? "You can't change your own role here" : ""}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))
        )}
      </div>
    </div>
  );
}