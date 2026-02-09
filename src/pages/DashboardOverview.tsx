import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import type { Kurse, Dozenten, Teilnehmer, Anmeldungen, Raeume } from '@/types/app'
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Plus, GraduationCap, Users, UserCheck, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { AnmeldungDialog } from '@/components/AnmeldungDialog'
import { toast } from 'sonner'

export function DashboardOverview() {
  const navigate = useNavigate()
  const [kurse, setKurse] = useState<Kurse[]>([])
  const [dozenten, setDozenten] = useState<Dozenten[]>([])
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([])
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([])
  const [raeume, setRaeume] = useState<Raeume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [showAnmeldungDialog, setShowAnmeldungDialog] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const [k, d, t, a, r] = await Promise.all([
        LivingAppsService.getKurse(),
        LivingAppsService.getDozenten(),
        LivingAppsService.getTeilnehmer(),
        LivingAppsService.getAnmeldungen(),
        LivingAppsService.getRaeume(),
      ])
      setKurse(k)
      setDozenten(d)
      setTeilnehmer(t)
      setAnmeldungen(a)
      setRaeume(r)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Daten konnten nicht geladen werden'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // Lookup maps
  const dozentMap = useMemo(() => {
    const map = new Map<string, Dozenten>()
    dozenten.forEach(d => map.set(d.record_id, d))
    return map
  }, [dozenten])

  const teilnehmerMap = useMemo(() => {
    const map = new Map<string, Teilnehmer>()
    teilnehmer.forEach(t => map.set(t.record_id, t))
    return map
  }, [teilnehmer])

  const kursMap = useMemo(() => {
    const map = new Map<string, Kurse>()
    kurse.forEach(k => map.set(k.record_id, k))
    return map
  }, [kurse])

  const raumMap = useMemo(() => {
    const map = new Map<string, Raeume>()
    raeume.forEach(r => map.set(r.record_id, r))
    return map
  }, [raeume])

  // Anmeldungen per Kurs
  const anmeldungenPerKurs = useMemo(() => {
    const counts = new Map<string, number>()
    anmeldungen.forEach(a => {
      const kursId = extractRecordId(a.fields.kurs)
      if (!kursId) return
      counts.set(kursId, (counts.get(kursId) || 0) + 1)
    })
    return counts
  }, [anmeldungen])

  // KPIs
  const totalAnmeldungen = anmeldungen.length
  const bezahlt = anmeldungen.filter(a => a.fields.bezahlt === true).length
  const offen = totalAnmeldungen - bezahlt
  const bezahltRatio = totalAnmeldungen > 0 ? (bezahlt / totalAnmeldungen) * 100 : 0

  const freiePlaetze = useMemo(() => {
    let total = 0
    kurse.forEach(k => {
      const max = k.fields.maximale_teilnehmer || 0
      const enrolled = anmeldungenPerKurs.get(k.record_id) || 0
      total += Math.max(0, max - enrolled)
    })
    return total
  }, [kurse, anmeldungenPerKurs])

  // Chart data
  const chartData = useMemo(() => {
    return kurse.map(k => ({
      name: (k.fields.titel || 'Ohne Titel').length > 20
        ? (k.fields.titel || 'Ohne Titel').substring(0, 20) + '…'
        : (k.fields.titel || 'Ohne Titel'),
      fullName: k.fields.titel || 'Ohne Titel',
      count: anmeldungenPerKurs.get(k.record_id) || 0,
      max: k.fields.maximale_teilnehmer || 0,
    })).sort((a, b) => b.count - a.count)
  }, [kurse, anmeldungenPerKurs])

  // Recent anmeldungen
  const recentAnmeldungen = useMemo(() => {
    return [...anmeldungen]
      .sort((a, b) => {
        const da = a.fields.anmeldedatum || a.createdat
        const db = b.fields.anmeldedatum || b.createdat
        return db.localeCompare(da)
      })
      .slice(0, 8)
  }, [anmeldungen])

  // Kurse sorted by available spots
  const kurseWithCapacity = useMemo(() => {
    return kurse
      .map(k => {
        const enrolled = anmeldungenPerKurs.get(k.record_id) || 0
        const max = k.fields.maximale_teilnehmer || 0
        const available = Math.max(0, max - enrolled)
        const fillPercent = max > 0 ? (enrolled / max) * 100 : 0
        return { ...k, enrolled, max, available, fillPercent }
      })
      .filter(k => k.available > 0)
      .sort((a, b) => a.available - b.available)
      .slice(0, 5)
  }, [kurse, anmeldungenPerKurs])

  // Top kurse for mobile
  const topKurse = useMemo(() => {
    return kurse
      .map(k => {
        const enrolled = anmeldungenPerKurs.get(k.record_id) || 0
        const max = k.fields.maximale_teilnehmer || 0
        const fillPercent = max > 0 ? (enrolled / max) * 100 : 0
        const dozentId = extractRecordId(k.fields.dozent)
        const dozent = dozentId ? dozentMap.get(dozentId) : null
        const raumId = extractRecordId(k.fields.raum)
        const raum = raumId ? raumMap.get(raumId) : null
        return { ...k, enrolled, max, fillPercent, dozent, raum }
      })
      .sort((a, b) => {
        const da = a.fields.startdatum || ''
        const db = b.fields.startdatum || ''
        return da.localeCompare(db)
      })
      .slice(0, 5)
  }, [kurse, anmeldungenPerKurs, dozentMap, raumMap])

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-lg font-semibold">Fehler beim Laden</h2>
        <p className="text-muted-foreground text-sm">{error.message}</p>
        <Button variant="outline" onClick={loadData}>Erneut versuchen</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-[28px] font-extrabold tracking-tight">Kursverwaltung</h1>
        <Button onClick={() => setShowAnmeldungDialog(true)} className="hidden md:inline-flex">
          <Plus className="h-4 w-4 mr-2" />
          Neue Anmeldung
        </Button>
      </div>

      {/* Desktop: Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_0.54fr] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Hero KPI */}
          <Card className="shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
            <CardContent className="pt-6 pb-5 px-6">
              <p className="text-[13px] text-muted-foreground font-medium">Anmeldungen gesamt</p>
              <p className="text-[48px] md:text-[56px] font-extrabold leading-none mt-1 tracking-tight">
                {totalAnmeldungen}
              </p>
              {/* Payment bar */}
              <div className="mt-4 space-y-2">
                <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${bezahltRatio}%` }}
                  />
                </div>
                <div className="flex items-center gap-4 text-[13px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                    <span className="font-medium">{bezahlt}</span>
                    <span className="text-muted-foreground">bezahlt</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30 inline-block" />
                    <span className="font-medium">{offen}</span>
                    <span className="text-muted-foreground">offen</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats - mobile horizontal scroll, desktop grid */}
          <div className="flex md:grid md:grid-cols-3 gap-3 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
            <StatCard icon={GraduationCap} label="Aktive Kurse" value={kurse.length} />
            <StatCard icon={Users} label="Dozenten" value={dozenten.length} />
            <StatCard icon={UserCheck} label="Freie Plätze" value={freiePlaetze} />
          </div>

          {/* Mobile: Kurse Übersicht */}
          <div className="md:hidden space-y-3">
            <h2 className="text-base font-semibold">Kurse Übersicht</h2>
            {topKurse.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Kurse vorhanden.</p>
            ) : (
              topKurse.map(k => {
                const fillColor = k.fillPercent >= 100 ? 'destructive' : k.fillPercent >= 80 ? 'secondary' : 'default'
                return (
                  <Card
                    key={k.record_id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate('/kurse')}
                  >
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-[15px] truncate">{k.fields.titel}</p>
                          <p className="text-[13px] text-muted-foreground truncate">
                            {k.dozent ? `${k.dozent.fields.vorname} ${k.dozent.fields.nachname}` : '–'}
                            {k.raum ? ` · ${k.raum.fields.raumname}` : ''}
                          </p>
                          {(k.fields.startdatum || k.fields.enddatum) && (
                            <p className="text-[13px] text-muted-foreground">
                              {k.fields.startdatum ? format(parseISO(k.fields.startdatum), 'dd.MM.yyyy', { locale: de }) : '–'}
                              {' – '}
                              {k.fields.enddatum ? format(parseISO(k.fields.enddatum), 'dd.MM.yyyy', { locale: de }) : '–'}
                            </p>
                          )}
                        </div>
                        <Badge variant={fillColor === 'destructive' ? 'destructive' : fillColor === 'secondary' ? 'secondary' : 'outline'}>
                          {k.enrolled}/{k.max || '∞'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
            {kurse.length > 5 && (
              <Button variant="ghost" className="w-full text-primary" onClick={() => navigate('/kurse')}>
                Alle anzeigen
              </Button>
            )}
          </div>

          {/* Desktop: Chart */}
          <Card className="hidden md:block">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Anmeldungen pro Kurs</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Noch keine Kursdaten vorhanden.</p>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                      <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(230 10% 50%)" />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={140}
                        tick={{ fontSize: 12 }}
                        stroke="hsl(230 10% 50%)"
                      />
                      <Tooltip
                        formatter={(value: number, _name: string, props: { payload?: { fullName?: string; max?: number } }) => [
                          `${value} / ${props.payload?.max || '–'}`,
                          props.payload?.fullName || '',
                        ]}
                        contentStyle={{
                          backgroundColor: 'hsl(0 0% 100%)',
                          border: '1px solid hsl(230 15% 90%)',
                          borderRadius: '8px',
                          fontSize: '13px',
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={entry.max > 0 && entry.count >= entry.max ? 'hsl(0 72% 51%)' : 'hsl(243 55% 54%)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile: Recent Anmeldungen */}
          <div className="md:hidden space-y-3">
            <h2 className="text-base font-semibold">Letzte Anmeldungen</h2>
            <RecentAnmeldungenList
              anmeldungen={recentAnmeldungen.slice(0, 5)}
              teilnehmerMap={teilnehmerMap}
              kursMap={kursMap}
            />
          </div>
        </div>

        {/* Right column (desktop only) */}
        <div className="hidden md:block space-y-6">
          {/* Recent Anmeldungen */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Letzte Anmeldungen</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentAnmeldungenList
                anmeldungen={recentAnmeldungen}
                teilnehmerMap={teilnehmerMap}
                kursMap={kursMap}
              />
            </CardContent>
          </Card>

          {/* Kurse mit freien Plätzen */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Kurse mit freien Plätzen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {kurseWithCapacity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Alle Kurse sind voll belegt.</p>
              ) : (
                kurseWithCapacity.map(k => (
                  <div key={k.record_id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate mr-2">{k.fields.titel}</span>
                      <span className="text-muted-foreground whitespace-nowrap text-xs">
                        {k.enrolled}/{k.max}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${k.fillPercent}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowAnmeldungDialog(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Anmeldung Dialog */}
      <AnmeldungDialog
        open={showAnmeldungDialog}
        onOpenChange={setShowAnmeldungDialog}
        kurse={kurse}
        teilnehmer={teilnehmer}
        onSuccess={() => {
          toast.success('Anmeldung erstellt')
          loadData()
        }}
      />
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <Card className="min-w-[130px] flex-shrink-0 md:flex-shrink">
      <CardContent className="py-3 px-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xl font-bold leading-none">{value}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function RecentAnmeldungenList({
  anmeldungen,
  teilnehmerMap,
  kursMap,
}: {
  anmeldungen: Anmeldungen[]
  teilnehmerMap: Map<string, Teilnehmer>
  kursMap: Map<string, Kurse>
}) {
  if (anmeldungen.length === 0) {
    return <p className="text-sm text-muted-foreground">Noch keine Anmeldungen vorhanden.</p>
  }

  return (
    <div className="space-y-2">
      {anmeldungen.map(a => {
        const teilnehmerId = extractRecordId(a.fields.teilnehmer)
        const tn = teilnehmerId ? teilnehmerMap.get(teilnehmerId) : null
        const kursId = extractRecordId(a.fields.kurs)
        const kurs = kursId ? kursMap.get(kursId) : null
        const name = tn ? `${tn.fields.vorname || ''} ${tn.fields.nachname || ''}`.trim() : '–'
        const kursName = kurs?.fields.titel || '–'

        return (
          <div key={a.record_id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div className="min-w-0 mr-2">
              <p className="text-sm font-medium truncate">{name}</p>
              <p className="text-xs text-muted-foreground truncate">{kursName}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {a.fields.anmeldedatum && (
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(a.fields.anmeldedatum), 'dd.MM.', { locale: de })}
                </span>
              )}
              <Badge variant={a.fields.bezahlt ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0.5">
                {a.fields.bezahlt ? 'Bezahlt' : 'Offen'}
              </Badge>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}
