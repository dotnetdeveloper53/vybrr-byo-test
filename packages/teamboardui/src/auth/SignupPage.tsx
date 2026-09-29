import { SignupForm } from "@vybrr/auth-framework-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { TwoFactorCard } from "./TwoFactorCard.js";

export function SignupPage() {
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

  return (
    <div className="auth-page">
      <div className="card">
        <h1>Create an account</h1>
        <SignupForm
          onSuccess={() => {
            void navigate("/");
          }}
          onTwoFactorRequired={setPartialToken}
        />
        <p className="muted">
          <Link to="/login">I already have an account</Link>
        </p>
      </div>
    </div>
  );
}
