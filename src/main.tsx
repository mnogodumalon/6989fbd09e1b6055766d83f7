import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Fix for GitHub Pages reverse proxy: Clean up any pathname pollution in the hash.
// The reverse proxy at my.living-apps.de can leak pathname segments (e.g. "/github",
// the repo hex ID) into the hash, producing URLs like:
//   /#/github/github/github/github//kurse  instead of  /#/kurse
// This strips those leaked segments by matching them against the actual pathname.
const cleanupHash = () => {
  const hash = window.location.hash;
  if (!hash || hash === '#' || hash === '#/') return;

  let hashPath = hash.substring(1); // strip leading '#'

  // Collect the non-empty segments from the real pathname
  // e.g. "/github/6989fbd09e1b6055766d83f7/" → ["github", "6989fbd09e1b6055766d83f7"]
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  if (pathSegments.length === 0) return;

  // Repeatedly strip any leading pathname segment from the hash path
  let changed = true;
  while (changed) {
    changed = false;
    for (const seg of pathSegments) {
      const prefix = '/' + seg;
      if (hashPath.startsWith(prefix + '/') || hashPath === prefix) {
        hashPath = hashPath.substring(prefix.length);
        changed = true;
      }
    }
  }

  // Ensure the path starts with /
  if (!hashPath.startsWith('/')) {
    hashPath = '/' + hashPath;
  }

  // Collapse any double (or more) slashes
  hashPath = hashPath.replace(/\/\/+/g, '/');

  const newHash = '#' + hashPath;
  if (newHash !== hash) {
    window.history.replaceState(
      window.history.state, // preserve React Router's state
      '',
      window.location.pathname + window.location.search + newHash
    );
  }
};

// Run immediately (before React mounts) so HashRouter reads a clean hash
cleanupHash();

// Also listen for hash changes (e.g. browser back/forward through a polluted entry)
window.addEventListener('hashchange', cleanupHash);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
