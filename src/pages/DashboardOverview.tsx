import { useState, useEffect, useMemo } from 'react'
import type { Kurse, Anmeldungen, Teilnehmer, Dozenten } from '@/types/app'
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService'
import { APP_IDS } from '@/types/app'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Users,
  ClipboardList,
  Euro,
  CheckCircle,
  Plus,
  AlertCircle,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { toast } from 'sonner'
import { useNavigate } from 'react-router'

export function DashboardOverview() {
  const navigate = useNavigate()
  const [kurse, setKurse] = useState<Kurse[]>([])
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([])
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const [k, a, t] = await Promise.all([
        LivingAppsService.getKurse(),
        LivingAppsService.getAnmeldungen(),
        LivingAppsService.getTeilnehmer(),
      ])
      setKurse(k)
      setAnmeldungen(a)
      setTeilnehmer(t)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Daten konnten nicht geladen werden'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const activeCourses = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return kurse.filter(k => !k.fields.enddatum || k.fields.enddatum >= today)
  }, [kurse])

  const enrollmentByKurs = useMemo(() => {
    const map = new Map<string, number>()
    anmeldungen.forEach(a => {
      const kursId = extractRecordId(a.fields.kurs)
      if (!kursId) return
      map.set(kursId, (map.get(kursId) || 0) + 1)
    })
    return map
  }, [anmeldungen])

  const overallStats = useMemo(() => {
    let totalCapacity = 0
    let totalEnrolled = 0
    activeCourses.forEach(k => {
      const cap = k.fields.maximale_teilnehmer || 0
      const enrolled = enrollmentByKurs.get(k.record_id) || 0
      totalCapacity += cap
      totalEnrolled += enrolled
    })
    const enrollmentRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0

    let estimatedRevenue = 0
    anmeldungen.forEach(a => {
      const kursId = extractRecordId(a.fields.kurs)
      if (!kursId) return
      const kurs = kurse.find(k => k.record_id === kursId)
      if (kurs?.fields.preis) {
        estimatedRevenue += kurs.fields.preis
      }
    })

    const paidCount = anmeldungen.filter(a => a.fields.bezahlt === true).length
    const paymentRate = anmeldungen.length > 0 ? Math.round((paidCount / anmeldungen.length) * 100) : 0

    return { totalCapacity, totalEnrolled, enrollmentRate, estimatedRevenue, paymentRate }
  }, [activeCourses, enrollmentByKurs, anmeldungen, kurse])

  const courseEnrollmentData = useMemo(() => {
    return activeCourses
      .map(k => ({
        id: k.record_id,
        title: k.fields.titel || 'Unbenannt',
        enrolled: enrollmentByKurs.get(k.record_id) || 0,
        capacity: k.fields.maximale_teilnehmer || 0,
        percentage: k.fields.maximale_teilnehmer
          ? Math.round(((enrollmentByKurs.get(k.record_id) || 0) / k.fields.maximale_teilnehmer) * 100)
          : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage)
  }, [activeCourses, enrollmentByKurs])

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

  const recentRegistrations = useMemo(() => {
    return [...anmeldungen]
      .sort((a, b) => {
        const dateA = a.fields.anmeldedatum || a.createdat
        const dateB = b.fields.anmeldedatum || b.createdat
        return dateB.localeCompare(dateA)
      })
      .slice(0, 5)
      .map(a => {
        const teilnehmerId = extractRecordId(a.fields.teilnehmer)
        const kursId = extractRecordId(a.fields.kurs)
        const tn = teilnehmerId ? teilnehmerMap.get(teilnehmerId) : null
        const kr = kursId ? kursMap.get(kursId) : null
        return {
          id: a.record_id,
          participantName: tn ? `${tn.fields.vorname || ''} ${tn.fields.nachname || ''}`.trim() : 'Unbekannt',
          courseName: kr?.fields.titel || 'Unbekannt',
          date: a.fields.anmeldedatum || a.createdat.split('T')[0],
          paid: a.fields.bezahlt === true,
        }
      })
  }, [anmeldungen, teilnehmerMap, kursMap])

  function getBarColor(percentage: number) {
    if (percentage > 60) return 'bg-[hsl(152_55%_42%)]'
    if (percentage > 30) return 'bg-[hsl(38_92%_50%)]'
    return 'bg-[hsl(0_72%_51%)]'
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-lg font-semibold">Fehler beim Laden</h2>
        <p className="text-muted-foreground text-sm">{error.message}</p>
        <Button variant="outline" onClick={loadData}>Erneut versuchen</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-[28px] font-bold">Übersicht</h1>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Neue Anmeldung</span>
        </Button>
      </div>

      {loading ? <LoadingSkeleton /> : (
        <>
          {/* Hero + Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
            {/* Hero Card */}
            <Card className="md:col-span-3 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Aktive Kurse & Gesamtauslastung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold text-primary mb-1">{activeCourses.length}</div>
                <p className="text-sm text-muted-foreground mb-4">Aktive Kurse</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{overallStats.totalEnrolled} / {overallStats.totalCapacity} Plätze belegt</span>
                    <span className="font-semibold">{overallStats.enrollmentRate}%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getBarColor(overallStats.enrollmentRate)}`}
                      style={{ width: `${Math.min(overallStats.enrollmentRate, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats 2x2 */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <StatCard
                label="Teilnehmer"
                value={teilnehmer.length.toString()}
                icon={Users}
                loading={false}
              />
              <StatCard
                label="Anmeldungen"
                value={anmeldungen.length.toString()}
                icon={ClipboardList}
                loading={false}
              />
              <StatCard
                label="Umsatz (Geschätzt)"
                value={new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(overallStats.estimatedRevenue)}
                icon={Euro}
                loading={false}
              />
              <StatCard
                label="Zahlungsquote"
                value={`${overallStats.paymentRate}%`}
                icon={CheckCircle}
                loading={false}
                valueColor={overallStats.paymentRate > 80 ? 'text-[hsl(152_55%_42%)]' : overallStats.paymentRate > 50 ? 'text-[hsl(38_92%_50%)]' : 'text-destructive'}
              />
            </div>
          </div>

          {/* Content Row: Enrollment + Recent */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
            {/* Course Enrollment */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Kursauslastung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {courseEnrollmentData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Keine aktiven Kurse vorhanden</p>
                ) : (
                  courseEnrollmentData.map(course => (
                    <div
                      key={course.id}
                      className="cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                      onClick={() => navigate('/kurse')}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-semibold truncate mr-2">{course.title}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{course.enrolled} / {course.capacity} Plätze</span>
                      </div>
                      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getBarColor(course.percentage)}`}
                          style={{ width: `${Math.min(course.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent Registrations */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Letzte Anmeldungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentRegistrations.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Noch keine Anmeldungen</p>
                ) : (
                  recentRegistrations.map(reg => (
                    <div
                      key={reg.id}
                      className="flex items-start justify-between gap-2 cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                      onClick={() => navigate('/anmeldungen')}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{reg.participantName}</div>
                        <div className="text-xs text-muted-foreground truncate">{reg.courseName}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {(() => {
                            try { return format(parseISO(reg.date), 'dd.MM.yy', { locale: de }) } catch { return reg.date }
                          })()}
                        </span>
                        <Badge variant={reg.paid ? 'default' : 'secondary'} className={reg.paid ? 'bg-[hsl(152_55%_42%)] hover:bg-[hsl(152_55%_38%)] text-white text-[10px] px-1.5 py-0' : 'text-[10px] px-1.5 py-0'}>
                          {reg.paid ? 'Bezahlt' : 'Offen'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => setShowCreateDialog(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Create Anmeldung Dialog */}
      <CreateAnmeldungDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        kurse={kurse}
        teilnehmer={teilnehmer}
        onSuccess={loadData}
      />
    </div>
  )
}

function StatCard({ label, value, icon: Icon, loading, valueColor }: {
  label: string
  value: string
  icon: React.ElementType
  loading: boolean
  valueColor?: string
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className={`text-xl font-bold ${valueColor || ''}`}>{value}</div>
        )}
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
        <Card className="md:col-span-3">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
        <Card className="md:col-span-3">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-4 w-32" />
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2.5 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-4 w-40" />
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CreateAnmeldungDialog({ open, onOpenChange, kurse, teilnehmer, onSuccess }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  kurse: Kurse[]
  teilnehmer: Teilnehmer[]
  onSuccess: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [selectedTeilnehmer, setSelectedTeilnehmer] = useState('')
  const [selectedKurs, setSelectedKurs] = useState('')
  const [anmeldedatum, setAnmeldedatum] = useState(new Date().toISOString().split('T')[0])
  const [bezahlt, setBezahlt] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedTeilnehmer('')
      setSelectedKurs('')
      setAnmeldedatum(new Date().toISOString().split('T')[0])
      setBezahlt(false)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTeilnehmer || !selectedKurs) {
      toast.error('Bitte Teilnehmer und Kurs auswählen')
      return
    }
    setSubmitting(true)
    try {
      await LivingAppsService.createAnmeldungenEntry({
        teilnehmer: createRecordUrl(APP_IDS.TEILNEHMER, selectedTeilnehmer),
        kurs: createRecordUrl(APP_IDS.KURSE, selectedKurs),
        anmeldedatum,
        bezahlt,
      })
      toast.success('Anmeldung erstellt')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(`Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Anmeldung</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teilnehmer">Teilnehmer</Label>
            <Select value={selectedTeilnehmer || 'none'} onValueChange={v => setSelectedTeilnehmer(v === 'none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Teilnehmer wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bitte wählen...</SelectItem>
                {teilnehmer.map(t => (
                  <SelectItem key={t.record_id} value={t.record_id}>
                    {t.fields.vorname} {t.fields.nachname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="kurs">Kurs</Label>
            <Select value={selectedKurs || 'none'} onValueChange={v => setSelectedKurs(v === 'none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Kurs wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bitte wählen...</SelectItem>
                {kurse.map(k => (
                  <SelectItem key={k.record_id} value={k.record_id}>
                    {k.fields.titel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="datum">Anmeldedatum</Label>
            <Input
              id="datum"
              type="date"
              value={anmeldedatum}
              onChange={e => setAnmeldedatum(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="bezahlt"
              checked={bezahlt}
              onCheckedChange={(v) => setBezahlt(v === true)}
            />
            <Label htmlFor="bezahlt" className="text-sm">Bezahlt</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Erstellt...' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
