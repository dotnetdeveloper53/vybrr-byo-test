import { LoginForm, MagicLinkRequestForm } from "@vybrr/auth-framework-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { TwoFactorCard } from "./TwoFactorCard.js";

// The two-factor step-up is wired whether or not two-factor authentication
// has been enabled on the backend: with no enrolled user the backend never
// issues a challenge and this branch is simply never reached. Without it,
// turning two-factor on later would silently break this page — the sign-in
// button would do nothing at all for an enrolled user.
export function LoginPage() {
  const navigate = useNavigate();
  const [partialToken, setPartialToken] = useState<string | null>(null);

  if (partialToken !== null) {
    return (
      <TwoFactorCard
        partialToken={partialToken}
        onSuccess={() => {
          void navigate("/");
        }}
      />
    );
  }

  const signInError = new URLSearchParams(useLocation().search).get("error");

  return (
    <div className="auth-page">
      <div className="card">
        <h1>Sign in</h1>
        {signInError ? (
          <p role="alert">
            {signInError === "account_disabled"
              ? "That account has been disabled. Please contact support."
              : "We couldn't complete that sign-in. Please try again."}
          </p>
        ) : null}

        <LoginForm
          onSuccess={() => {
            void navigate("/");
          }}
          onTwoFactorRequired={setPartialToken}
        />
        <p className="muted">or</p>
        <MagicLinkRequestForm />
        <p className="muted">
          <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
