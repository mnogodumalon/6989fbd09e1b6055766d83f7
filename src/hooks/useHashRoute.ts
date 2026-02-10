import { useState, useEffect, useCallback } from 'react';

// Valid route identifiers for this app
const VALID_ROUTES = ['kurse', 'raeume', 'dozenten', 'teilnehmer', 'anmeldungen'] as const;
export type RouteName = (typeof VALID_ROUTES)[number] | '';

/**
 * Extract the actual route from a (possibly polluted) hash.
 *
 * The reverse proxy on my.living-apps.de can inject pathname segments
 * (e.g. "/github", the repo hex-ID) into the hash, producing URLs like:
 *   /#/github/github/github/github//dozenten
 *
 * This function scans the hash segments from RIGHT to LEFT and returns the
 * first one that matches a known route. If none match → '' (dashboard).
 */
function extractRoute(hash: string): RouteName {
  // strip "#" and split, e.g. "#/github/github//dozenten" → ["github","github","dozenten"]
  const raw = hash.replace(/^#\/?/, '');
  const segments = raw.split('/').filter(Boolean);

  for (let i = segments.length - 1; i >= 0; i--) {
    if ((VALID_ROUTES as readonly string[]).includes(segments[i])) {
      return segments[i] as RouteName;
    }
  }
  return '';          // dashboard
}

/**
 * Lightweight hash-based router that is immune to proxy path pollution.
 *
 * Returns:
 *   route      – current RouteName ('' = dashboard)
 *   navigateTo – function to navigate to a route
 */
export function useHashRoute() {
  const [route, setRoute] = useState<RouteName>(() => extractRoute(window.location.hash));

  // Keep the visible hash clean
  const syncHash = useCallback(() => {
    const detected = extractRoute(window.location.hash);
    setRoute(detected);

    // Write back a clean hash so the address bar looks good
    const cleanHash = detected === '' ? '#/' : '#/' + detected;
    if (window.location.hash !== cleanHash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search + cleanHash);
    }
  }, []);

  useEffect(() => {
    // Clean on mount (initial page load)
    syncHash();

    // Listen for back / forward
    const onHashChange = () => syncHash();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [syncHash]);

  const navigateTo = useCallback((target: RouteName) => {
    const cleanHash = target === '' ? '#/' : '#/' + target;
    // pushState so browser back-button works
    window.history.pushState(null, '', window.location.pathname + window.location.search + cleanHash);
    setRoute(target);
  }, []);

  return { route, navigateTo } as const;
}

