import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Dozenten, Raeume, Teilnehmer, Kurse, Anmeldungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { format, parseISO, isWithinInterval, isValid } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import {
  BookOpen,
  Users,
  Euro,
  AlertCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '–';
  try {
    const d = parseISO(dateStr.split('T')[0]);
    if (!isValid(d)) return '–';
    return format(d, 'dd.MM.yyyy', { locale: de });
  } catch {
    return '–';
  }
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

// ---------------------------------------------------------------------------
// Semicircular Gauge Component
// ---------------------------------------------------------------------------

function SemiGauge({
  percentage,
  size = 200,
  strokeWidth = 6,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const clamped = Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Arc from 180deg to 0deg (left to right, semicircle on top)
  const startAngle = Math.PI;
  const endAngle = 0;
  const sweepAngle = startAngle - endAngle;
  const filledAngle = startAngle - (sweepAngle * clamped) / 100;

  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy - radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy - radius * Math.sin(endAngle);
  const xF = cx + radius * Math.cos(filledAngle);
  const yF = cy - radius * Math.sin(filledAngle);

  const largeArcBg = 1;
  const largeArcFilled = clamped > 50 ? 1 : 0;

  const bgPath = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcBg} 1 ${x2} ${y2}`;
  const filledPath =
    clamped > 0
      ? `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFilled} 1 ${xF} ${yF}`
      : '';

  return (
    <svg
      width={size}
      height={size / 2 + strokeWidth}
      viewBox={`0 ${cy - radius - strokeWidth} ${size} ${radius + strokeWidth * 2}`}
      className="mx-auto"
    >
      <path
        d={bgPath}
        fill="none"
        stroke="var(--muted)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {filledPath && (
        <path
          d={filledPath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40 hidden md:block" />
        </div>
        {/* Hero + stats row */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 mb-6">
          <Skeleton className="h-64 rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-[58px] rounded-xl" />
            <Skeleton className="h-[58px] rounded-xl" />
            <Skeleton className="h-[58px] rounded-xl" />
            <Skeleton className="h-[58px] rounded-xl" />
          </div>
        </div>
        {/* Chart + list row */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 mb-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center px-4"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <Card className="max-w-md w-full text-center py-12 px-6">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Fehler beim Laden</h2>
        <p className="text-muted-foreground mb-6 text-sm">{error.message}</p>
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Erneut versuchen
        </Button>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Neue Anmeldung Dialog
// ---------------------------------------------------------------------------

function NeueAnmeldungDialog({
  teilnehmerList,
  kurseList,
  open,
  onOpenChange,
  onSuccess,
}: {
  teilnehmerList: Teilnehmer[];
  kurseList: Kurse[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [selectedTeilnehmer, setSelectedTeilnehmer] = useState('');
  const [selectedKurs, setSelectedKurs] = useState('');
  const [anmeldedatum, setAnmeldedatum] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [bezahlt, setBezahlt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!selectedTeilnehmer || !selectedKurs) {
      setFormError('Bitte Teilnehmer und Kurs auswählen.');
      return;
    }

    setSubmitting(true);
    try {
      await LivingAppsService.createAnmeldungenEntry({
        teilnehmer: createRecordUrl(APP_IDS.TEILNEHMER, selectedTeilnehmer),
        kurs: createRecordUrl(APP_IDS.KURSE, selectedKurs),
        anmeldedatum,
        bezahlt,
      });
      toast.success('Anmeldung erfolgreich erstellt');
      setSelectedTeilnehmer('');
      setSelectedKurs('');
      setAnmeldedatum(format(new Date(), 'yyyy-MM-dd'));
      setBezahlt(false);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unbekannter Fehler'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Anmeldung</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="teilnehmer">Teilnehmer</Label>
            <Select
              value={selectedTeilnehmer || 'placeholder'}
              onValueChange={(v) =>
                setSelectedTeilnehmer(v === 'placeholder' ? '' : v)
              }
            >
              <SelectTrigger id="teilnehmer">
                <SelectValue placeholder="Teilnehmer wählen…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder" disabled>
                  Teilnehmer wählen…
                </SelectItem>
                {teilnehmerList
                  .sort((a, b) =>
                    (a.fields.nachname || '').localeCompare(
                      b.fields.nachname || ''
                    )
                  )
                  .map((t) => (
                    <SelectItem key={t.record_id} value={t.record_id}>
                      {t.fields.vorname} {t.fields.nachname}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kurs">Kurs</Label>
            <Select
              value={selectedKurs || 'placeholder'}
              onValueChange={(v) =>
                setSelectedKurs(v === 'placeholder' ? '' : v)
              }
            >
              <SelectTrigger id="kurs">
                <SelectValue placeholder="Kurs wählen…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder" disabled>
                  Kurs wählen…
                </SelectItem>
                {kurseList
                  .sort((a, b) =>
                    (a.fields.titel || '').localeCompare(b.fields.titel || '')
                  )
                  .map((k) => (
                    <SelectItem key={k.record_id} value={k.record_id}>
                      {k.fields.titel}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="anmeldedatum">Anmeldedatum</Label>
            <Input
              id="anmeldedatum"
              type="date"
              value={anmeldedatum}
              onChange={(e) => setAnmeldedatum(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="bezahlt"
              checked={bezahlt}
              onCheckedChange={(v) => setBezahlt(v === true)}
            />
            <Label htmlFor="bezahlt" className="cursor-pointer">
              Bezahlt
            </Label>
          </div>

          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Speichern…' : 'Anmeldung speichern'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const [dozenten, setDozenten] = useState<Dozenten[]>([]);
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [d, r, t, k, a] = await Promise.all([
        LivingAppsService.getDozenten(),
        LivingAppsService.getRaeume(),
        LivingAppsService.getTeilnehmer(),
        LivingAppsService.getKurse(),
        LivingAppsService.getAnmeldungen(),
      ]);
      setDozenten(d);
      setRaeume(r);
      setTeilnehmer(t);
      setKurse(k);
      setAnmeldungen(a);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ---- Computed data -------------------------------------------------------

  const today = useMemo(() => new Date(), []);

  // Lookup maps
  const teilnehmerMap = useMemo(() => {
    const m = new Map<string, Teilnehmer>();
    teilnehmer.forEach((t) => m.set(t.record_id, t));
    return m;
  }, [teilnehmer]);

  const kurseMap = useMemo(() => {
    const m = new Map<string, Kurse>();
    kurse.forEach((k) => m.set(k.record_id, k));
    return m;
  }, [kurse]);

  const dozentenMap = useMemo(() => {
    const m = new Map<string, Dozenten>();
    dozenten.forEach((d) => m.set(d.record_id, d));
    return m;
  }, [dozenten]);

  const raeumeMap = useMemo(() => {
    const m = new Map<string, Raeume>();
    raeume.forEach((r) => m.set(r.record_id, r));
    return m;
  }, [raeume]);

  // Active courses (today between start & end)
  const aktivKurse = useMemo(() => {
    return kurse.filter((k) => {
      if (!k.fields.startdatum || !k.fields.enddatum) return false;
      try {
        const start = parseISO(k.fields.startdatum);
        const end = parseISO(k.fields.enddatum);
        if (!isValid(start) || !isValid(end)) return false;
        return isWithinInterval(today, { start, end });
      } catch {
        return false;
      }
    });
  }, [kurse, today]);

  // Anmeldungen per course
  const anmeldungenPerKurs = useMemo(() => {
    const counts = new Map<string, number>();
    anmeldungen.forEach((a) => {
      const kursId = extractRecordId(a.fields.kurs);
      if (!kursId) return;
      counts.set(kursId, (counts.get(kursId) || 0) + 1);
    });
    return counts;
  }, [anmeldungen]);

  // Hero: Gesamtauslastung
  const { totalRegistrations, totalCapacity, auslastungPct } = useMemo(() => {
    let totalReg = 0;
    let totalCap = 0;
    kurse.forEach((k) => {
      const cap = k.fields.maximale_teilnehmer;
      if (cap && cap > 0) {
        totalCap += cap;
        totalReg += anmeldungenPerKurs.get(k.record_id) || 0;
      }
    });
    const pct = totalCap > 0 ? Math.round((totalReg / totalCap) * 100) : 0;
    return { totalRegistrations: totalReg, totalCapacity: totalCap, auslastungPct: pct };
  }, [kurse, anmeldungenPerKurs]);

  // Umsatz (bezahlt)
  const umsatz = useMemo(() => {
    let sum = 0;
    anmeldungen.forEach((a) => {
      if (a.fields.bezahlt) {
        const kursId = extractRecordId(a.fields.kurs);
        if (!kursId) return;
        const kurs = kurseMap.get(kursId);
        if (kurs?.fields.preis) {
          sum += kurs.fields.preis;
        }
      }
    });
    return sum;
  }, [anmeldungen, kurseMap]);

  // Offene Zahlungen
  const offeneZahlungen = useMemo(() => {
    return anmeldungen.filter((a) => !a.fields.bezahlt).length;
  }, [anmeldungen]);

  // Bar chart data: enrollment per course
  const chartData = useMemo(() => {
    return kurse
      .map((k) => {
        const enrolled = anmeldungenPerKurs.get(k.record_id) || 0;
        const capacity = k.fields.maximale_teilnehmer || 0;
        return {
          name: k.fields.titel || 'Unbekannt',
          enrolled,
          remaining: Math.max(0, capacity - enrolled),
          capacity,
        };
      })
      .sort((a, b) => b.enrolled - a.enrolled);
  }, [kurse, anmeldungenPerKurs]);

  // Recent registrations
  const recentAnmeldungen = useMemo(() => {
    return [...anmeldungen]
      .sort((a, b) =>
        (b.fields.anmeldedatum || '').localeCompare(a.fields.anmeldedatum || '')
      )
      .slice(0, 8);
  }, [anmeldungen]);

  // Dozenten with course count
  const dozentenWithCourses = useMemo(() => {
    const courseCountMap = new Map<string, number>();
    kurse.forEach((k) => {
      const dozId = extractRecordId(k.fields.dozent);
      if (!dozId) return;
      courseCountMap.set(dozId, (courseCountMap.get(dozId) || 0) + 1);
    });
    return dozenten
      .map((d) => ({
        ...d,
        courseCount: courseCountMap.get(d.record_id) || 0,
      }))
      .sort((a, b) =>
        (a.fields.nachname || '').localeCompare(b.fields.nachname || '')
      );
  }, [dozenten, kurse]);

  // Räume with course count
  const raeumeWithCourses = useMemo(() => {
    const courseCountMap = new Map<string, number>();
    kurse.forEach((k) => {
      const raumId = extractRecordId(k.fields.raum);
      if (!raumId) return;
      courseCountMap.set(raumId, (courseCountMap.get(raumId) || 0) + 1);
    });
    return raeume
      .map((r) => ({
        ...r,
        courseCount: courseCountMap.get(r.record_id) || 0,
      }))
      .sort((a, b) =>
        (a.fields.raumname || '').localeCompare(b.fields.raumname || '')
      );
  }, [raeume, kurse]);

  // ---- Render states -------------------------------------------------------

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={fetchAll} />;

  const chartHeight = Math.max(200, chartData.length * 40);

  return (
    <div
      className="min-h-screen bg-background pb-24 md:pb-8"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8">
        {/* ================================================================ */}
        {/* HEADER                                                           */}
        {/* ================================================================ */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-xl md:text-[28px] font-bold tracking-tight text-foreground">
            Kursverwaltung
          </h1>
          <Button
            className="hidden md:inline-flex gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Neue Anmeldung
          </Button>
        </header>

        {/* ================================================================ */}
        {/* ROW 1: HERO GAUGE + SECONDARY STATS                             */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 mb-6">
          {/* Hero Card */}
          <Card
            className="shadow-sm hover:shadow-md transition-shadow rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <CardContent className="flex flex-col items-center justify-center py-8 md:py-10 px-6 md:px-8">
              <SemiGauge
                percentage={auslastungPct}
                size={200}
                strokeWidth={6}
              />
              <div className="text-5xl md:text-[56px] font-extrabold tracking-tight text-foreground -mt-2">
                {auslastungPct}%
              </div>
              <div className="text-[13px] font-normal text-muted-foreground mt-1">
                Gesamtauslastung
              </div>
              <div className="text-sm font-medium text-foreground mt-1">
                {totalRegistrations} von {totalCapacity} Plätzen belegt
              </div>
            </CardContent>
          </Card>

          {/* Secondary Stats - 4 stacked cards on desktop, 2x2 grid on mobile */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            <StatCard
              icon={BookOpen}
              value={aktivKurse.length}
              label="Aktive Kurse"
              delay={50}
            />
            <StatCard
              icon={Users}
              value={anmeldungen.length}
              label="Anmeldungen"
              delay={100}
            />
            <StatCard
              icon={Euro}
              value={formatCurrency(umsatz)}
              label="Umsatz (bezahlt)"
              valueClassName="text-[hsl(38_92%_50%)]"
              delay={150}
            />
            <StatCard
              icon={AlertCircle}
              value={offeneZahlungen}
              label="Offen"
              valueClassName={
                offeneZahlungen > 0 ? 'text-destructive' : undefined
              }
              delay={200}
            />
          </div>
        </div>

        {/* ================================================================ */}
        {/* ROW 2: BAR CHART + RECENT REGISTRATIONS                         */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 mb-6">
          {/* Bar Chart */}
          <Card
            className="shadow-sm hover:shadow-md transition-shadow rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: '100ms' }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Belegung pro Kurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Keine Kurse vorhanden.
                </p>
              ) : (
                <div style={{ height: chartHeight }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={140}
                        tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                        tickFormatter={(v: string) => truncate(v, 20)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: 13,
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                        formatter={(value: number, name: string) => {
                          const label = name === 'enrolled' ? 'Belegt' : 'Frei';
                          return [value, label];
                        }}
                        labelFormatter={(label: string) => label}
                      />
                      <Bar
                        dataKey="enrolled"
                        stackId="a"
                        fill="var(--primary)"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="remaining"
                        stackId="a"
                        fill="var(--muted)"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Registrations */}
          <Card
            className="shadow-sm hover:shadow-md transition-shadow rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: '150ms' }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Letzte Anmeldungen
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              {recentAnmeldungen.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Noch keine Anmeldungen vorhanden.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {recentAnmeldungen.map((a) => {
                    const tnId = extractRecordId(a.fields.teilnehmer);
                    const kursId = extractRecordId(a.fields.kurs);
                    const tn = tnId ? teilnehmerMap.get(tnId) : null;
                    const kurs = kursId ? kurseMap.get(kursId) : null;
                    const name = tn
                      ? `${tn.fields.vorname || ''} ${tn.fields.nachname || ''}`.trim()
                      : 'Unbekannt';
                    const kursTitle = kurs?.fields.titel || 'Unbekannt';

                    return (
                      <li
                        key={a.record_id}
                        className="py-3 hover:bg-muted/50 -mx-4 px-4 transition-colors"
                      >
                        {/* Mobile: 2 lines / Desktop: inline */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-foreground">
                              {name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {' · '}
                              {truncate(kursTitle, 25)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(a.fields.anmeldedatum)}
                            </span>
                            {a.fields.bezahlt ? (
                              <Badge
                                className="text-[11px] bg-[hsl(152_60%_40%)] text-white border-transparent"
                              >
                                Bezahlt
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[11px]">
                                Offen
                              </Badge>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ================================================================ */}
        {/* ROW 3: DOZENTEN + RÄUME                                         */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dozenten */}
          <Card
            className="shadow-sm hover:shadow-md transition-shadow rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: '200ms' }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Dozenten
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              {dozentenWithCourses.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Keine Dozenten vorhanden.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {dozentenWithCourses.map((d) => (
                    <li
                      key={d.record_id}
                      className="py-3 flex items-center justify-between hover:bg-muted/50 -mx-4 px-4 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">
                          {d.fields.vorname} {d.fields.nachname}
                        </span>
                        {d.fields.fachgebiet && (
                          <Badge
                            variant="secondary"
                            className="text-[11px] shrink-0"
                          >
                            {d.fields.fachgebiet}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {d.courseCount} {d.courseCount === 1 ? 'Kurs' : 'Kurse'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Räume */}
          <Card
            className="shadow-sm hover:shadow-md transition-shadow rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: '250ms' }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Räume
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              {raeumeWithCourses.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Keine Räume vorhanden.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {raeumeWithCourses.map((r) => (
                    <li
                      key={r.record_id}
                      className="py-3 flex items-center justify-between hover:bg-muted/50 -mx-4 px-4 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-foreground">
                          {r.fields.raumname}
                        </span>
                        {r.fields.gebaeude && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {r.fields.gebaeude}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        {r.fields.kapazitaet != null && (
                          <span className="text-xs text-muted-foreground">
                            {r.fields.kapazitaet} Plätze
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {r.courseCount}{' '}
                          {r.courseCount === 1 ? 'Kurs' : 'Kurse'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ================================================================ */}
      {/* MOBILE FIXED ACTION BUTTON                                       */}
      {/* ================================================================ */}
      <div className="fixed bottom-3 left-4 right-4 md:hidden z-50">
        <Button
          className="w-full h-12 rounded-xl text-base font-semibold gap-2 active:scale-[0.98] transition-transform"
          style={{
            boxShadow: '0 4px 12px hsl(234 62% 46% / 0.3)',
          }}
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-5 w-5" />
          Neue Anmeldung
        </Button>
      </div>

      {/* ================================================================ */}
      {/* NEUE ANMELDUNG DIALOG                                            */}
      {/* ================================================================ */}
      <NeueAnmeldungDialog
        teilnehmerList={teilnehmer}
        kurseList={kurse}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchAll}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  value,
  label,
  valueClassName,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  valueClassName?: string;
  delay?: number;
}) {
  return (
    <Card
      className="shadow-sm hover:shadow-md transition-shadow rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="flex items-center gap-3 py-4 px-4 md:py-3 md:px-4">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <div
            className={`text-[28px] md:text-2xl font-bold leading-tight tracking-tight ${valueClassName || 'text-foreground'}`}
          >
            {value}
          </div>
          <div className="text-[12px] font-medium text-muted-foreground">
            {label}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
