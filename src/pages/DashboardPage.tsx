import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { extractRecordId } from '@/services/livingAppsService';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { BookOpen, Users, AlertCircle, Euro, Plus } from 'lucide-react';

import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';

// Helpers
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

export default function DashboardPage() {
  const navigate = useNavigate();
  const { 
    kurse, anmeldungen, teilnehmer, 
    loading, error, fetchAll,
    kursMap, resolveTeilnehmerName, resolveKursName
  } = useData();

  const today = todayISO();

  // KPI Calculations
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

  // Chart Data
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

  // Recent Registrations
  const recentAnmeldungen = useMemo(() => {
    return [...anmeldungen]
      .sort((a, b) => (b.fields.anmeldedatum ?? '').localeCompare(a.fields.anmeldedatum ?? ''))
      .slice(0, 5);
  }, [anmeldungen]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Button onClick={() => navigate('/anmeldungen')}>
          <Plus className="h-4 w-4 mr-1" />
          Neue Anmeldung
        </Button>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.54fr] gap-6">
        {/* Left Column */}
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

        {/* Right Column */}
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
                      onClick={() => navigate('/anmeldungen')}
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
    </div>
  );
}

// Stat Card Component
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

