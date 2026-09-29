import { OAuthCallbackHandler } from "@vybrr/auth-framework-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { TwoFactorCard } from "./TwoFactorCard.js";

// Where an external sign-in provider returns the browser. The token itself
// was already read out of the URL before this renders; this page only
// decides where to go next.
export function AuthCallbackPage() {
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
        <h1>Signing you in</h1>
        <OAuthCallbackHandler
          onSuccess={() => {
            void navigate("/");
          }}
          onTwoFactorRequired={setPartialToken}
          onError={(reason) => {
            // A sign-in the provider refused is worth telling the user
            // about; arriving here with nothing is just a stray visit to
            // this route (docs/plans/2026-09-24-oauth-callback-error-handling.md).
            void navigate(reason ? `/login?error=${reason}` : "/login");
          }}
        />
      </div>
    </div>
  );
}
