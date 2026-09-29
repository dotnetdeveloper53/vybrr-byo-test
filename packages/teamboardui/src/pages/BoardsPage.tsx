// Boards — list, create and delete.
import { useAuth } from "@vybrr/auth-framework-react";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router-dom";

interface BoardRow {
  id: string;
  team_id: string;
  name: string;
  created_at: string;
}

export function BoardsPage() {
  const { user, loading, authFetch } = useAuth();
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [team_idInput, setTeamIdInput] = useState("");
  const [nameInput, setNameInput] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await authFetch("/boards");
      if (!response.ok) throw new Error("Unable to load Boards.");
      setRows((await response.json()) as BoardRow[]);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load Boards.");
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  async function add(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await authFetch("/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: team_idInput, name: nameInput }),
      });
      if (!response.ok) throw new Error("Unable to save.");
      setTeamIdInput("");
      setNameInput("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string): Promise<void> {
    await authFetch(`/boards/${id}`, { method: "DELETE" });
    await load();
  }

  if (loading) return <div className="page"><p>Loading…</p></div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Team Board — BYO test</h1>
      </header>
      {error !== null && <p role="alert">{error}</p>}
      <section className="card">
        <form className="stack" onSubmit={(event) => { void add(event); }}>
          <label>
            Team id
            <input type="text" value={team_idInput} onChange={(event) => { setTeamIdInput(event.target.value); }} required />
          </label>
          <label>
            Name
            <input type="text" value={nameInput} onChange={(event) => { setNameInput(event.target.value); }} required />
          </label>
          <button type="submit" disabled={busy}>Add</button>
        </form>
      </section>
      <section className="card">
        {rows.length === 0 ? (
          <p className="empty-state">Nothing here yet.</p>
        ) : (
          <table>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>
                    <button type="button" className="btn-danger" onClick={() => { void remove(row.id); }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
