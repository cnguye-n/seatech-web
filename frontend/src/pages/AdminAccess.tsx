import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "../styles/pages/AdminAccess.css";

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
  { value: "public", label: "Viewer" },
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
  }, []);

  async function updateRole(email: string, newRole: Role) {
    setErr("");

    const prev = users;
    setUsers((list) =>
      list.map((u) => (u.email === email ? { ...u, role: newRole } : u))
    );

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/users/${encodeURIComponent(email)}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token.trim()}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Update failed (${res.status}) ${text}`);
      }
    } catch (e: any) {
      setUsers(prev);
      setErr(e?.message || "Update failed");
    }
  }

  return (
    <main className="section">
      <div className="container">
        <div className="admin-access-topbar">
          <div>
            <p className="heading1">Admin Access</p>
            <p className="bodytext admin-access-description">
              Manage user access and update roles for the SEAtech dashboard.
            </p>
            <p className="bodytext admin-access-signed-in">
              Signed in as <strong>{user?.email}</strong>
            </p>
          </div>

          <button className="btn admin-access-refresh-btn" onClick={loadUsers}>
            Refresh
          </button>
        </div>

        {err && (
          <div className="card admin-access-error">
            <p className="bodytext">{err}</p>
          </div>
        )}

        <div className="card admin-access-table">
          <div className="admin-access-table-header">
            <p className="heading3">User</p>
            <p className="heading3">Role</p>
          </div>

          {loading ? (
            <div className="admin-access-state">
              <p className="bodytext">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="admin-access-state">
              <p className="bodytext">No users found.</p>
            </div>
          ) : (
            users.map((u) => {
              const isSelf = u.email === user?.email;

              return (
                <div className="admin-access-row" key={u.email}>
                  <div className="admin-access-user">
                    {u.picture ? (
                      <img
                        src={u.picture}
                        alt={u.name || u.email}
                        className="admin-access-avatar"
                      />
                    ) : (
                      <div className="admin-access-avatar admin-access-avatar-placeholder">
                        {(u.name?.[0] || u.email?.[0] || "?").toUpperCase()}
                      </div>
                    )}

                    <div className="admin-access-user-info">
                      <p className="admin-access-user-name">
                        {u.name || "No name provided"}
                      </p>
                      <p className="bodytext admin-access-user-email">{u.email}</p>
                    </div>
                  </div>

                  <div className="admin-access-role">
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.email, e.target.value as Role)}
                      disabled={isSelf}
                      className="filters-field admin-access-select"
                      title={isSelf ? "You can't change your own role here" : ""}
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    {isSelf && (
                      <p className="bodytext admin-access-self-note">
                        You cannot change your own role.
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}