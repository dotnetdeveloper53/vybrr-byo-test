import { useAuth } from "@vybrr/auth-framework-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router-dom";

export function TeamPage() {
  const { user, loading, authFetch } = useAuth();
  const [teamId, setTeamId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  if (loading) return <div className="page"><p>Loading…</p></div>;
  if (!user) return <Navigate to="/login" replace />;

  async function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await authFetch("/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    if (response.ok) { const team = (await response.json()) as { id: string }; setTeamId(team.id); setMessage("Team created."); }
  }
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await authFetch(`/teams/${teamId}/invitations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    if (response.ok) { setMessage("Invitation sent."); form.reset(); setEmail(""); }
  }
  return <div className="page"><header className="page-header"><div><p className="eyebrow">Workspace</p><h1>Team</h1><p>Invite teammates by email. Only you can manage membership.</p></div></header><div className="grid"><section className="card"><h2>Create a team</h2><form className="stack" onSubmit={(event) => void createTeam(event)}><label>Team name<input value={name} onChange={(event) => setName(event.target.value)} required /></label><button type="submit">Create team</button></form></section><section className="card"><h2>Invite a teammate</h2><form className="stack" onSubmit={(event) => void invite(event)}><label>Team ID<input value={teamId} onChange={(event) => setTeamId(event.target.value)} required /></label><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><button type="submit">Send invite</button></form></section></div>{message && <p role="status">{message}</p>}</div>;
}
