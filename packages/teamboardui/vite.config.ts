import react from "@vitejs/plugin-react";
import { vybrrInspectorTagPlugin } from "@vybrr/vybrr-inspector/vite-plugin";
import { defineConfig } from "vite";

// tenant-ui-design.md §7.5 — tags every JSX element with a data-vybrr-el
// descriptor at build time, consumed by Focus. `enforce: "pre"` so this
// runs before @vitejs/plugin-react's own JSX/Fast-Refresh transform.
//
// Real distribution gap, not solved here: this template is *copied* into
// each tenant's own separate repo (mcp-vybrr-scaffold's copyTemplateInstance
// is a plain file copy, not a workspace link), so @vybrr/vybrr-inspector as
// declared in this template's own package.json needs a real (likely
// private) npm registry to actually resolve there — none exists in this
// codebase yet, the same class of gap as JUICEFS_ROOT's "no repo-init
// pipeline exists yet" (CLAUDE.md §8). Within *this* monorepo's own
// workspace the package resolves fine via pnpm's workspace protocol, which
// is what this template's own committed package.json intentionally does
// NOT rely on, so as not to ship something that looks resolvable but isn't
// once actually copied out.
export default defineConfig({
  plugins: [vybrrInspectorTagPlugin(), react()],
  build: {
    outDir: "../../dist/frontend/teamboardui",
    emptyOutDir: true,
  },
});
