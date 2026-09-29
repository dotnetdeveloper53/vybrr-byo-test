import { TwoFactorVerifyForm } from "@vybrr/auth-framework-react";

export interface TwoFactorCardProps {
  partialToken: string;
  onSuccess: () => void;
}

// Shown whenever the backend answers a sign-in with a two-factor challenge
// instead of a session. TwoFactorVerifyForm handles both an authenticator
// code and a recovery code, toggling between them itself.
export function TwoFactorCard({ partialToken, onSuccess }: TwoFactorCardProps) {
  return (
    <div className="auth-page">
      <div className="card">
        <h1>Two-factor authentication</h1>
        <p className="muted">Enter the code from your authenticator app.</p>
        <TwoFactorVerifyForm partialToken={partialToken} onSuccess={onSuccess} />
      </div>
    </div>
  );
}
