// How this frontend calls its own backend when there is no sign-in (with
// sign-in, use useAuth()'s authFetch, which does the same and adds the token).
//
//   const response = await backendFetch("myapi", "/contact-messages", { method: "POST", ... });
//
// The frontend and backend are different hosts, so a relative fetch("/x")
// only fetches this page's own HTML. The backend's address comes from this
// page's: {frontend}.{env}.ui.{tenant}.vybrr.app -> {backend}.{env}.api.{tenant}.vybrr.app,
// worked out at runtime because one build is promoted unchanged from DEV to
// PROD — the same rule @vybrr/auth-framework-react's AuthProvider uses.
const VYBRR_HOSTNAME = /^[a-z0-9-]+\.(dev|test|prod)\.ui\.([a-z0-9-]+)\.vybrr\.app$/;

export function backendOrigin(backendSlug: string): string {
  const match = VYBRR_HOSTNAME.exec(window.location.hostname);
  if (!match) {
    throw new Error(`Can't work out the "${backendSlug}" backend's address from ${window.location.hostname} (on a custom domain it has to be set explicitly)`);
  }
  return `https://${backendSlug}.${match[1] ?? ""}.api.${match[2] ?? ""}.vybrr.app`;
}

export function backendFetch(backendSlug: string, path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${backendOrigin(backendSlug)}${path}`, init);
}
