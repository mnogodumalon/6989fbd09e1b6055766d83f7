import { useState, useEffect, useMemo } from 'react'
import type { Kurse, Dozenten, Raeume, Anmeldungen } from '@/types/app'
import { APP_IDS } from '@/types/app'
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { toast } from 'sonner'

export function KursePage() {
  const [kurse, setKurse] = useState<Kurse[]>([])
  const [dozenten, setDozenten] = useState<Dozenten[]>([])
  const [raeume, setRaeume] = useState<Raeume[]>([])
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [editRecord, setEditRecord] = useState<Kurse | null>(null)
  const [deleteRecord, setDeleteRecord] = useState<Kurse | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const [k, d, r, a] = await Promise.all([
        LivingAppsService.getKurse(),
        LivingAppsService.getDozenten(),
        LivingAppsService.getRaeume(),
        LivingAppsService.getAnmeldungen(),
      ])
      setKurse(k)
      setDozenten(d)
      setRaeume(r)
      setAnmeldungen(a)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const dozentMap = useMemo(() => {
    const m = new Map<string, Dozenten>()
    dozenten.forEach(d => m.set(d.record_id, d))
    return m
  }, [dozenten])

  const enrollmentMap = useMemo(() => {
    const m = new Map<string, number>()
    anmeldungen.forEach(a => {
      const kId = extractRecordId(a.fields.kurs)
      if (!kId) return
      m.set(kId, (m.get(kId) || 0) + 1)
    })
    return m
  }, [anmeldungen])

  const sorted = useMemo(() =>
    [...kurse].sort((a, b) => (b.fields.startdatum || '').localeCompare(a.fields.startdatum || '')),
    [kurse]
  )

  async function handleDelete() {
    if (!deleteRecord) return
    try {
      await LivingAppsService.deleteKurseEntry(deleteRecord.record_id)
      toast.success(`"${deleteRecord.fields.titel}" gelöscht`)
      setDeleteRecord(null)
      loadData()
    } catch (err) {
      toast.error('Fehler beim Löschen')
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">{error.message}</p>
        <Button variant="outline" onClick={loadData}>Erneut versuchen</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kurse</h1>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Neuer Kurs
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Noch keine Kurse vorhanden</p>
            <Button onClick={() => setShowCreate(true)}>Ersten Kurs erstellen</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kurstitel</TableHead>
                    <TableHead>Startdatum</TableHead>
                    <TableHead>Enddatum</TableHead>
                    <TableHead>Dozent</TableHead>
                    <TableHead>Plätze</TableHead>
                    <TableHead>Preis</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map(k => {
                    const dozentId = extractRecordId(k.fields.dozent)
                    const dozent = dozentId ? dozentMap.get(dozentId) : null
                    const enrolled = enrollmentMap.get(k.record_id) || 0
                    return (
                      <TableRow key={k.record_id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{k.fields.titel || '-'}</TableCell>
                        <TableCell>{k.fields.startdatum ? format(parseISO(k.fields.startdatum), 'dd.MM.yyyy', { locale: de }) : '-'}</TableCell>
                        <TableCell>{k.fields.enddatum ? format(parseISO(k.fields.enddatum), 'dd.MM.yyyy', { locale: de }) : '-'}</TableCell>
                        <TableCell>{dozent ? `${dozent.fields.vorname} ${dozent.fields.nachname}` : '-'}</TableCell>
                        <TableCell>{enrolled} / {k.fields.maximale_teilnehmer || '-'}</TableCell>
                        <TableCell>{k.fields.preis != null ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(k.fields.preis) : '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setEditRecord(k)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteRecord(k)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {sorted.map(k => {
              const dozentId = extractRecordId(k.fields.dozent)
              const dozent = dozentId ? dozentMap.get(dozentId) : null
              const enrolled = enrollmentMap.get(k.record_id) || 0
              return (
                <Card key={k.record_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{k.fields.titel || 'Unbenannt'}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {k.fields.startdatum ? format(parseISO(k.fields.startdatum), 'dd.MM.yyyy') : '-'} – {k.fields.enddatum ? format(parseISO(k.fields.enddatum), 'dd.MM.yyyy') : '-'}
                        </div>
                        {dozent && <div className="text-sm text-muted-foreground">{dozent.fields.vorname} {dozent.fields.nachname}</div>}
                        <div className="text-sm mt-1">
                          <span className="text-muted-foreground">{enrolled} / {k.fields.maximale_teilnehmer || '?'} Plätze</span>
                          {k.fields.preis != null && <span className="ml-3 font-medium">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(k.fields.preis)}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => setEditRecord(k)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteRecord(k)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      <KursDialog
        open={showCreate || !!editRecord}
        onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditRecord(null) } }}
        record={editRecord}
        dozenten={dozenten}
        raeume={raeume}
        onSuccess={loadData}
      />

      <AlertDialog open={!!deleteRecord} onOpenChange={(open) => !open && setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kurs löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du den Kurs &quot;{deleteRecord?.fields.titel}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function KursDialog({ open, onOpenChange, record, dozenten, raeume, onSuccess }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: Kurse | null
  dozenten: Dozenten[]
  raeume: Raeume[]
  onSuccess: () => void
}) {
  const isEditing = !!record
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    titel: '',
    beschreibung: '',
    startdatum: new Date().toISOString().split('T')[0],
    enddatum: '',
    maximale_teilnehmer: '',
    preis: '',
    dozent: '',
    raum: '',
  })

  useEffect(() => {
    if (open) {
      if (record) {
        setForm({
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
        setForm({
          titel: '',
          beschreibung: '',
          startdatum: new Date().toISOString().split('T')[0],
          enddatum: '',
          maximale_teilnehmer: '',
          preis: '',
          dozent: '',
          raum: '',
        })
      }
    }
  }, [open, record])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const data: Kurse['fields'] = {
        titel: form.titel,
        beschreibung: form.beschreibung || undefined,
        startdatum: form.startdatum || undefined,
        enddatum: form.enddatum || undefined,
        maximale_teilnehmer: form.maximale_teilnehmer ? Number(form.maximale_teilnehmer) : undefined,
        preis: form.preis ? Number(form.preis) : undefined,
        dozent: form.dozent ? createRecordUrl(APP_IDS.DOZENTEN, form.dozent) : undefined,
        raum: form.raum ? createRecordUrl(APP_IDS.RAEUME, form.raum) : undefined,
      }
      if (isEditing) {
        await LivingAppsService.updateKurseEntry(record!.record_id, data)
        toast.success('Kurs aktualisiert')
      } else {
        await LivingAppsService.createKurseEntry(data)
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
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Kurstitel *</Label>
            <Input value={form.titel} onChange={e => setForm(p => ({ ...p, titel: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>Beschreibung</Label>
            <Textarea value={form.beschreibung} onChange={e => setForm(p => ({ ...p, beschreibung: e.target.value }))} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Startdatum</Label>
              <Input type="date" value={form.startdatum} onChange={e => setForm(p => ({ ...p, startdatum: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Enddatum</Label>
              <Input type="date" value={form.enddatum} onChange={e => setForm(p => ({ ...p, enddatum: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max. Teilnehmer</Label>
              <Input type="number" min="0" value={form.maximale_teilnehmer} onChange={e => setForm(p => ({ ...p, maximale_teilnehmer: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Preis (EUR)</Label>
              <Input type="number" min="0" step="0.01" value={form.preis} onChange={e => setForm(p => ({ ...p, preis: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Dozent</Label>
            <Select value={form.dozent || 'none'} onValueChange={v => setForm(p => ({ ...p, dozent: v === 'none' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder="Dozent wählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Dozent</SelectItem>
                {dozenten.map(d => (
                  <SelectItem key={d.record_id} value={d.record_id}>{d.fields.vorname} {d.fields.nachname}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Raum</Label>
            <Select value={form.raum || 'none'} onValueChange={v => setForm(p => ({ ...p, raum: v === 'none' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder="Raum wählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Raum</SelectItem>
                {raeume.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>{r.fields.raumname}{r.fields.gebaeude ? ` (${r.fields.gebaeude})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
