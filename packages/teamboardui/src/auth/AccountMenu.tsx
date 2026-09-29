import { useAuth } from "@vybrr/auth-framework-react";
import { Link, useNavigate } from "react-router-dom";

export function AccountMenu() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;
  if (!user) {
    return (
      <div className="account">
        <Link to="/login">Sign in</Link>
      </div>
    );
  }
  return (
    <div className="account">
      <span className="account-email" title={user.email ?? undefined}>
        {user.email ?? "Signed in"}
      </span>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => {
          void logout().then(() => {
            void navigate("/login");
          });
        }}
      >
        Sign out
      </button>
    </div>
  );
}
