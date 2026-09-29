import { NavLink, Route, Routes } from "react-router-dom";

import { Home } from "./pages/Home.js";
import { AccountMenu } from "./auth/AccountMenu.js";
import { AuthCallbackPage } from "./auth/AuthCallbackPage.js";
import { LoginPage } from "./auth/LoginPage.js";
import { SignupPage } from "./auth/SignupPage.js";
import { MagicLinkPage } from "./auth/MagicLinkPage.js";
import { BoardsPage } from "./pages/BoardsPage.js";
import { CardsPage } from "./pages/CardsPage.js";
import { TeamPage } from "./pages/TeamPage.js";

export function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">teamboardui</div>
        <nav className="nav">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/boards">Boards</NavLink>
          <NavLink to="/cards">Cards</NavLink>
          <NavLink to="/team">Team Page</NavLink>
        </nav>
        <AccountMenu />
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/auth/magic-link" element={<MagicLinkPage />} />
          <Route path="/boards" element={<BoardsPage />} />
          <Route path="/cards" element={<CardsPage />} />
          <Route path="/team" element={<TeamPage />} />
        </Routes>
      </main>
    </div>
  );
}
