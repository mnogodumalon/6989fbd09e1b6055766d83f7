import { useState, useEffect, useMemo } from 'react'
import type { Kurse, Dozenten, Raeume, Anmeldungen, Teilnehmer } from '@/types/app'
import { APP_IDS } from '@/types/app'
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { AnmeldungDialog } from '@/components/AnmeldungDialog'
import { Plus, Pencil, Trash2, AlertCircle, UserPlus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { toast } from 'sonner'

export function KursePage() {
  const [kurse, setKurse] = useState<Kurse[]>([])
  const [dozenten, setDozenten] = useState<Dozenten[]>([])
  const [raeume, setRaeume] = useState<Raeume[]>([])
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([])
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [editRecord, setEditRecord] = useState<Kurse | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteRecord, setDeleteRecord] = useState<Kurse | null>(null)
  const [detailRecord, setDetailRecord] = useState<Kurse | null>(null)
  const [showAnmeldungDialog, setShowAnmeldungDialog] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const [k, d, r, a, t] = await Promise.all([
        LivingAppsService.getKurse(),
        LivingAppsService.getDozenten(),
        LivingAppsService.getRaeume(),
        LivingAppsService.getAnmeldungen(),
        LivingAppsService.getTeilnehmer(),
      ])
      setKurse(k)
      setDozenten(d)
      setRaeume(r)
      setAnmeldungen(a)
      setTeilnehmer(t)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const dozentMap = useMemo(() => {
    const map = new Map<string, Dozenten>()
    dozenten.forEach(d => map.set(d.record_id, d))
    return map
  }, [dozenten])

  const raumMap = useMemo(() => {
    const map = new Map<string, Raeume>()
    raeume.forEach(r => map.set(r.record_id, r))
    return map
  }, [raeume])

  const teilnehmerMap = useMemo(() => {
    const map = new Map<string, Teilnehmer>()
    teilnehmer.forEach(t => map.set(t.record_id, t))
    return map
  }, [teilnehmer])

  const anmeldungenPerKurs = useMemo(() => {
    const counts = new Map<string, Anmeldungen[]>()
    anmeldungen.forEach(a => {
      const kursId = extractRecordId(a.fields.kurs)
      if (!kursId) return
      if (!counts.has(kursId)) counts.set(kursId, [])
      counts.get(kursId)!.push(a)
    })
    return counts
  }, [anmeldungen])

  const sortedKurse = useMemo(() => {
    return [...kurse].sort((a, b) => {
      const da = a.fields.startdatum || ''
      const db = b.fields.startdatum || ''
      return da.localeCompare(db)
    })
  }, [kurse])

  async function handleDelete() {
    if (!deleteRecord) return
    await LivingAppsService.deleteKurseEntry(deleteRecord.record_id)
    setDeleteRecord(null)
    setDetailRecord(null)
    loadData()
  }

  if (loading) return <PageLoading />
  if (error) return <PageError error={error} onRetry={loadData} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kurse</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Neuer Kurs
        </Button>
      </div>

      {sortedKurse.length === 0 ? (
        <EmptyState message="Noch keine Kurse vorhanden." actionLabel="Kurs erstellen" onAction={() => setShowCreateDialog(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedKurse.map(k => {
            const dozentId = extractRecordId(k.fields.dozent)
            const dozent = dozentId ? dozentMap.get(dozentId) : null
            const raumId = extractRecordId(k.fields.raum)
            const raum = raumId ? raumMap.get(raumId) : null
            const enrolled = anmeldungenPerKurs.get(k.record_id)?.length || 0
            const max = k.fields.maximale_teilnehmer || 0
            const fillPercent = max > 0 ? (enrolled / max) * 100 : 0

            return (
              <Card
                key={k.record_id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setDetailRecord(k)}
              >
                <CardContent className="py-4 px-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base truncate">{k.fields.titel || '(Ohne Titel)'}</p>
                      {k.fields.beschreibung && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{k.fields.beschreibung}</p>
                      )}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                        {dozent && <span>{dozent.fields.vorname} {dozent.fields.nachname}</span>}
                        {raum && <span>{raum.fields.raumname}</span>}
                        {k.fields.startdatum && (
                          <span>
                            {format(parseISO(k.fields.startdatum), 'dd.MM.yyyy', { locale: de })}
                            {k.fields.enddatum && ` – ${format(parseISO(k.fields.enddatum), 'dd.MM.yyyy', { locale: de })}`}
                          </span>
                        )}
                        {k.fields.preis != null && (
                          <span>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(k.fields.preis)}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant={fillPercent >= 100 ? 'destructive' : fillPercent >= 80 ? 'secondary' : 'outline'}>
                      {enrolled}/{max || '∞'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <KursDialog
        open={showCreateDialog || !!editRecord}
        onOpenChange={open => { if (!open) { setShowCreateDialog(false); setEditRecord(null) } }}
        record={editRecord}
        dozenten={dozenten}
        raeume={raeume}
        onSuccess={() => {
          setShowCreateDialog(false)
          setEditRecord(null)
          loadData()
        }}
      />

      {/* Detail Dialog */}
      <KursDetailDialog
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
        dozentMap={dozentMap}
        raumMap={raumMap}
        teilnehmerMap={teilnehmerMap}
        anmeldungen={anmeldungenPerKurs.get(detailRecord?.record_id || '') || []}
        onEdit={k => { setDetailRecord(null); setEditRecord(k) }}
        onDelete={k => { setDetailRecord(null); setDeleteRecord(k) }}
        onAddAnmeldung={() => setShowAnmeldungDialog(true)}
      />

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={!!deleteRecord}
        onOpenChange={open => { if (!open) setDeleteRecord(null) }}
        recordName={deleteRecord?.fields.titel || ''}
        onConfirm={handleDelete}
      />

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

// --- Kurs Create/Edit Dialog ---
function KursDialog({
  open, onOpenChange, record, dozenten, raeume, onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: Kurse | null
  dozenten: Dozenten[]
  raeume: Raeume[]
  onSuccess: () => void
}) {
  const isEditing = !!record
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    titel: '', beschreibung: '', startdatum: '', enddatum: '',
    maximale_teilnehmer: '', preis: '', dozent: '', raum: '',
  })

  useEffect(() => {
    if (open) {
      if (record) {
        setFormData({
          titel: record.fields.titel || '',
          beschreibung: record.fields.beschreibung || '',
          startdatum: record.fields.startdatum?.split('T')[0] || '',
          enddatum: record.fields.enddatum?.split('T')[0] || '',
          maximale_teilnehmer: record.fields.maximale_teilnehmer?.toString() || '',
          preis: record.fields.preis?.toString() || '',
          dozent: extractRecordId(record.fields.dozent) || '',
          raum: extractRecordId(record.fields.raum) || '',
        })
      } else {
        setFormData({
          titel: '', beschreibung: '', startdatum: new Date().toISOString().split('T')[0],
          enddatum: '', maximale_teilnehmer: '', preis: '', dozent: '', raum: '',
        })
      }
    }
  }, [open, record])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.titel.trim()) { toast.error('Bitte einen Kurstitel eingeben.'); return }
    setSubmitting(true)
    try {
      const apiData: Kurse['fields'] = {
        titel: formData.titel,
        beschreibung: formData.beschreibung || undefined,
        startdatum: formData.startdatum || undefined,
        enddatum: formData.enddatum || undefined,
        maximale_teilnehmer: formData.maximale_teilnehmer ? Number(formData.maximale_teilnehmer) : undefined,
        preis: formData.preis ? Number(formData.preis) : undefined,
        dozent: formData.dozent ? createRecordUrl(APP_IDS.DOZENTEN, formData.dozent) : undefined,
        raum: formData.raum ? createRecordUrl(APP_IDS.RAEUME, formData.raum) : undefined,
      }
      if (isEditing) {
        await LivingAppsService.updateKurseEntry(record!.record_id, apiData)
        toast.success('Kurs aktualisiert')
      } else {
        await LivingAppsService.createKurseEntry(apiData)
        toast.success('Kurs erstellt')
      }
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Kurs bearbeiten' : 'Neuer Kurs'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Bearbeite die Kursdaten.' : 'Erstelle einen neuen Kurs.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titel">Kurstitel *</Label>
            <Input id="titel" value={formData.titel} onChange={e => setFormData(p => ({ ...p, titel: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="beschreibung">Beschreibung</Label>
            <Textarea id="beschreibung" value={formData.beschreibung} onChange={e => setFormData(p => ({ ...p, beschreibung: e.target.value }))} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startdatum">Startdatum</Label>
              <Input id="startdatum" type="date" value={formData.startdatum} onChange={e => setFormData(p => ({ ...p, startdatum: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enddatum">Enddatum</Label>
              <Input id="enddatum" type="date" value={formData.enddatum} onChange={e => setFormData(p => ({ ...p, enddatum: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_tn">Max. Teilnehmer</Label>
              <Input id="max_tn" type="number" min="0" value={formData.maximale_teilnehmer} onChange={e => setFormData(p => ({ ...p, maximale_teilnehmer: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preis">Preis (EUR)</Label>
              <Input id="preis" type="number" min="0" step="0.01" value={formData.preis} onChange={e => setFormData(p => ({ ...p, preis: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Dozent</Label>
            <Select value={formData.dozent || 'none'} onValueChange={v => setFormData(p => ({ ...p, dozent: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Dozent wählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">– Kein Dozent –</SelectItem>
                {dozenten.map(d => (
                  <SelectItem key={d.record_id} value={d.record_id}>
                    {`${d.fields.vorname || ''} ${d.fields.nachname || ''}`.trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Raum</Label>
            <Select value={formData.raum || 'none'} onValueChange={v => setFormData(p => ({ ...p, raum: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Raum wählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">– Kein Raum –</SelectItem>
                {raeume.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.raumname || '(Ohne Name)'}{r.fields.gebaeude ? ` (${r.fields.gebaeude})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : (isEditing ? 'Speichern' : 'Erstellen')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// --- Kurs Detail Dialog ---
function KursDetailDialog({
  record, onClose, dozentMap, raumMap, teilnehmerMap, anmeldungen, onEdit, onDelete, onAddAnmeldung,
}: {
  record: Kurse | null
  onClose: () => void
  dozentMap: Map<string, Dozenten>
  raumMap: Map<string, Raeume>
  teilnehmerMap: Map<string, Teilnehmer>
  anmeldungen: Anmeldungen[]
  onEdit: (k: Kurse) => void
  onDelete: (k: Kurse) => void
  onAddAnmeldung: () => void
}) {
  if (!record) return null
  const dozentId = extractRecordId(record.fields.dozent)
  const dozent = dozentId ? dozentMap.get(dozentId) : null
  const raumId = extractRecordId(record.fields.raum)
  const raum = raumId ? raumMap.get(raumId) : null

  return (
    <Dialog open={!!record} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{record.fields.titel || '(Ohne Titel)'}</DialogTitle>
          <DialogDescription>{record.fields.beschreibung || 'Keine Beschreibung'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            {record.fields.startdatum && (
              <div><span className="text-muted-foreground">Start:</span> {format(parseISO(record.fields.startdatum), 'dd.MM.yyyy', { locale: de })}</div>
            )}
            {record.fields.enddatum && (
              <div><span className="text-muted-foreground">Ende:</span> {format(parseISO(record.fields.enddatum), 'dd.MM.yyyy', { locale: de })}</div>
            )}
            {record.fields.maximale_teilnehmer != null && (
              <div><span className="text-muted-foreground">Max. Teilnehmer:</span> {record.fields.maximale_teilnehmer}</div>
            )}
            {record.fields.preis != null && (
              <div><span className="text-muted-foreground">Preis:</span> {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(record.fields.preis)}</div>
            )}
            {dozent && (
              <div><span className="text-muted-foreground">Dozent:</span> {dozent.fields.vorname} {dozent.fields.nachname}</div>
            )}
            {raum && (
              <div><span className="text-muted-foreground">Raum:</span> {raum.fields.raumname}</div>
            )}
          </div>

          {/* Enrolled participants */}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Anmeldungen ({anmeldungen.length})</h3>
              <Button size="sm" variant="outline" onClick={onAddAnmeldung}>
                <UserPlus className="h-3 w-3 mr-1" /> Anmelden
              </Button>
            </div>
            {anmeldungen.length === 0 ? (
              <p className="text-muted-foreground text-xs">Noch keine Anmeldungen.</p>
            ) : (
              <div className="space-y-1">
                {anmeldungen.map(a => {
                  const tnId = extractRecordId(a.fields.teilnehmer)
                  const tn = tnId ? teilnehmerMap.get(tnId) : null
                  return (
                    <div key={a.record_id} className="flex items-center justify-between py-1.5 text-xs">
                      <span>{tn ? `${tn.fields.vorname} ${tn.fields.nachname}` : '–'}</span>
                      <Badge variant={a.fields.bezahlt ? 'default' : 'secondary'} className="text-[10px]">
                        {a.fields.bezahlt ? 'Bezahlt' : 'Offen'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(record)}>
            <Trash2 className="h-4 w-4 mr-1" /> Löschen
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(record)}>
            <Pencil className="h-4 w-4 mr-1" /> Bearbeiten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PageLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
      </div>
    </div>
  )
}

function PageError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-lg font-semibold">Fehler beim Laden</h2>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <Button variant="outline" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  )
}

function EmptyState({ message, actionLabel, onAction }: { message: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <p className="text-muted-foreground">{message}</p>
      <Button onClick={onAction}><Plus className="h-4 w-4 mr-2" /> {actionLabel}</Button>
    </div>
  )
}
