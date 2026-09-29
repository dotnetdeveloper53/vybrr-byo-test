// Cards — list, create and delete.
import { useAuth } from "@vybrr/auth-framework-react";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router-dom";

interface CardRow {
  id: string;
  board_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  due_date: string | null;
  column_name: string;
  created_at: string;
}

export function CardsPage() {
  const { user, loading, authFetch } = useAuth();
  const [rows, setRows] = useState<CardRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [board_idInput, setBoardIdInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [assignee_idInput, setAssigneeIdInput] = useState("");
  const [due_dateInput, setDueDateInput] = useState("");
  const [column_nameInput, setColumnNameInput] = useState("To Do");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await authFetch("/cards");
      if (!response.ok) throw new Error("Unable to load Cards.");
      setRows((await response.json()) as CardRow[]);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load Cards.");
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  async function add(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await authFetch("/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board_id: board_idInput, title: titleInput, description: descriptionInput === "" ? null : descriptionInput, assignee_id: assignee_idInput === "" ? null : assignee_idInput, due_date: due_dateInput === "" ? null : due_dateInput, column_name: column_nameInput }),
      });
      if (!response.ok) throw new Error("Unable to save.");
      setBoardIdInput("");
      setTitleInput("");
      setDescriptionInput("");
      setAssigneeIdInput("");
      setDueDateInput("");
      setColumnNameInput("To Do");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string): Promise<void> {
    await authFetch(`/cards/${id}`, { method: "DELETE" });
    await load();
  }

  async function moveCard(id: string, column_name: string): Promise<void> {
    setRows((current) => current.map((row) => row.id === id ? { ...row, column_name } : row));
    const response = await authFetch(`/cards/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ column_name }) });
    if (!response.ok) await load();
  }

  if (loading) return <div className="page"><p>Loading…</p></div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Cards</h1>
      </header>
      {error !== null && <p role="alert">{error}</p>}
      <section className="card">
        <form className="stack" onSubmit={(event) => { void add(event); }}>
          <label>
            Board id
            <input type="text" value={board_idInput} onChange={(event) => { setBoardIdInput(event.target.value); }} required />
          </label>
          <label>
            Title
            <input type="text" value={titleInput} onChange={(event) => { setTitleInput(event.target.value); }} required />
          </label>
          <label>
            Description
            <input type="text" value={descriptionInput} onChange={(event) => { setDescriptionInput(event.target.value); }} />
          </label>
          <label>
            Assignee id
            <input type="text" value={assignee_idInput} onChange={(event) => { setAssigneeIdInput(event.target.value); }} />
          </label>
          <label>
            Due date
            <input type="date" value={due_dateInput} onChange={(event) => { setDueDateInput(event.target.value); }} />
          </label>
          <label>
            Column
            <select value={column_nameInput} onChange={(event) => { setColumnNameInput(event.target.value); }} required>
              <option>To Do</option><option>Doing</option><option>Done</option>
            </select>
          </label>
          <button type="submit" disabled={busy}>Add</button>
        </form>
      </section>
      <section className="board-grid">
        {(["To Do", "Doing", "Done"] as const).map((column) => (
          <div className="card" key={column} onDragOver={(event) => { event.preventDefault(); }} onDrop={() => { if (draggedId) void moveCard(draggedId, column); }}>
            <div className="row"><h2>{column}</h2><span className="badge">{rows.filter((row) => row.column_name === column).length}</span></div>
            <div className="stack">
              {rows.filter((row) => row.column_name === column).map((row) => (
                <article className="card" key={row.id} draggable onDragStart={() => { setDraggedId(row.id); }}>
                  <strong>{row.title}</strong>
                  {row.description && <p>{row.description}</p>}
                  {row.due_date && <small>Due {row.due_date}</small>}
                  <button type="button" className="btn-danger" onClick={() => { void remove(row.id); }}>Delete</button>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
