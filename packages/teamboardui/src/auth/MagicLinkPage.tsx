import { MagicLinkVerifyHandler } from "@vybrr/auth-framework-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { TwoFactorCard } from "./TwoFactorCard.js";

export function MagicLinkPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [partialToken, setPartialToken] = useState<string | null>(null);
  const token = searchParams.get("token");

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
        {token === null ? (
          <p role="alert">This sign-in link is missing its token. Request a new one from the sign-in page.</p>
        ) : (
          <MagicLinkVerifyHandler
            token={token}
            onSuccess={() => {
              void navigate("/");
            }}
            onTwoFactorRequired={setPartialToken}
          />
        )}
      </div>
    </div>
  );
}
