import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Kurse, Anmeldungen, Dozenten, Teilnehmer, Raeume } from '@/types/app';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  GraduationCap,
  Users,
  Euro,
  Plus,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AnmeldungDialog } from '@/pages/AnmeldungenPage';

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

export function DashboardOverview() {
  const navigate = useNavigate();
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [dozenten, setDozenten] = useState<Dozenten[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showAnmeldungDialog, setShowAnmeldungDialog] = useState(false);

  async function fetchAll() {
    try {
      setLoading(true);
      setError(null);
      const [k, a, d, t, r] = await Promise.all([
        LivingAppsService.getKurse(),
        LivingAppsService.getAnmeldungen(),
        LivingAppsService.getDozenten(),
        LivingAppsService.getTeilnehmer(),
        LivingAppsService.getRaeume(),
      ]);
      setKurse(k);
      setAnmeldungen(a);
      setDozenten(d);
      setTeilnehmer(t);
      setRaeume(r);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const today = new Date().toISOString().split('T')[0];

  const aktivKurse = useMemo(
    () => kurse.filter((k) => !k.fields.enddatum || k.fields.enddatum >= today),
    [kurse, today]
  );

  const bezahltCount = useMemo(
    () => anmeldungen.filter((a) => a.fields.bezahlt === true).length,
    [anmeldungen]
  );

  const gesamtumsatz = useMemo(() => {
    const kursMap = new Map<string, Kurse>();
    kurse.forEach((k) => kursMap.set(k.record_id, k));
    let sum = 0;
    anmeldungen.forEach((a) => {
      if (a.fields.bezahlt !== true) return;
      const kursId = extractRecordId(a.fields.kurs);
      if (!kursId) return;
      const kurs = kursMap.get(kursId);
      if (kurs?.fields.preis) sum += kurs.fields.preis;
    });
    return sum;
  }, [anmeldungen, kurse]);

  const chartData = useMemo(() => {
    const months = new Map<string, number>();
    anmeldungen.forEach((a) => {
      const dateStr = a.fields.anmeldedatum || a.createdat;
      if (!dateStr) return;
      const monthKey = dateStr.substring(0, 7);
      months.set(monthKey, (months.get(monthKey) || 0) + 1);
    });
    return Array.from(months.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({
        name: format(parseISO(month + '-01'), 'MMM yy', { locale: de }),
        count,
      }));
  }, [anmeldungen]);

  const dozentMap = useMemo(() => {
    const m = new Map<string, Dozenten>();
    dozenten.forEach((d) => m.set(d.record_id, d));
    return m;
  }, [dozenten]);

  const raumMap = useMemo(() => {
    const m = new Map<string, Raeume>();
    raeume.forEach((r) => m.set(r.record_id, r));
    return m;
  }, [raeume]);

  const anmeldungenPerKurs = useMemo(() => {
    const counts = new Map<string, number>();
    anmeldungen.forEach((a) => {
      const kursId = extractRecordId(a.fields.kurs);
      if (!kursId) return;
      counts.set(kursId, (counts.get(kursId) || 0) + 1);
    });
    return counts;
  }, [anmeldungen]);

  const upcomingKurse = useMemo(
    () =>
      kurse
        .filter((k) => k.fields.startdatum && k.fields.startdatum >= today)
        .sort((a, b) => (a.fields.startdatum || '').localeCompare(b.fields.startdatum || ''))
        .slice(0, 5),
    [kurse, today]
  );

  const paymentPercent = anmeldungen.length > 0 ? (bezahltCount / anmeldungen.length) * 100 : 0;

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Übersicht</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler beim Laden</AlertTitle>
          <AlertDescription className="flex items-center gap-2">
            {error.message}
            <Button variant="outline" size="sm" onClick={fetchAll}>
              Erneut versuchen
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Übersicht</h1>
        <Button onClick={() => setShowAnmeldungDialog(true)} className="hidden md:flex">
          <Plus className="h-4 w-4 mr-2" />
          Neue Anmeldung
        </Button>
        <Button
          size="icon"
          onClick={() => setShowAnmeldungDialog(true)}
          className="md:hidden"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Hero KPI Card */}
      <Card className="bg-accent/30 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Anmeldungen gesamt</p>
              <p className="text-5xl md:text-6xl font-extrabold text-foreground tracking-tight">
                {anmeldungen.length}
              </p>
            </div>
            <div className="flex-1 max-w-md">
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${paymentPercent}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1.5">
                {bezahltCount} von {anmeldungen.length} bezahlt
              </p>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm text-muted-foreground font-medium">Umsatz (bezahlt)</p>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(gesamtumsatz)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Aktive Kurse"
          value={aktivKurse.length}
          icon={BookOpen}
          onClick={() => navigate('/kurse')}
        />
        <StatCard
          label="Dozenten"
          value={dozenten.length}
          icon={GraduationCap}
          onClick={() => navigate('/dozenten')}
        />
        <StatCard
          label="Teilnehmer"
          value={teilnehmer.length}
          icon={Users}
          onClick={() => navigate('/teilnehmer')}
        />
        <StatCard
          label="Umsatz"
          value={formatCurrency(gesamtumsatz)}
          icon={Euro}
          className="md:hidden"
          onClick={() => navigate('/anmeldungen')}
        />
        <StatCard
          label="Freie Plätze"
          value={kurse.reduce((sum, k) => {
            const max = k.fields.maximale_teilnehmer || 0;
            const enrolled = anmeldungenPerKurs.get(k.record_id) || 0;
            return sum + Math.max(0, max - enrolled);
          }, 0)}
          icon={Users}
          className="hidden md:flex"
          onClick={() => navigate('/kurse')}
        />
      </div>

      {/* Chart + Stats (Desktop 2/3 + 1/3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Anmeldungen pro Monat</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Noch keine Anmeldedaten vorhanden
              </p>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      stroke="hsl(220 10% 46%)"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="hsl(220 10% 46%)"
                      allowDecimals={false}
                      className="hidden md:block"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(0 0% 100%)',
                        border: '1px solid hsl(40 15% 90%)',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                      formatter={(value: number) => [value, 'Anmeldungen']}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(174 62% 32%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming courses on desktop sidebar */}
        <Card className="hidden md:block">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Bald startend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingKurse.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine kommenden Kurse</p>
            ) : (
              upcomingKurse.slice(0, 4).map((kurs) => {
                const enrolled = anmeldungenPerKurs.get(kurs.record_id) || 0;
                const max = kurs.fields.maximale_teilnehmer;
                return (
                  <div key={kurs.record_id} className="space-y-1">
                    <p className="text-sm font-medium leading-tight">{kurs.fields.titel || 'Ohne Titel'}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {kurs.fields.startdatum && (
                        <span>{format(parseISO(kurs.fields.startdatum), 'dd.MM.yyyy', { locale: de })}</span>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {enrolled}{max ? `/${max}` : ''}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Courses Table/List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Kommende Kurse</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/kurse')}>
            Alle anzeigen <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingKurse.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Keine kommenden Kurse vorhanden
            </p>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Kurstitel</th>
                      <th className="pb-2 font-medium">Dozent</th>
                      <th className="pb-2 font-medium">Raum</th>
                      <th className="pb-2 font-medium">Start</th>
                      <th className="pb-2 font-medium">Ende</th>
                      <th className="pb-2 font-medium text-center">Teilnehmer</th>
                      <th className="pb-2 font-medium text-right">Preis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingKurse.map((kurs) => {
                      const dozentId = extractRecordId(kurs.fields.dozent);
                      const dozent = dozentId ? dozentMap.get(dozentId) : null;
                      const raumId = extractRecordId(kurs.fields.raum);
                      const raum = raumId ? raumMap.get(raumId) : null;
                      const enrolled = anmeldungenPerKurs.get(kurs.record_id) || 0;
                      const max = kurs.fields.maximale_teilnehmer;

                      return (
                        <tr
                          key={kurs.record_id}
                          className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => navigate('/kurse')}
                        >
                          <td className="py-3 font-medium">{kurs.fields.titel || '-'}</td>
                          <td className="py-3 text-muted-foreground">
                            {dozent ? `${dozent.fields.vorname || ''} ${dozent.fields.nachname || ''}`.trim() : '-'}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {raum ? raum.fields.raumname || '-' : '-'}
                          </td>
                          <td className="py-3">
                            {kurs.fields.startdatum
                              ? format(parseISO(kurs.fields.startdatum), 'dd.MM.yyyy', { locale: de })
                              : '-'}
                          </td>
                          <td className="py-3">
                            {kurs.fields.enddatum
                              ? format(parseISO(kurs.fields.enddatum), 'dd.MM.yyyy', { locale: de })
                              : '-'}
                          </td>
                          <td className="py-3 text-center">
                            <Badge variant={max && enrolled >= max ? 'destructive' : 'secondary'}>
                              {enrolled}{max ? `/${max}` : ''}
                            </Badge>
                          </td>
                          <td className="py-3 text-right">{formatCurrency(kurs.fields.preis)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden space-y-3">
                {upcomingKurse.map((kurs) => {
                  const dozentId = extractRecordId(kurs.fields.dozent);
                  const dozent = dozentId ? dozentMap.get(dozentId) : null;
                  const enrolled = anmeldungenPerKurs.get(kurs.record_id) || 0;
                  const max = kurs.fields.maximale_teilnehmer;

                  return (
                    <div
                      key={kurs.record_id}
                      className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/kurse')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-[15px]">{kurs.fields.titel || 'Ohne Titel'}</p>
                          {dozent && (
                            <p className="text-[13px] text-muted-foreground">
                              {dozent.fields.vorname} {dozent.fields.nachname}
                            </p>
                          )}
                          <p className="text-[13px] text-muted-foreground">
                            {kurs.fields.startdatum
                              ? format(parseISO(kurs.fields.startdatum), 'dd.MM.yyyy', { locale: de })
                              : ''}
                            {kurs.fields.enddatum
                              ? ` - ${format(parseISO(kurs.fields.enddatum), 'dd.MM.yyyy', { locale: de })}`
                              : ''}
                          </p>
                        </div>
                        <Badge variant={max && enrolled >= max ? 'destructive' : 'secondary'}>
                          {enrolled}{max ? `/${max}` : ''}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Anmeldung Dialog */}
      <AnmeldungDialog
        open={showAnmeldungDialog}
        onOpenChange={setShowAnmeldungDialog}
        record={null}
        kurse={kurse}
        teilnehmer={teilnehmer}
        onSuccess={fetchAll}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  onClick,
  className,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow ${className || ''}`}
      onClick={onClick}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
      <Skeleton className="h-60 w-full rounded-xl" />
    </div>
  );
}
