import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { Kurse, Raeume, Dozenten, Anmeldungen, Teilnehmer } from '@/types/app';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';

interface DataContextType {
  // Data
  kurse: Kurse[];
  raeume: Raeume[];
  dozenten: Dozenten[];
  anmeldungen: Anmeldungen[];
  teilnehmer: Teilnehmer[];
  
  // State
  loading: boolean;
  error: Error | null;
  
  // Actions
  fetchAll: () => Promise<void>;
  
  // Lookup Maps
  kursMap: Map<string, Kurse>;
  dozentMap: Map<string, Dozenten>;
  raumMap: Map<string, Raeume>;
  teilnehmerMap: Map<string, Teilnehmer>;
  
  // Resolve Functions
  resolveKursName: (url: string | undefined) => string;
  resolveDozentName: (url: string | undefined) => string;
  resolveRaumName: (url: string | undefined) => string;
  resolveTeilnehmerName: (url: string | undefined) => string;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [dozenten, setDozenten] = useState<Dozenten[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [k, r, d, a, t] = await Promise.all([
        LivingAppsService.getKurse(),
        LivingAppsService.getRaeume(),
        LivingAppsService.getDozenten(),
        LivingAppsService.getAnmeldungen(),
        LivingAppsService.getTeilnehmer(),
      ]);
      setKurse(k);
      setRaeume(r);
      setDozenten(d);
      setAnmeldungen(a);
      setTeilnehmer(t);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Lookup Maps
  const kursMap = useMemo(() => {
    const m = new Map<string, Kurse>();
    kurse.forEach(k => m.set(k.record_id, k));
    return m;
  }, [kurse]);

  const dozentMap = useMemo(() => {
    const m = new Map<string, Dozenten>();
    dozenten.forEach(d => m.set(d.record_id, d));
    return m;
  }, [dozenten]);

  const raumMap = useMemo(() => {
    const m = new Map<string, Raeume>();
    raeume.forEach(r => m.set(r.record_id, r));
    return m;
  }, [raeume]);

  const teilnehmerMap = useMemo(() => {
    const m = new Map<string, Teilnehmer>();
    teilnehmer.forEach(t => m.set(t.record_id, t));
    return m;
  }, [teilnehmer]);

  // Resolve Functions
  const resolveKursName = useCallback((url: string | undefined): string => {
    const id = extractRecordId(url);
    if (!id) return '-';
    const k = kursMap.get(id);
    return k?.fields.titel ?? '-';
  }, [kursMap]);

  const resolveDozentName = useCallback((url: string | undefined): string => {
    const id = extractRecordId(url);
    if (!id) return '-';
    const d = dozentMap.get(id);
    return d ? `${d.fields.vorname ?? ''} ${d.fields.nachname ?? ''}`.trim() || '-' : '-';
  }, [dozentMap]);

  const resolveRaumName = useCallback((url: string | undefined): string => {
    const id = extractRecordId(url);
    if (!id) return '-';
    const r = raumMap.get(id);
    return r?.fields.raumname ?? '-';
  }, [raumMap]);

  const resolveTeilnehmerName = useCallback((url: string | undefined): string => {
    const id = extractRecordId(url);
    if (!id) return '-';
    const t = teilnehmerMap.get(id);
    return t ? `${t.fields.vorname ?? ''} ${t.fields.nachname ?? ''}`.trim() || '-' : '-';
  }, [teilnehmerMap]);

  const value: DataContextType = {
    kurse,
    raeume,
    dozenten,
    anmeldungen,
    teilnehmer,
    loading,
    error,
    fetchAll,
    kursMap,
    dozentMap,
    raumMap,
    teilnehmerMap,
    resolveKursName,
    resolveDozentName,
    resolveRaumName,
    resolveTeilnehmerName,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

