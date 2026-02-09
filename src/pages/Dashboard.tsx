import { useState, useEffect, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Plus, Pencil, Trash2, Users, GraduationCap, DoorOpen,
  BookOpen, ClipboardList, AlertCircle, RefreshCw, Euro,
} from 'lucide-react';

// --- Helpers ---
function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '–';
  try {
    return format(parseISO(dateStr.split('T')[0]), 'dd.MM.yyyy', { locale: de });
  } catch {
    return dateStr;
  }
}

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '–';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
}

function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function isActiveKurs(k: Kurse): boolean {
  const today = todayStr();
  const start = k.fields.startdatum ?? '';
  const end = k.fields.enddatum ?? '9999-12-31';
  return start <= today && end >= today;
}

function isUpcomingKurs(k: Kurse): boolean {
  const today = todayStr();
  const end = k.fields.enddatum ?? '9999-12-31';
  return end >= today;
}

// --- Types for CRUD dialogs ---
type CrudMode = 'create' | 'edit';

// ============================================================
// MAIN DASHBOARD
// ============================================================
export default function Dashboard() {
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [dozenten, setDozenten] = useState<Dozenten[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState('kurse');

  // CRUD dialog states
  const [kursDialog, setKursDialog] = useState<{ open: boolean; mode: CrudMode; record: Kurse | null }>({ open: false, mode: 'create', record: null });
  const [anmeldungDialog, setAnmeldungDialog] = useState<{ open: boolean; mode: CrudMode; record: Anmeldungen | null }>({ open: false, mode: 'create', record: null });
  const [teilnehmerDialog, setTeilnehmerDialog] = useState<{ open: boolean; mode: CrudMode; record: Teilnehmer | null }>({ open: false, mode: 'create', record: null });
  const [dozentDialog, setDozentDialog] = useState<{ open: boolean; mode: CrudMode; record: Dozenten | null }>({ open: false, mode: 'create', record: null });
  const [raumDialog, setRaumDialog] = useState<{ open: boolean; mode: CrudMode; record: Raeume | null }>({ open: false, mode: 'create', record: null });

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; record: any; name: string }>({ open: false, type: '', record: null, name: '' });

  async function loadAll() {
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
      setError(err instanceof Error ? err : new Error('Daten konnten nicht geladen werden'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  // Lookup maps
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

  const kursMap = useMemo(() => {
    const m = new Map<string, Kurse>();
    kurse.forEach(k => m.set(k.record_id, k));
    return m;
  }, [kurse]);

  const teilnehmerMap = useMemo(() => {
    const m = new Map<string, Teilnehmer>();
    teilnehmer.forEach(t => m.set(t.record_id, t));
    return m;
  }, [teilnehmer]);

  // Computed KPIs
  const activeKurse = useMemo(() => kurse.filter(isActiveKurs), [kurse]);
  const upcomingKurse = useMemo(() =>
    kurse.filter(isUpcomingKurs).sort((a, b) => (a.fields.startdatum ?? '').localeCompare(b.fields.startdatum ?? '')),
    [kurse]
  );

  const anmeldungenByKurs = useMemo(() => {
    const m = new Map<string, number>();
    anmeldungen.forEach(a => {
      const kId = extractRecordId(a.fields.kurs);
      if (!kId) return;
      m.set(kId, (m.get(kId) ?? 0) + 1);
    });
    return m;
  }, [anmeldungen]);

  const totalAnmeldungen = anmeldungen.length;
  const unbezahlt = useMemo(() => anmeldungen.filter(a => a.fields.bezahlt !== true).length, [anmeldungen]);

  const avgPreis = useMemo(() => {
    const prices = kurse.map(k => k.fields.preis).filter((p): p is number => p != null);
    return prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  }, [kurse]);

  const utilization = useMemo(() => {
    let totalSpots = 0;
    let filledSpots = 0;
    activeKurse.forEach(k => {
      const max = k.fields.maximale_teilnehmer ?? 0;
      const filled = anmeldungenByKurs.get(k.record_id) ?? 0;
      totalSpots += max;
      filledSpots += filled;
    });
    return { totalSpots, filledSpots, pct: totalSpots > 0 ? Math.round((filledSpots / totalSpots) * 100) : 0 };
  }, [activeKurse, anmeldungenByKurs]);

  // Chart data: registrations per course
  const chartData = useMemo(() => {
    return kurse
      .map(k => ({
        name: (k.fields.titel ?? 'Unbenannt').substring(0, 18),
        count: anmeldungenByKurs.get(k.record_id) ?? 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [kurse, anmeldungenByKurs]);

  // Delete handler
  async function handleDelete() {
    const { type, record } = deleteDialog;
    if (!record) return;
    try {
      switch (type) {
        case 'kurse': await LivingAppsService.deleteKurseEntry(record.record_id); break;
        case 'anmeldungen': await LivingAppsService.deleteAnmeldungenEntry(record.record_id); break;
        case 'teilnehmer': await LivingAppsService.deleteTeilnehmerEntry(record.record_id); break;
        case 'dozenten': await LivingAppsService.deleteDozentenEntry(record.record_id); break;
        case 'raeume': await LivingAppsService.deleteRaeumeEntry(record.record_id); break;
      }
      toast.success('Geloscht', { description: `"${deleteDialog.name}" wurde geloscht.` });
      setDeleteDialog({ open: false, type: '', record: null, name: '' });
      loadAll();
    } catch {
      toast.error('Fehler', { description: 'Eintrag konnte nicht geloscht werden.' });
    }
  }

  function getDozentName(dozentUrl: string | undefined | null): string {
    const id = extractRecordId(dozentUrl);
    if (!id) return '–';
    const d = dozentMap.get(id);
    return d ? `${d.fields.vorname ?? ''} ${d.fields.nachname ?? ''}`.trim() : '–';
  }

  function getRaumName(raumUrl: string | undefined | null): string {
    const id = extractRecordId(raumUrl);
    if (!id) return '–';
    const r = raumMap.get(id);
    return r?.fields.raumname ?? '–';
  }

  function getKursTitle(kursUrl: string | undefined | null): string {
    const id = extractRecordId(kursUrl);
    if (!id) return '–';
    const k = kursMap.get(id);
    return k?.fields.titel ?? '–';
  }

  function getTeilnehmerName(tnUrl: string | undefined | null): string {
    const id = extractRecordId(tnUrl);
    if (!id) return '–';
    const t = teilnehmerMap.get(id);
    return t ? `${t.fields.vorname ?? ''} ${t.fields.nachname ?? ''}`.trim() : '–';
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-[1280px] mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Skeleton className="h-48 md:col-span-3" />
            <div className="md:col-span-2 grid grid-cols-2 gap-3">
              <Skeleton className="h-[90px]" />
              <Skeleton className="h-[90px]" />
              <Skeleton className="h-[90px]" />
              <Skeleton className="h-[90px]" />
            </div>
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold">Fehler beim Laden</h2>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button onClick={loadAll} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" /> Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 md:px-8 py-4">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Kursverwaltung</h1>
          <Button
            onClick={() => setAnmeldungDialog({ open: true, mode: 'create', record: null })}
            className="hidden md:inline-flex"
          >
            <Plus className="h-4 w-4 mr-2" /> Neue Anmeldung
          </Button>
          <Button
            size="icon"
            className="md:hidden"
            onClick={() => setAnmeldungDialog({ open: true, mode: 'create', record: null })}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="px-4 md:px-8 py-6">
        <div className="max-w-[1280px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

          {/* Row 1: Hero + KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Hero Card */}
            <Card className="lg:col-span-3 border-l-4 border-l-primary shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Aktive Kurse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-5xl font-bold tracking-tight">{activeKurse.length}</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Auslastung</span>
                    <span className="font-semibold text-foreground">{utilization.pct}%</span>
                  </div>
                  <Progress value={utilization.pct} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {utilization.filledSpots} von {utilization.totalSpots} Platzen belegt
                  </p>
                </div>
                {/* Mini upcoming course list */}
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nachste Kurse</p>
                  {upcomingKurse.slice(0, 3).map(k => {
                    const count = anmeldungenByKurs.get(k.record_id) ?? 0;
                    const max = k.fields.maximale_teilnehmer ?? 0;
                    return (
                      <div
                        key={k.record_id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => setKursDialog({ open: true, mode: 'edit', record: k })}
                      >
                        <div>
                          <div className="text-sm font-medium">{k.fields.titel ?? 'Unbenannt'}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(k.fields.startdatum)} – {getDozentName(k.fields.dozent)}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {count}/{max} Platze
                        </Badge>
                      </div>
                    );
                  })}
                  {upcomingKurse.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">Keine kommenden Kurse</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-3">
              <Card className="hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5" /> Anmeldungen
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-bold">{totalAnmeldungen}</div>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow cursor-pointer"
                onClick={() => setActiveTab('anmeldungen')}
              >
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" /> Unbezahlt
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-bold text-destructive">{unbezahlt}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Euro className="h-3.5 w-3.5" /> Durchschn. Preis
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-bold">{formatCurrency(avgPreis)}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" /> Dozenten
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-bold">{dozenten.length}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Chart: Anmeldungen pro Kurs */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Anmeldungen pro Kurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(215 15% 50%)" />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        stroke="hsl(215 15% 50%)"
                        width={130}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0 0% 100%)',
                          border: '1px solid hsl(214 20% 90%)',
                          borderRadius: '8px',
                          fontSize: '13px',
                        }}
                        formatter={(value: number) => [`${value} Anmeldungen`, 'Anzahl']}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill="hsl(172 66% 30%)" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Row 2: Tabbed Data Management */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full md:w-auto overflow-x-auto">
              <TabsTrigger value="kurse" className="gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Kurse
              </TabsTrigger>
              <TabsTrigger value="anmeldungen" className="gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" /> Anmeldungen
              </TabsTrigger>
              <TabsTrigger value="teilnehmer" className="gap-1.5">
                <Users className="h-3.5 w-3.5" /> Teilnehmer
              </TabsTrigger>
              <TabsTrigger value="dozenten" className="gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" /> Dozenten
              </TabsTrigger>
              <TabsTrigger value="raeume" className="gap-1.5">
                <DoorOpen className="h-3.5 w-3.5" /> Raume
              </TabsTrigger>
            </TabsList>

            {/* KURSE TAB */}
            <TabsContent value="kurse">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Alle Kurse</CardTitle>
                  <Button size="sm" onClick={() => setKursDialog({ open: true, mode: 'create', record: null })}>
                    <Plus className="h-4 w-4 mr-1" /> Neuen Kurs erstellen
                  </Button>
                </CardHeader>
                <CardContent>
                  {kurse.length === 0 ? (
                    <EmptyState icon={BookOpen} message="Noch keine Kurse vorhanden" actionLabel="Ersten Kurs erstellen" onAction={() => setKursDialog({ open: true, mode: 'create', record: null })} />
                  ) : (
                    <>
                      {/* Mobile cards */}
                      <div className="md:hidden space-y-3">
                        {[...kurse].sort((a, b) => (b.fields.startdatum ?? '').localeCompare(a.fields.startdatum ?? '')).map(k => (
                          <div key={k.record_id} className="p-3 rounded-lg border space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm">{k.fields.titel ?? 'Unbenannt'}</span>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setKursDialog({ open: true, mode: 'edit', record: k })}><Pencil className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteDialog({ open: true, type: 'kurse', record: k, name: k.fields.titel ?? '' })}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">{formatDate(k.fields.startdatum)} – {formatDate(k.fields.enddatum)}</div>
                            <div className="text-xs text-muted-foreground">{getDozentName(k.fields.dozent)}</div>
                            <Badge variant="secondary" className="text-xs">{anmeldungenByKurs.get(k.record_id) ?? 0}/{k.fields.maximale_teilnehmer ?? 0} Platze</Badge>
                          </div>
                        ))}
                      </div>
                      {/* Desktop table */}
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Kurstitel</TableHead>
                              <TableHead>Startdatum</TableHead>
                              <TableHead>Enddatum</TableHead>
                              <TableHead>Dozent</TableHead>
                              <TableHead>Raum</TableHead>
                              <TableHead className="text-right">Preis</TableHead>
                              <TableHead className="text-center">Anmeldungen</TableHead>
                              <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...kurse].sort((a, b) => (b.fields.startdatum ?? '').localeCompare(a.fields.startdatum ?? '')).map(k => (
                              <TableRow key={k.record_id} className="hover:bg-muted/50">
                                <TableCell className="font-medium">{k.fields.titel ?? 'Unbenannt'}</TableCell>
                                <TableCell>{formatDate(k.fields.startdatum)}</TableCell>
                                <TableCell>{formatDate(k.fields.enddatum)}</TableCell>
                                <TableCell>{getDozentName(k.fields.dozent)}</TableCell>
                                <TableCell>{getRaumName(k.fields.raum)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(k.fields.preis)}</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="secondary">{anmeldungenByKurs.get(k.record_id) ?? 0}/{k.fields.maximale_teilnehmer ?? 0}</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setKursDialog({ open: true, mode: 'edit', record: k })}><Pencil className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, type: 'kurse', record: k, name: k.fields.titel ?? '' })}><Trash2 className="h-3.5 w-3.5" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ANMELDUNGEN TAB */}
            <TabsContent value="anmeldungen">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Alle Anmeldungen</CardTitle>
                  <Button size="sm" onClick={() => setAnmeldungDialog({ open: true, mode: 'create', record: null })}>
                    <Plus className="h-4 w-4 mr-1" /> Neue Anmeldung
                  </Button>
                </CardHeader>
                <CardContent>
                  {anmeldungen.length === 0 ? (
                    <EmptyState icon={ClipboardList} message="Noch keine Anmeldungen vorhanden" actionLabel="Erste Anmeldung erstellen" onAction={() => setAnmeldungDialog({ open: true, mode: 'create', record: null })} />
                  ) : (
                    <>
                      <div className="md:hidden space-y-3">
                        {[...anmeldungen].sort((a, b) => (b.fields.anmeldedatum ?? '').localeCompare(a.fields.anmeldedatum ?? '')).map(a => (
                          <div key={a.record_id} className="p-3 rounded-lg border space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm">{getTeilnehmerName(a.fields.teilnehmer)}</span>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAnmeldungDialog({ open: true, mode: 'edit', record: a })}><Pencil className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteDialog({ open: true, type: 'anmeldungen', record: a, name: getTeilnehmerName(a.fields.teilnehmer) })}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">{getKursTitle(a.fields.kurs)}</div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{formatDate(a.fields.anmeldedatum)}</span>
                              {a.fields.bezahlt ? (
                                <Badge className="bg-[hsl(152,60%,40%)] text-white text-xs">Bezahlt</Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs">Offen</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Teilnehmer</TableHead>
                              <TableHead>Kurs</TableHead>
                              <TableHead>Anmeldedatum</TableHead>
                              <TableHead className="text-center">Bezahlt</TableHead>
                              <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...anmeldungen].sort((a, b) => (b.fields.anmeldedatum ?? '').localeCompare(a.fields.anmeldedatum ?? '')).map(a => (
                              <TableRow key={a.record_id} className="hover:bg-muted/50">
                                <TableCell className="font-medium">{getTeilnehmerName(a.fields.teilnehmer)}</TableCell>
                                <TableCell>{getKursTitle(a.fields.kurs)}</TableCell>
                                <TableCell>{formatDate(a.fields.anmeldedatum)}</TableCell>
                                <TableCell className="text-center">
                                  {a.fields.bezahlt ? (
                                    <Badge className="bg-[hsl(152,60%,40%)] text-white">Bezahlt</Badge>
                                  ) : (
                                    <Badge variant="destructive">Offen</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAnmeldungDialog({ open: true, mode: 'edit', record: a })}><Pencil className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, type: 'anmeldungen', record: a, name: getTeilnehmerName(a.fields.teilnehmer) })}><Trash2 className="h-3.5 w-3.5" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TEILNEHMER TAB */}
            <TabsContent value="teilnehmer">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Alle Teilnehmer</CardTitle>
                  <Button size="sm" onClick={() => setTeilnehmerDialog({ open: true, mode: 'create', record: null })}>
                    <Plus className="h-4 w-4 mr-1" /> Neuen Teilnehmer erstellen
                  </Button>
                </CardHeader>
                <CardContent>
                  {teilnehmer.length === 0 ? (
                    <EmptyState icon={Users} message="Noch keine Teilnehmer vorhanden" actionLabel="Ersten Teilnehmer erstellen" onAction={() => setTeilnehmerDialog({ open: true, mode: 'create', record: null })} />
                  ) : (
                    <>
                      <div className="md:hidden space-y-3">
                        {[...teilnehmer].sort((a, b) => (a.fields.nachname ?? '').localeCompare(b.fields.nachname ?? '')).map(t => (
                          <div key={t.record_id} className="p-3 rounded-lg border flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{t.fields.vorname} {t.fields.nachname}</div>
                              <div className="text-xs text-muted-foreground">{t.fields.email ?? ''}</div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setTeilnehmerDialog({ open: true, mode: 'edit', record: t })}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteDialog({ open: true, type: 'teilnehmer', record: t, name: `${t.fields.vorname ?? ''} ${t.fields.nachname ?? ''}` })}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Vorname</TableHead>
                              <TableHead>Nachname</TableHead>
                              <TableHead>E-Mail</TableHead>
                              <TableHead>Telefon</TableHead>
                              <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...teilnehmer].sort((a, b) => (a.fields.nachname ?? '').localeCompare(b.fields.nachname ?? '')).map(t => (
                              <TableRow key={t.record_id} className="hover:bg-muted/50">
                                <TableCell>{t.fields.vorname ?? '–'}</TableCell>
                                <TableCell className="font-medium">{t.fields.nachname ?? '–'}</TableCell>
                                <TableCell>{t.fields.email ?? '–'}</TableCell>
                                <TableCell>{t.fields.telefon ?? '–'}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setTeilnehmerDialog({ open: true, mode: 'edit', record: t })}><Pencil className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, type: 'teilnehmer', record: t, name: `${t.fields.vorname ?? ''} ${t.fields.nachname ?? ''}` })}><Trash2 className="h-3.5 w-3.5" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* DOZENTEN TAB */}
            <TabsContent value="dozenten">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Alle Dozenten</CardTitle>
                  <Button size="sm" onClick={() => setDozentDialog({ open: true, mode: 'create', record: null })}>
                    <Plus className="h-4 w-4 mr-1" /> Neuen Dozenten erstellen
                  </Button>
                </CardHeader>
                <CardContent>
                  {dozenten.length === 0 ? (
                    <EmptyState icon={GraduationCap} message="Noch keine Dozenten vorhanden" actionLabel="Ersten Dozenten erstellen" onAction={() => setDozentDialog({ open: true, mode: 'create', record: null })} />
                  ) : (
                    <>
                      <div className="md:hidden space-y-3">
                        {[...dozenten].sort((a, b) => (a.fields.nachname ?? '').localeCompare(b.fields.nachname ?? '')).map(d => (
                          <div key={d.record_id} className="p-3 rounded-lg border flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{d.fields.vorname} {d.fields.nachname}</div>
                              <div className="text-xs text-muted-foreground">{d.fields.fachgebiet ?? ''}</div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDozentDialog({ open: true, mode: 'edit', record: d })}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteDialog({ open: true, type: 'dozenten', record: d, name: `${d.fields.vorname ?? ''} ${d.fields.nachname ?? ''}` })}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Vorname</TableHead>
                              <TableHead>Nachname</TableHead>
                              <TableHead>E-Mail</TableHead>
                              <TableHead>Telefon</TableHead>
                              <TableHead>Fachgebiet</TableHead>
                              <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...dozenten].sort((a, b) => (a.fields.nachname ?? '').localeCompare(b.fields.nachname ?? '')).map(d => (
                              <TableRow key={d.record_id} className="hover:bg-muted/50">
                                <TableCell>{d.fields.vorname ?? '–'}</TableCell>
                                <TableCell className="font-medium">{d.fields.nachname ?? '–'}</TableCell>
                                <TableCell>{d.fields.email ?? '–'}</TableCell>
                                <TableCell>{d.fields.telefon ?? '–'}</TableCell>
                                <TableCell>{d.fields.fachgebiet ?? '–'}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDozentDialog({ open: true, mode: 'edit', record: d })}><Pencil className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, type: 'dozenten', record: d, name: `${d.fields.vorname ?? ''} ${d.fields.nachname ?? ''}` })}><Trash2 className="h-3.5 w-3.5" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* RAEUME TAB */}
            <TabsContent value="raeume">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Alle Raume</CardTitle>
                  <Button size="sm" onClick={() => setRaumDialog({ open: true, mode: 'create', record: null })}>
                    <Plus className="h-4 w-4 mr-1" /> Neuen Raum erstellen
                  </Button>
                </CardHeader>
                <CardContent>
                  {raeume.length === 0 ? (
                    <EmptyState icon={DoorOpen} message="Noch keine Raume vorhanden" actionLabel="Ersten Raum erstellen" onAction={() => setRaumDialog({ open: true, mode: 'create', record: null })} />
                  ) : (
                    <>
                      <div className="md:hidden space-y-3">
                        {[...raeume].sort((a, b) => (a.fields.raumname ?? '').localeCompare(b.fields.raumname ?? '')).map(r => (
                          <div key={r.record_id} className="p-3 rounded-lg border flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{r.fields.raumname ?? 'Unbenannt'}</div>
                              <div className="text-xs text-muted-foreground">{r.fields.gebaeude ?? ''} · Kapazitat: {r.fields.kapazitaet ?? '–'}</div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRaumDialog({ open: true, mode: 'edit', record: r })}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteDialog({ open: true, type: 'raeume', record: r, name: r.fields.raumname ?? '' })}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Raumname</TableHead>
                              <TableHead>Gebaude</TableHead>
                              <TableHead className="text-right">Kapazitat</TableHead>
                              <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...raeume].sort((a, b) => (a.fields.raumname ?? '').localeCompare(b.fields.raumname ?? '')).map(r => (
                              <TableRow key={r.record_id} className="hover:bg-muted/50">
                                <TableCell className="font-medium">{r.fields.raumname ?? '–'}</TableCell>
                                <TableCell>{r.fields.gebaeude ?? '–'}</TableCell>
                                <TableCell className="text-right">{r.fields.kapazitaet ?? '–'}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRaumDialog({ open: true, mode: 'edit', record: r })}><Pencil className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, type: 'raeume', record: r, name: r.fields.raumname ?? '' })}><Trash2 className="h-3.5 w-3.5" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Mobile fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t md:hidden">
        <Button
          className="w-full h-14 text-base rounded-xl"
          onClick={() => setAnmeldungDialog({ open: true, mode: 'create', record: null })}
        >
          <Plus className="h-5 w-5 mr-2" /> Neue Anmeldung
        </Button>
      </div>
      {/* Spacer for fixed bottom button on mobile */}
      <div className="h-24 md:hidden" />

      {/* ============ CRUD DIALOGS ============ */}

      {/* Kurs Dialog */}
      <KursFormDialog
        open={kursDialog.open}
        mode={kursDialog.mode}
        record={kursDialog.record}
        dozenten={dozenten}
        raeume={raeume}
        onClose={() => setKursDialog({ open: false, mode: 'create', record: null })}
        onSuccess={loadAll}
      />

      {/* Anmeldung Dialog */}
      <AnmeldungFormDialog
        open={anmeldungDialog.open}
        mode={anmeldungDialog.mode}
        record={anmeldungDialog.record}
        kurse={kurse}
        teilnehmer={teilnehmer}
        onClose={() => setAnmeldungDialog({ open: false, mode: 'create', record: null })}
        onSuccess={loadAll}
      />

      {/* Teilnehmer Dialog */}
      <TeilnehmerFormDialog
        open={teilnehmerDialog.open}
        mode={teilnehmerDialog.mode}
        record={teilnehmerDialog.record}
        onClose={() => setTeilnehmerDialog({ open: false, mode: 'create', record: null })}
        onSuccess={loadAll}
      />

      {/* Dozent Dialog */}
      <DozentFormDialog
        open={dozentDialog.open}
        mode={dozentDialog.mode}
        record={dozentDialog.record}
        onClose={() => setDozentDialog({ open: false, mode: 'create', record: null })}
        onSuccess={loadAll}
      />

      {/* Raum Dialog */}
      <RaumFormDialog
        open={raumDialog.open}
        mode={raumDialog.mode}
        record={raumDialog.record}
        onClose={() => setRaumDialog({ open: false, mode: 'create', record: null })}
        onSuccess={loadAll}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, type: '', record: null, name: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag loschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Mochtest du &quot;{deleteDialog.name}&quot; wirklich loschen? Diese Aktion kann nicht ruckgangig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Loschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================
function EmptyState({ icon: Icon, message, actionLabel, onAction }: {
  icon: React.ElementType;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="text-center py-12 space-y-3">
      <Icon className="h-10 w-10 text-muted-foreground mx-auto" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onAction}>
        <Plus className="h-4 w-4 mr-1" /> {actionLabel}
      </Button>
    </div>
  );
}

// ============================================================
// KURS FORM DIALOG
// ============================================================
function KursFormDialog({ open, mode, record, dozenten, raeume, onClose, onSuccess }: {
  open: boolean;
  mode: CrudMode;
  record: Kurse | null;
  dozenten: Dozenten[];
  raeume: Raeume[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    titel: '',
    beschreibung: '',
    startdatum: '',
    enddatum: '',
    maximale_teilnehmer: '',
    preis: '',
    dozent: 'none',
    raum: 'none',
  });

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && record) {
        setForm({
          titel: record.fields.titel ?? '',
          beschreibung: record.fields.beschreibung ?? '',
          startdatum: record.fields.startdatum?.split('T')[0] ?? '',
          enddatum: record.fields.enddatum?.split('T')[0] ?? '',
          maximale_teilnehmer: record.fields.maximale_teilnehmer?.toString() ?? '',
          preis: record.fields.preis?.toString() ?? '',
          dozent: extractRecordId(record.fields.dozent) ?? 'none',
          raum: extractRecordId(record.fields.raum) ?? 'none',
        });
      } else {
        setForm({ titel: '', beschreibung: '', startdatum: '', enddatum: '', maximale_teilnehmer: '', preis: '', dozent: 'none', raum: 'none' });
      }
    }
  }, [open, mode, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Kurse['fields'] = {
        titel: form.titel,
        beschreibung: form.beschreibung || undefined,
        startdatum: form.startdatum || undefined,
        enddatum: form.enddatum || undefined,
        maximale_teilnehmer: form.maximale_teilnehmer ? Number(form.maximale_teilnehmer) : undefined,
        preis: form.preis ? Number(form.preis) : undefined,
        dozent: form.dozent !== 'none' ? createRecordUrl(APP_IDS.DOZENTEN, form.dozent) : undefined,
        raum: form.raum !== 'none' ? createRecordUrl(APP_IDS.RAEUME, form.raum) : undefined,
      };
      if (mode === 'edit' && record) {
        await LivingAppsService.updateKurseEntry(record.record_id, fields);
        toast.success('Gespeichert', { description: 'Kurs wurde aktualisiert.' });
      } else {
        await LivingAppsService.createKurseEntry(fields);
        toast.success('Erstellt', { description: 'Neuer Kurs wurde erstellt.' });
      }
      onClose();
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `Fehler beim ${mode === 'edit' ? 'Speichern' : 'Erstellen'}: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Kurs bearbeiten' : 'Neuen Kurs erstellen'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Bearbeite die Kursdaten.' : 'Erstelle einen neuen Kurs.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kurs-titel">Kurstitel *</Label>
            <Input id="kurs-titel" value={form.titel} onChange={e => setForm(p => ({ ...p, titel: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kurs-beschreibung">Beschreibung</Label>
            <Textarea id="kurs-beschreibung" value={form.beschreibung} onChange={e => setForm(p => ({ ...p, beschreibung: e.target.value }))} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="kurs-start">Startdatum</Label>
              <Input id="kurs-start" type="date" value={form.startdatum} onChange={e => setForm(p => ({ ...p, startdatum: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kurs-ende">Enddatum</Label>
              <Input id="kurs-ende" type="date" value={form.enddatum} onChange={e => setForm(p => ({ ...p, enddatum: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="kurs-max">Max. Teilnehmer</Label>
              <Input id="kurs-max" type="number" min="0" value={form.maximale_teilnehmer} onChange={e => setForm(p => ({ ...p, maximale_teilnehmer: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kurs-preis">Preis (EUR)</Label>
              <Input id="kurs-preis" type="number" min="0" step="0.01" value={form.preis} onChange={e => setForm(p => ({ ...p, preis: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Dozent</Label>
            <Select value={form.dozent} onValueChange={v => setForm(p => ({ ...p, dozent: v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Dozent wahlen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Dozent</SelectItem>
                {dozenten.map(d => (
                  <SelectItem key={d.record_id} value={d.record_id}>
                    {d.fields.vorname} {d.fields.nachname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Raum</Label>
            <Select value={form.raum} onValueChange={v => setForm(p => ({ ...p, raum: v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Raum wahlen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Raum</SelectItem>
                {raeume.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.raumname} {r.fields.gebaeude ? `(${r.fields.gebaeude})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichert...' : (mode === 'edit' ? 'Speichern' : 'Erstellen')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// ANMELDUNG FORM DIALOG
// ============================================================
function AnmeldungFormDialog({ open, mode, record, kurse, teilnehmer, onClose, onSuccess }: {
  open: boolean;
  mode: CrudMode;
  record: Anmeldungen | null;
  kurse: Kurse[];
  teilnehmer: Teilnehmer[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    teilnehmer_id: 'none',
    kurs_id: 'none',
    anmeldedatum: todayStr(),
    bezahlt: false,
  });

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && record) {
        setForm({
          teilnehmer_id: extractRecordId(record.fields.teilnehmer) ?? 'none',
          kurs_id: extractRecordId(record.fields.kurs) ?? 'none',
          anmeldedatum: record.fields.anmeldedatum?.split('T')[0] ?? todayStr(),
          bezahlt: record.fields.bezahlt ?? false,
        });
      } else {
        setForm({ teilnehmer_id: 'none', kurs_id: 'none', anmeldedatum: todayStr(), bezahlt: false });
      }
    }
  }, [open, mode, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.teilnehmer_id === 'none' || form.kurs_id === 'none') {
      toast.error('Fehler', { description: 'Bitte wahle einen Teilnehmer und einen Kurs aus.' });
      return;
    }
    setSubmitting(true);
    try {
      const fields: Anmeldungen['fields'] = {
        teilnehmer: createRecordUrl(APP_IDS.TEILNEHMER, form.teilnehmer_id),
        kurs: createRecordUrl(APP_IDS.KURSE, form.kurs_id),
        anmeldedatum: form.anmeldedatum || undefined,
        bezahlt: form.bezahlt,
      };
      if (mode === 'edit' && record) {
        await LivingAppsService.updateAnmeldungenEntry(record.record_id, fields);
        toast.success('Gespeichert', { description: 'Anmeldung wurde aktualisiert.' });
      } else {
        await LivingAppsService.createAnmeldungenEntry(fields);
        toast.success('Erstellt', { description: 'Neue Anmeldung wurde erstellt.' });
      }
      onClose();
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Anmeldung bearbeiten' : 'Neue Anmeldung'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Bearbeite die Anmeldung.' : 'Registriere einen Teilnehmer fur einen Kurs.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Teilnehmer *</Label>
            <Select value={form.teilnehmer_id} onValueChange={v => setForm(p => ({ ...p, teilnehmer_id: v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Teilnehmer wahlen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">– Bitte wahlen –</SelectItem>
                {teilnehmer.map(t => (
                  <SelectItem key={t.record_id} value={t.record_id}>
                    {t.fields.vorname} {t.fields.nachname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kurs *</Label>
            <Select value={form.kurs_id} onValueChange={v => setForm(p => ({ ...p, kurs_id: v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Kurs wahlen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">– Bitte wahlen –</SelectItem>
                {kurse.map(k => (
                  <SelectItem key={k.record_id} value={k.record_id}>
                    {k.fields.titel ?? 'Unbenannt'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="anm-datum">Anmeldedatum</Label>
            <Input id="anm-datum" type="date" value={form.anmeldedatum} onChange={e => setForm(p => ({ ...p, anmeldedatum: e.target.value }))} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anm-bezahlt"
              checked={form.bezahlt}
              onCheckedChange={(checked) => setForm(p => ({ ...p, bezahlt: checked === true }))}
            />
            <Label htmlFor="anm-bezahlt">Bezahlt</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichert...' : (mode === 'edit' ? 'Speichern' : 'Erstellen')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// TEILNEHMER FORM DIALOG
// ============================================================
function TeilnehmerFormDialog({ open, mode, record, onClose, onSuccess }: {
  open: boolean;
  mode: CrudMode;
  record: Teilnehmer | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    vorname: '',
    nachname: '',
    email: '',
    telefon: '',
    geburtsdatum: '',
  });

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && record) {
        setForm({
          vorname: record.fields.vorname ?? '',
          nachname: record.fields.nachname ?? '',
          email: record.fields.email ?? '',
          telefon: record.fields.telefon ?? '',
          geburtsdatum: record.fields.geburtsdatum?.split('T')[0] ?? '',
        });
      } else {
        setForm({ vorname: '', nachname: '', email: '', telefon: '', geburtsdatum: '' });
      }
    }
  }, [open, mode, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Teilnehmer['fields'] = {
        vorname: form.vorname,
        nachname: form.nachname,
        email: form.email || undefined,
        telefon: form.telefon || undefined,
        geburtsdatum: form.geburtsdatum || undefined,
      };
      if (mode === 'edit' && record) {
        await LivingAppsService.updateTeilnehmerEntry(record.record_id, fields);
        toast.success('Gespeichert', { description: 'Teilnehmer wurde aktualisiert.' });
      } else {
        await LivingAppsService.createTeilnehmerEntry(fields);
        toast.success('Erstellt', { description: 'Neuer Teilnehmer wurde erstellt.' });
      }
      onClose();
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Teilnehmer bearbeiten' : 'Neuen Teilnehmer erstellen'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Bearbeite die Teilnehmerdaten.' : 'Erstelle einen neuen Teilnehmer.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tn-vorname">Vorname *</Label>
              <Input id="tn-vorname" value={form.vorname} onChange={e => setForm(p => ({ ...p, vorname: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tn-nachname">Nachname *</Label>
              <Input id="tn-nachname" value={form.nachname} onChange={e => setForm(p => ({ ...p, nachname: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tn-email">E-Mail</Label>
            <Input id="tn-email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tn-telefon">Telefon</Label>
            <Input id="tn-telefon" type="tel" value={form.telefon} onChange={e => setForm(p => ({ ...p, telefon: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tn-geb">Geburtsdatum</Label>
            <Input id="tn-geb" type="date" value={form.geburtsdatum} onChange={e => setForm(p => ({ ...p, geburtsdatum: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichert...' : (mode === 'edit' ? 'Speichern' : 'Erstellen')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// DOZENT FORM DIALOG
// ============================================================
function DozentFormDialog({ open, mode, record, onClose, onSuccess }: {
  open: boolean;
  mode: CrudMode;
  record: Dozenten | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    vorname: '',
    nachname: '',
    email: '',
    telefon: '',
    fachgebiet: '',
  });

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && record) {
        setForm({
          vorname: record.fields.vorname ?? '',
          nachname: record.fields.nachname ?? '',
          email: record.fields.email ?? '',
          telefon: record.fields.telefon ?? '',
          fachgebiet: record.fields.fachgebiet ?? '',
        });
      } else {
        setForm({ vorname: '', nachname: '', email: '', telefon: '', fachgebiet: '' });
      }
    }
  }, [open, mode, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Dozenten['fields'] = {
        vorname: form.vorname,
        nachname: form.nachname,
        email: form.email || undefined,
        telefon: form.telefon || undefined,
        fachgebiet: form.fachgebiet || undefined,
      };
      if (mode === 'edit' && record) {
        await LivingAppsService.updateDozentenEntry(record.record_id, fields);
        toast.success('Gespeichert', { description: 'Dozent wurde aktualisiert.' });
      } else {
        await LivingAppsService.createDozentenEntry(fields);
        toast.success('Erstellt', { description: 'Neuer Dozent wurde erstellt.' });
      }
      onClose();
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Dozent bearbeiten' : 'Neuen Dozenten erstellen'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Bearbeite die Dozentendaten.' : 'Erstelle einen neuen Dozenten.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="doz-vorname">Vorname *</Label>
              <Input id="doz-vorname" value={form.vorname} onChange={e => setForm(p => ({ ...p, vorname: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doz-nachname">Nachname *</Label>
              <Input id="doz-nachname" value={form.nachname} onChange={e => setForm(p => ({ ...p, nachname: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="doz-email">E-Mail</Label>
            <Input id="doz-email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doz-telefon">Telefon</Label>
            <Input id="doz-telefon" type="tel" value={form.telefon} onChange={e => setForm(p => ({ ...p, telefon: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doz-fach">Fachgebiet</Label>
            <Input id="doz-fach" value={form.fachgebiet} onChange={e => setForm(p => ({ ...p, fachgebiet: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichert...' : (mode === 'edit' ? 'Speichern' : 'Erstellen')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// RAUM FORM DIALOG
// ============================================================
function RaumFormDialog({ open, mode, record, onClose, onSuccess }: {
  open: boolean;
  mode: CrudMode;
  record: Raeume | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    raumname: '',
    gebaeude: '',
    kapazitaet: '',
  });

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && record) {
        setForm({
          raumname: record.fields.raumname ?? '',
          gebaeude: record.fields.gebaeude ?? '',
          kapazitaet: record.fields.kapazitaet?.toString() ?? '',
        });
      } else {
        setForm({ raumname: '', gebaeude: '', kapazitaet: '' });
      }
    }
  }, [open, mode, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Raeume['fields'] = {
        raumname: form.raumname,
        gebaeude: form.gebaeude || undefined,
        kapazitaet: form.kapazitaet ? Number(form.kapazitaet) : undefined,
      };
      if (mode === 'edit' && record) {
        await LivingAppsService.updateRaeumeEntry(record.record_id, fields);
        toast.success('Gespeichert', { description: 'Raum wurde aktualisiert.' });
      } else {
        await LivingAppsService.createRaeumeEntry(fields);
        toast.success('Erstellt', { description: 'Neuer Raum wurde erstellt.' });
      }
      onClose();
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Raum bearbeiten' : 'Neuen Raum erstellen'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Bearbeite die Raumdaten.' : 'Erstelle einen neuen Raum.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="raum-name">Raumname *</Label>
            <Input id="raum-name" value={form.raumname} onChange={e => setForm(p => ({ ...p, raumname: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="raum-geb">Gebaude</Label>
            <Input id="raum-geb" value={form.gebaeude} onChange={e => setForm(p => ({ ...p, gebaeude: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="raum-kap">Kapazitat</Label>
            <Input id="raum-kap" type="number" min="0" value={form.kapazitaet} onChange={e => setForm(p => ({ ...p, kapazitaet: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichert...' : (mode === 'edit' ? 'Speichern' : 'Erstellen')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
