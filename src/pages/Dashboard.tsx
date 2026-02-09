import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Kurse, Raeume, Dozenten, Anmeldungen, Teilnehmer } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import {
  BookOpen, Users, AlertCircle, Euro, Plus, Pencil, Trash2, RefreshCw,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr.split('T')[0]), 'dd.MM.yyyy', { locale: de });
  } catch {
    return dateStr;
  }
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [dozenten, setDozenten] = useState<Dozenten[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // CRUD dialog state
  const [anmeldungDialog, setAnmeldungDialog] = useState(false);
  const [kursDialog, setKursDialog] = useState(false);
  const [raumDialog, setRaumDialog] = useState(false);
  const [dozentDialog, setDozentDialog] = useState(false);
  const [teilnehmerDialog, setTeilnehmerDialog] = useState(false);

  const [editAnmeldung, setEditAnmeldung] = useState<Anmeldungen | null>(null);
  const [editKurs, setEditKurs] = useState<Kurse | null>(null);
  const [editRaum, setEditRaum] = useState<Raeume | null>(null);
  const [editDozent, setEditDozent] = useState<Dozenten | null>(null);
  const [editTeilnehmer, setEditTeilnehmer] = useState<Teilnehmer | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);

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

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Lookup Maps ─────────────────────────────────────────────────────────

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

  // ─── KPI Calculations ────────────────────────────────────────────────────

  const today = todayISO();

  const activeKurse = useMemo(() =>
    kurse.filter(k => !k.fields.enddatum || k.fields.enddatum >= today),
    [kurse, today]
  );

  const totalCapacity = useMemo(() =>
    activeKurse.reduce((sum, k) => sum + (k.fields.maximale_teilnehmer ?? 0), 0),
    [activeKurse]
  );

  const totalAnmeldungen = anmeldungen.length;

  const fillRate = totalCapacity > 0 ? Math.round((totalAnmeldungen / totalCapacity) * 100) : 0;

  const offeneZahlungen = useMemo(() =>
    anmeldungen.filter(a => !a.fields.bezahlt).length,
    [anmeldungen]
  );

  const umsatz = useMemo(() => {
    return anmeldungen
      .filter(a => a.fields.bezahlt === true)
      .reduce((sum, a) => {
        const kursId = extractRecordId(a.fields.kurs);
        if (!kursId) return sum;
        const kurs = kursMap.get(kursId);
        return sum + (kurs?.fields.preis ?? 0);
      }, 0);
  }, [anmeldungen, kursMap]);

  // ─── Chart Data ──────────────────────────────────────────────────────────

  const chartData = useMemo(() => {
    const counts = new Map<string, number>();
    anmeldungen.forEach(a => {
      const kursId = extractRecordId(a.fields.kurs);
      if (!kursId) return;
      counts.set(kursId, (counts.get(kursId) ?? 0) + 1);
    });
    return kurse.map(k => ({
      name: k.fields.titel ?? 'Unbenannt',
      anmeldungen: counts.get(k.record_id) ?? 0,
      kapazitaet: k.fields.maximale_teilnehmer ?? 0,
    }));
  }, [kurse, anmeldungen]);

  // ─── Recent Registrations ────────────────────────────────────────────────

  const recentAnmeldungen = useMemo(() => {
    return [...anmeldungen]
      .sort((a, b) => (b.fields.anmeldedatum ?? '').localeCompare(a.fields.anmeldedatum ?? ''))
      .slice(0, 5);
  }, [anmeldungen]);

  // ─── Resolve names ───────────────────────────────────────────────────────

  function resolveTeilnehmerName(url: string | undefined): string {
    const id = extractRecordId(url);
    if (!id) return '-';
    const t = teilnehmerMap.get(id);
    return t ? `${t.fields.vorname ?? ''} ${t.fields.nachname ?? ''}`.trim() || '-' : '-';
  }

  function resolveKursName(url: string | undefined): string {
    const id = extractRecordId(url);
    if (!id) return '-';
    const k = kursMap.get(id);
    return k?.fields.titel ?? '-';
  }

  function resolveDozentName(url: string | undefined): string {
    const id = extractRecordId(url);
    if (!id) return '-';
    const d = dozentMap.get(id);
    return d ? `${d.fields.vorname ?? ''} ${d.fields.nachname ?? ''}`.trim() || '-' : '-';
  }

  function resolveRaumName(url: string | undefined): string {
    const id = extractRecordId(url);
    if (!id) return '-';
    const r = raumMap.get(id);
    return r?.fields.raumname ?? '-';
  }

  // ─── Delete Handler ──────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      switch (deleteTarget.type) {
        case 'kurse': await LivingAppsService.deleteKurseEntry(deleteTarget.id); break;
        case 'raeume': await LivingAppsService.deleteRaeumeEntry(deleteTarget.id); break;
        case 'dozenten': await LivingAppsService.deleteDozentenEntry(deleteTarget.id); break;
        case 'anmeldungen': await LivingAppsService.deleteAnmeldungenEntry(deleteTarget.id); break;
        case 'teilnehmer': await LivingAppsService.deleteTeilnehmerEntry(deleteTarget.id); break;
      }
      toast.success('Gelöscht', { description: `"${deleteTarget.name}" wurde gelöscht.` });
      setDeleteTarget(null);
      fetchAll();
    } catch {
      toast.error('Fehler', { description: 'Eintrag konnte nicht gelöscht werden.' });
    }
  }

  // ─── Loading State ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-[1280px] space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-9 w-40" />
          </div>
          <Skeleton className="h-40 w-full rounded-lg" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" /> Fehler beim Laden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button onClick={fetchAll} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" /> Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Main Render ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mx-auto max-w-[1280px] space-y-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Kursverwaltung</h1>
          <Button onClick={() => { setEditAnmeldung(null); setAnmeldungDialog(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Neue Anmeldung</span>
            <span className="sm:hidden">Neu</span>
          </Button>
        </div>

        {/* ── Two-Column Layout (Desktop) ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.54fr] gap-6">

          {/* ── Left Column ────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Hero: Auslastung */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6 pb-6 px-6">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                  Auslastung
                </p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl md:text-[56px] font-extrabold leading-none" style={{ color: 'hsl(234 62% 46%)' }}>
                    {fillRate}%
                  </span>
                </div>
                <div className="w-full h-2.5 md:h-3 bg-muted rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(fillRate, 100)}%`,
                      background: 'linear-gradient(90deg, hsl(234 62% 46%), hsl(234 62% 60%))',
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {totalAnmeldungen} von {totalCapacity} Plätzen belegt
                </p>
              </CardContent>
            </Card>

            {/* Chart: Anmeldungen pro Kurs */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Anmeldungen pro Kurs</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Keine Kurse vorhanden.</p>
                ) : (
                  <div style={{ height: Math.max(200, chartData.length * 48) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                        <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={120}
                          tick={{ fontSize: 12 }}
                          stroke="hsl(220 10% 46%)"
                          tickFormatter={(v: string) => v.length > 20 ? v.slice(0, 20) + '…' : v}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(0 0% 100%)',
                            border: '1px solid hsl(220 15% 90%)',
                            borderRadius: '8px',
                            fontSize: '13px',
                          }}
                          formatter={(value: number, _name: string, props: { payload?: { kapazitaet?: number } }) => [
                            `${value} / ${props.payload?.kapazitaet ?? 0}`,
                            'Anmeldungen / Kapazität',
                          ]}
                        />
                        <ReferenceLine x={0} stroke="transparent" />
                        <Bar dataKey="anmeldungen" radius={[0, 4, 4, 0]} maxBarSize={28}>
                          {chartData.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={entry.anmeldungen >= entry.kapazitaet
                                ? 'hsl(0 72% 51%)'
                                : 'hsl(234 62% 46%)'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Right Column ───────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Secondary KPIs: 2x2 Grid */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={BookOpen} label="Aktive Kurse" value={activeKurse.length} />
              <StatCard icon={Users} label="Teilnehmer" value={teilnehmer.length} />
              <StatCard
                icon={AlertCircle}
                label="Offene Zahlungen"
                value={offeneZahlungen}
                valueClassName={offeneZahlungen > 0 ? 'text-destructive' : ''}
              />
              <StatCard icon={Euro} label="Umsatz" value={formatCurrency(umsatz)} />
            </div>

            {/* Recent Registrations */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Letzte Anmeldungen</CardTitle>
              </CardHeader>
              <CardContent>
                {recentAnmeldungen.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Noch keine Anmeldungen vorhanden.
                  </p>
                ) : (
                  <div className="divide-y">
                    {recentAnmeldungen.map((a) => (
                      <div
                        key={a.record_id}
                        className="flex items-center justify-between py-3 cursor-pointer hover:bg-muted/50 -mx-4 px-4 rounded transition-colors"
                        onClick={() => { setEditAnmeldung(a); setAnmeldungDialog(true); }}
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {resolveTeilnehmerName(a.fields.teilnehmer)}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {resolveKursName(a.fields.kurs)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(a.fields.anmeldedatum)}
                          </span>
                          <Badge variant={a.fields.bezahlt ? 'default' : 'destructive'} className="text-xs">
                            {a.fields.bezahlt ? 'Bezahlt' : 'Offen'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Data Management Tabs ────────────────────────────────────── */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <Tabs defaultValue="kurse">
              <TabsList className="w-full overflow-x-auto flex-nowrap">
                <TabsTrigger value="kurse">Kurse</TabsTrigger>
                <TabsTrigger value="raeume">Räume</TabsTrigger>
                <TabsTrigger value="dozenten">Dozenten</TabsTrigger>
                <TabsTrigger value="teilnehmer">Teilnehmer</TabsTrigger>
                <TabsTrigger value="anmeldungen">Anmeldungen</TabsTrigger>
              </TabsList>

              {/* ── Kurse Tab ──────────────────────────────────────────── */}
              <TabsContent value="kurse">
                <div className="flex items-center justify-between mb-4 mt-4">
                  <h3 className="font-semibold">Kurse</h3>
                  <Button size="sm" onClick={() => { setEditKurs(null); setKursDialog(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Neu
                  </Button>
                </div>
                {kurse.length === 0 ? (
                  <EmptyState message="Noch keine Kurse vorhanden." onAdd={() => { setEditKurs(null); setKursDialog(true); }} addLabel="Kurs erstellen" />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kurstitel</TableHead>
                          <TableHead className="hidden md:table-cell">Startdatum</TableHead>
                          <TableHead className="hidden md:table-cell">Enddatum</TableHead>
                          <TableHead className="hidden sm:table-cell">Max. TN</TableHead>
                          <TableHead className="hidden sm:table-cell">Preis</TableHead>
                          <TableHead className="hidden lg:table-cell">Dozent</TableHead>
                          <TableHead className="hidden lg:table-cell">Raum</TableHead>
                          <TableHead className="w-20" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {kurse.map(k => (
                          <TableRow key={k.record_id} className="hover:bg-muted/50 cursor-pointer" onClick={() => { setEditKurs(k); setKursDialog(true); }}>
                            <TableCell className="font-medium">{k.fields.titel ?? '-'}</TableCell>
                            <TableCell className="hidden md:table-cell">{formatDate(k.fields.startdatum)}</TableCell>
                            <TableCell className="hidden md:table-cell">{formatDate(k.fields.enddatum)}</TableCell>
                            <TableCell className="hidden sm:table-cell">{k.fields.maximale_teilnehmer ?? '-'}</TableCell>
                            <TableCell className="hidden sm:table-cell">{formatCurrency(k.fields.preis)}</TableCell>
                            <TableCell className="hidden lg:table-cell">{resolveDozentName(k.fields.dozent)}</TableCell>
                            <TableCell className="hidden lg:table-cell">{resolveRaumName(k.fields.raum)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditKurs(k); setKursDialog(true); }} aria-label="Bearbeiten">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: 'kurse', id: k.record_id, name: k.fields.titel ?? 'Kurs' })} aria-label="Löschen">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* ── Räume Tab ──────────────────────────────────────────── */}
              <TabsContent value="raeume">
                <div className="flex items-center justify-between mb-4 mt-4">
                  <h3 className="font-semibold">Räume</h3>
                  <Button size="sm" onClick={() => { setEditRaum(null); setRaumDialog(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Neu
                  </Button>
                </div>
                {raeume.length === 0 ? (
                  <EmptyState message="Noch keine Räume vorhanden." onAdd={() => { setEditRaum(null); setRaumDialog(true); }} addLabel="Raum erstellen" />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Raumname</TableHead>
                          <TableHead>Gebäude</TableHead>
                          <TableHead>Kapazität</TableHead>
                          <TableHead className="w-20" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {raeume.map(r => (
                          <TableRow key={r.record_id} className="hover:bg-muted/50 cursor-pointer" onClick={() => { setEditRaum(r); setRaumDialog(true); }}>
                            <TableCell className="font-medium">{r.fields.raumname ?? '-'}</TableCell>
                            <TableCell>{r.fields.gebaeude ?? '-'}</TableCell>
                            <TableCell>{r.fields.kapazitaet ?? '-'}</TableCell>
                            <TableCell>
                              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditRaum(r); setRaumDialog(true); }} aria-label="Bearbeiten">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: 'raeume', id: r.record_id, name: r.fields.raumname ?? 'Raum' })} aria-label="Löschen">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* ── Dozenten Tab ───────────────────────────────────────── */}
              <TabsContent value="dozenten">
                <div className="flex items-center justify-between mb-4 mt-4">
                  <h3 className="font-semibold">Dozenten</h3>
                  <Button size="sm" onClick={() => { setEditDozent(null); setDozentDialog(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Neu
                  </Button>
                </div>
                {dozenten.length === 0 ? (
                  <EmptyState message="Noch keine Dozenten vorhanden." onAdd={() => { setEditDozent(null); setDozentDialog(true); }} addLabel="Dozent erstellen" />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vorname</TableHead>
                          <TableHead>Nachname</TableHead>
                          <TableHead className="hidden sm:table-cell">E-Mail</TableHead>
                          <TableHead className="hidden md:table-cell">Fachgebiet</TableHead>
                          <TableHead className="w-20" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dozenten.map(d => (
                          <TableRow key={d.record_id} className="hover:bg-muted/50 cursor-pointer" onClick={() => { setEditDozent(d); setDozentDialog(true); }}>
                            <TableCell className="font-medium">{d.fields.vorname ?? '-'}</TableCell>
                            <TableCell>{d.fields.nachname ?? '-'}</TableCell>
                            <TableCell className="hidden sm:table-cell">{d.fields.email ?? '-'}</TableCell>
                            <TableCell className="hidden md:table-cell">{d.fields.fachgebiet ?? '-'}</TableCell>
                            <TableCell>
                              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditDozent(d); setDozentDialog(true); }} aria-label="Bearbeiten">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: 'dozenten', id: d.record_id, name: `${d.fields.vorname ?? ''} ${d.fields.nachname ?? ''}`.trim() })} aria-label="Löschen">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* ── Teilnehmer Tab ─────────────────────────────────────── */}
              <TabsContent value="teilnehmer">
                <div className="flex items-center justify-between mb-4 mt-4">
                  <h3 className="font-semibold">Teilnehmer</h3>
                  <Button size="sm" onClick={() => { setEditTeilnehmer(null); setTeilnehmerDialog(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Neu
                  </Button>
                </div>
                {teilnehmer.length === 0 ? (
                  <EmptyState message="Noch keine Teilnehmer vorhanden." onAdd={() => { setEditTeilnehmer(null); setTeilnehmerDialog(true); }} addLabel="Teilnehmer erstellen" />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vorname</TableHead>
                          <TableHead>Nachname</TableHead>
                          <TableHead className="hidden sm:table-cell">E-Mail</TableHead>
                          <TableHead className="hidden md:table-cell">Telefon</TableHead>
                          <TableHead className="w-20" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teilnehmer.map(t => (
                          <TableRow key={t.record_id} className="hover:bg-muted/50 cursor-pointer" onClick={() => { setEditTeilnehmer(t); setTeilnehmerDialog(true); }}>
                            <TableCell className="font-medium">{t.fields.vorname ?? '-'}</TableCell>
                            <TableCell>{t.fields.nachname ?? '-'}</TableCell>
                            <TableCell className="hidden sm:table-cell">{t.fields.email ?? '-'}</TableCell>
                            <TableCell className="hidden md:table-cell">{t.fields.telefon ?? '-'}</TableCell>
                            <TableCell>
                              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditTeilnehmer(t); setTeilnehmerDialog(true); }} aria-label="Bearbeiten">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: 'teilnehmer', id: t.record_id, name: `${t.fields.vorname ?? ''} ${t.fields.nachname ?? ''}`.trim() })} aria-label="Löschen">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* ── Anmeldungen Tab ────────────────────────────────────── */}
              <TabsContent value="anmeldungen">
                <div className="flex items-center justify-between mb-4 mt-4">
                  <h3 className="font-semibold">Anmeldungen</h3>
                  <Button size="sm" onClick={() => { setEditAnmeldung(null); setAnmeldungDialog(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Neu
                  </Button>
                </div>
                {anmeldungen.length === 0 ? (
                  <EmptyState message="Noch keine Anmeldungen vorhanden." onAdd={() => { setEditAnmeldung(null); setAnmeldungDialog(true); }} addLabel="Anmeldung erstellen" />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Teilnehmer</TableHead>
                          <TableHead>Kurs</TableHead>
                          <TableHead className="hidden sm:table-cell">Anmeldedatum</TableHead>
                          <TableHead>Bezahlt</TableHead>
                          <TableHead className="w-20" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {anmeldungen.map(a => (
                          <TableRow key={a.record_id} className="hover:bg-muted/50 cursor-pointer" onClick={() => { setEditAnmeldung(a); setAnmeldungDialog(true); }}>
                            <TableCell className="font-medium">{resolveTeilnehmerName(a.fields.teilnehmer)}</TableCell>
                            <TableCell>{resolveKursName(a.fields.kurs)}</TableCell>
                            <TableCell className="hidden sm:table-cell">{formatDate(a.fields.anmeldedatum)}</TableCell>
                            <TableCell>
                              <Badge variant={a.fields.bezahlt ? 'default' : 'destructive'} className="text-xs">
                                {a.fields.bezahlt ? 'Bezahlt' : 'Offen'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditAnmeldung(a); setAnmeldungDialog(true); }} aria-label="Bearbeiten">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: 'anmeldungen', id: a.record_id, name: `Anmeldung von ${resolveTeilnehmerName(a.fields.teilnehmer)}` })} aria-label="Löschen">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* ── CRUD Dialogs ──────────────────────────────────────────────── */}

      <AnmeldungDialog
        open={anmeldungDialog}
        onOpenChange={setAnmeldungDialog}
        record={editAnmeldung}
        kurse={kurse}
        teilnehmer={teilnehmer}
        onSuccess={fetchAll}
      />

      <KursDialog
        open={kursDialog}
        onOpenChange={setKursDialog}
        record={editKurs}
        dozenten={dozenten}
        raeume={raeume}
        onSuccess={fetchAll}
      />

      <RaumDialog
        open={raumDialog}
        onOpenChange={setRaumDialog}
        record={editRaum}
        onSuccess={fetchAll}
      />

      <DozentDialog
        open={dozentDialog}
        onOpenChange={setDozentDialog}
        record={editDozent}
        onSuccess={fetchAll}
      />

      <TeilnehmerDialogComp
        open={teilnehmerDialog}
        onOpenChange={setTeilnehmerDialog}
        record={editTeilnehmer}
        onSuccess={fetchAll}
      />

      {/* ── Delete Confirmation ───────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du &quot;{deleteTarget?.name}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Stat Card Component ─────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, valueClassName }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  valueClassName?: string;
}) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="pt-4 pb-4 px-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl md:text-[28px] font-bold leading-tight ${valueClassName ?? ''}`}>
              {value}
            </p>
          </div>
          <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty State Component ───────────────────────────────────────────────────

function EmptyState({ message, onAdd, addLabel }: { message: string; onAdd: () => void; addLabel: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      <Button variant="outline" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-1" /> {addLabel}
      </Button>
    </div>
  );
}

// ─── Anmeldung Dialog ────────────────────────────────────────────────────────

function AnmeldungDialog({ open, onOpenChange, record, kurse, teilnehmer, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: Anmeldungen | null;
  kurse: Kurse[];
  teilnehmer: Teilnehmer[];
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [formTeilnehmer, setFormTeilnehmer] = useState('');
  const [formKurs, setFormKurs] = useState('');
  const [formDatum, setFormDatum] = useState('');
  const [formBezahlt, setFormBezahlt] = useState(false);

  useEffect(() => {
    if (open) {
      setFormTeilnehmer(extractRecordId(record?.fields.teilnehmer) ?? '');
      setFormKurs(extractRecordId(record?.fields.kurs) ?? '');
      setFormDatum(record?.fields.anmeldedatum?.split('T')[0] ?? todayISO());
      setFormBezahlt(record?.fields.bezahlt ?? false);
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Anmeldungen['fields'] = {
        teilnehmer: formTeilnehmer ? createRecordUrl(APP_IDS.TEILNEHMER, formTeilnehmer) : undefined,
        kurs: formKurs ? createRecordUrl(APP_IDS.KURSE, formKurs) : undefined,
        anmeldedatum: formDatum || undefined,
        bezahlt: formBezahlt,
      };
      if (isEditing) {
        await LivingAppsService.updateAnmeldungenEntry(record!.record_id, fields);
        toast.success('Gespeichert', { description: 'Anmeldung wurde aktualisiert.' });
      } else {
        await LivingAppsService.createAnmeldungenEntry(fields);
        toast.success('Erstellt', { description: 'Neue Anmeldung wurde erstellt.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `Fehler beim ${isEditing ? 'Speichern' : 'Erstellen'}: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Anmeldung bearbeiten' : 'Neue Anmeldung'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Bearbeite die Anmeldung.' : 'Erstelle eine neue Kursanmeldung.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Teilnehmer</Label>
            <Select value={formTeilnehmer || 'none'} onValueChange={v => setFormTeilnehmer(v === 'none' ? '' : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Teilnehmer wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Kein Teilnehmer --</SelectItem>
                {teilnehmer.map(t => (
                  <SelectItem key={t.record_id} value={t.record_id}>
                    {t.fields.vorname ?? ''} {t.fields.nachname ?? ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kurs</Label>
            <Select value={formKurs || 'none'} onValueChange={v => setFormKurs(v === 'none' ? '' : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Kurs wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Kein Kurs --</SelectItem>
                {kurse.map(k => (
                  <SelectItem key={k.record_id} value={k.record_id}>
                    {k.fields.titel ?? 'Unbenannt'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="anmeldedatum">Anmeldedatum</Label>
            <Input id="anmeldedatum" type="date" value={formDatum} onChange={e => setFormDatum(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="bezahlt" checked={formBezahlt} onCheckedChange={(c) => setFormBezahlt(c === true)} />
            <Label htmlFor="bezahlt" className="cursor-pointer">Bezahlt</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Kurs Dialog ─────────────────────────────────────────────────────────────

function KursDialog({ open, onOpenChange, record, dozenten, raeume, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: Kurse | null;
  dozenten: Dozenten[];
  raeume: Raeume[];
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [titel, setTitel] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [startdatum, setStartdatum] = useState('');
  const [enddatum, setEnddatum] = useState('');
  const [maxTN, setMaxTN] = useState('');
  const [preis, setPreis] = useState('');
  const [dozent, setDozent] = useState('');
  const [raum, setRaum] = useState('');

  useEffect(() => {
    if (open) {
      setTitel(record?.fields.titel ?? '');
      setBeschreibung(record?.fields.beschreibung ?? '');
      setStartdatum(record?.fields.startdatum?.split('T')[0] ?? '');
      setEnddatum(record?.fields.enddatum?.split('T')[0] ?? '');
      setMaxTN(record?.fields.maximale_teilnehmer?.toString() ?? '');
      setPreis(record?.fields.preis?.toString() ?? '');
      setDozent(extractRecordId(record?.fields.dozent) ?? '');
      setRaum(extractRecordId(record?.fields.raum) ?? '');
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Kurse['fields'] = {
        titel: titel || undefined,
        beschreibung: beschreibung || undefined,
        startdatum: startdatum || undefined,
        enddatum: enddatum || undefined,
        maximale_teilnehmer: maxTN ? Number(maxTN) : undefined,
        preis: preis ? Number(preis) : undefined,
        dozent: dozent ? createRecordUrl(APP_IDS.DOZENTEN, dozent) : undefined,
        raum: raum ? createRecordUrl(APP_IDS.RAEUME, raum) : undefined,
      };
      if (isEditing) {
        await LivingAppsService.updateKurseEntry(record!.record_id, fields);
        toast.success('Gespeichert', { description: 'Kurs wurde aktualisiert.' });
      } else {
        await LivingAppsService.createKurseEntry(fields);
        toast.success('Erstellt', { description: 'Neuer Kurs wurde erstellt.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Kurs bearbeiten' : 'Neuer Kurs'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Bearbeite den Kurs.' : 'Erstelle einen neuen Kurs.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titel">Kurstitel *</Label>
            <Input id="titel" value={titel} onChange={e => setTitel(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="beschreibung">Beschreibung</Label>
            <Textarea id="beschreibung" value={beschreibung} onChange={e => setBeschreibung(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startdatum">Startdatum</Label>
              <Input id="startdatum" type="date" value={startdatum} onChange={e => setStartdatum(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enddatum">Enddatum</Label>
              <Input id="enddatum" type="date" value={enddatum} onChange={e => setEnddatum(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxtn">Max. Teilnehmer</Label>
              <Input id="maxtn" type="number" min="0" value={maxTN} onChange={e => setMaxTN(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preis">Preis (EUR)</Label>
              <Input id="preis" type="number" min="0" step="0.01" value={preis} onChange={e => setPreis(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Dozent</Label>
            <Select value={dozent || 'none'} onValueChange={v => setDozent(v === 'none' ? '' : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Dozent wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Kein Dozent --</SelectItem>
                {dozenten.map(d => (
                  <SelectItem key={d.record_id} value={d.record_id}>
                    {d.fields.vorname ?? ''} {d.fields.nachname ?? ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Raum</Label>
            <Select value={raum || 'none'} onValueChange={v => setRaum(v === 'none' ? '' : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Raum wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Kein Raum --</SelectItem>
                {raeume.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.raumname ?? 'Unbenannt'} {r.fields.gebaeude ? `(${r.fields.gebaeude})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Raum Dialog ─────────────────────────────────────────────────────────────

function RaumDialog({ open, onOpenChange, record, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: Raeume | null;
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [raumname, setRaumname] = useState('');
  const [gebaeude, setGebaeude] = useState('');
  const [kapazitaet, setKapazitaet] = useState('');

  useEffect(() => {
    if (open) {
      setRaumname(record?.fields.raumname ?? '');
      setGebaeude(record?.fields.gebaeude ?? '');
      setKapazitaet(record?.fields.kapazitaet?.toString() ?? '');
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Raeume['fields'] = {
        raumname: raumname || undefined,
        gebaeude: gebaeude || undefined,
        kapazitaet: kapazitaet ? Number(kapazitaet) : undefined,
      };
      if (isEditing) {
        await LivingAppsService.updateRaeumeEntry(record!.record_id, fields);
        toast.success('Gespeichert', { description: 'Raum wurde aktualisiert.' });
      } else {
        await LivingAppsService.createRaeumeEntry(fields);
        toast.success('Erstellt', { description: 'Neuer Raum wurde erstellt.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Raum bearbeiten' : 'Neuer Raum'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Bearbeite den Raum.' : 'Erstelle einen neuen Raum.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="raumname">Raumname *</Label>
            <Input id="raumname" value={raumname} onChange={e => setRaumname(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gebaeude">Gebäude</Label>
            <Input id="gebaeude" value={gebaeude} onChange={e => setGebaeude(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kapazitaet">Kapazität</Label>
            <Input id="kapazitaet" type="number" min="0" value={kapazitaet} onChange={e => setKapazitaet(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dozent Dialog ───────────────────────────────────────────────────────────

function DozentDialog({ open, onOpenChange, record, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: Dozenten | null;
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [vorname, setVorname] = useState('');
  const [nachname, setNachname] = useState('');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [fachgebiet, setFachgebiet] = useState('');

  useEffect(() => {
    if (open) {
      setVorname(record?.fields.vorname ?? '');
      setNachname(record?.fields.nachname ?? '');
      setEmail(record?.fields.email ?? '');
      setTelefon(record?.fields.telefon ?? '');
      setFachgebiet(record?.fields.fachgebiet ?? '');
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Dozenten['fields'] = {
        vorname: vorname || undefined,
        nachname: nachname || undefined,
        email: email || undefined,
        telefon: telefon || undefined,
        fachgebiet: fachgebiet || undefined,
      };
      if (isEditing) {
        await LivingAppsService.updateDozentenEntry(record!.record_id, fields);
        toast.success('Gespeichert', { description: 'Dozent wurde aktualisiert.' });
      } else {
        await LivingAppsService.createDozentenEntry(fields);
        toast.success('Erstellt', { description: 'Neuer Dozent wurde erstellt.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Dozent bearbeiten' : 'Neuer Dozent'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Bearbeite den Dozenten.' : 'Erstelle einen neuen Dozenten.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="d_vorname">Vorname *</Label>
              <Input id="d_vorname" value={vorname} onChange={e => setVorname(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d_nachname">Nachname *</Label>
              <Input id="d_nachname" value={nachname} onChange={e => setNachname(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="d_email">E-Mail</Label>
            <Input id="d_email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="d_telefon">Telefon</Label>
            <Input id="d_telefon" type="tel" value={telefon} onChange={e => setTelefon(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="d_fachgebiet">Fachgebiet</Label>
            <Input id="d_fachgebiet" value={fachgebiet} onChange={e => setFachgebiet(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Teilnehmer Dialog ───────────────────────────────────────────────────────

function TeilnehmerDialogComp({ open, onOpenChange, record, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: Teilnehmer | null;
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [vorname, setVorname] = useState('');
  const [nachname, setNachname] = useState('');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [geburtsdatum, setGeburtsdatum] = useState('');

  useEffect(() => {
    if (open) {
      setVorname(record?.fields.vorname ?? '');
      setNachname(record?.fields.nachname ?? '');
      setEmail(record?.fields.email ?? '');
      setTelefon(record?.fields.telefon ?? '');
      setGeburtsdatum(record?.fields.geburtsdatum?.split('T')[0] ?? '');
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Teilnehmer['fields'] = {
        vorname: vorname || undefined,
        nachname: nachname || undefined,
        email: email || undefined,
        telefon: telefon || undefined,
        geburtsdatum: geburtsdatum || undefined,
      };
      if (isEditing) {
        await LivingAppsService.updateTeilnehmerEntry(record!.record_id, fields);
        toast.success('Gespeichert', { description: 'Teilnehmer wurde aktualisiert.' });
      } else {
        await LivingAppsService.createTeilnehmerEntry(fields);
        toast.success('Erstellt', { description: 'Neuer Teilnehmer wurde erstellt.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Teilnehmer bearbeiten' : 'Neuer Teilnehmer'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Bearbeite den Teilnehmer.' : 'Erstelle einen neuen Teilnehmer.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="t_vorname">Vorname *</Label>
              <Input id="t_vorname" value={vorname} onChange={e => setVorname(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t_nachname">Nachname *</Label>
              <Input id="t_nachname" value={nachname} onChange={e => setNachname(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="t_email">E-Mail</Label>
            <Input id="t_email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t_telefon">Telefon</Label>
            <Input id="t_telefon" type="tel" value={telefon} onChange={e => setTelefon(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t_geburtsdatum">Geburtsdatum</Label>
            <Input id="t_geburtsdatum" type="date" value={geburtsdatum} onChange={e => setGeburtsdatum(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
