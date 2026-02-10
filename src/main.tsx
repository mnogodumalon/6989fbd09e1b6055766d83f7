import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Fix for GitHub Pages reverse proxy: Clean up any pathname pollution in the hash
// This can happen when the reverse proxy incorrectly includes the path in the hash
const cleanupHash = () => {
  const hash = window.location.hash;
  if (!hash || hash === '#' || hash === '#/') return;
  
  // Check if hash contains repeated /github or repo ID patterns
  // e.g., #/github/github/github/kurse should become #/kurse
  const cleanedHash = hash.replace(/#(\/github|\/[a-f0-9]{24,})+/g, '#');
  
  if (cleanedHash !== hash) {
    const finalHash = cleanedHash === '#' ? '#/' : cleanedHash;
    window.history.replaceState(null, '', window.location.pathname + finalHash);
  }
};

cleanupHash();

// Also listen for hash changes to clean up any pollution during navigation
window.addEventListener('hashchange', cleanupHash);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
