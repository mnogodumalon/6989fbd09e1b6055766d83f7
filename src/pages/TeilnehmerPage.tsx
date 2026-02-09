import { useState, useEffect, useMemo } from 'react'
import type { Teilnehmer, Anmeldungen, Kurse } from '@/types/app'
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { Plus, Pencil, Trash2, AlertCircle, Search } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { toast } from 'sonner'

export function TeilnehmerPage() {
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([])
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([])
  const [kurse, setKurse] = useState<Kurse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [search, setSearch] = useState('')
  const [editRecord, setEditRecord] = useState<Teilnehmer | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteRecord, setDeleteRecord] = useState<Teilnehmer | null>(null)
  const [detailRecord, setDetailRecord] = useState<Teilnehmer | null>(null)

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const [t, a, k] = await Promise.all([
        LivingAppsService.getTeilnehmer(),
        LivingAppsService.getAnmeldungen(),
        LivingAppsService.getKurse(),
      ])
      setTeilnehmer(t)
      setAnmeldungen(a)
      setKurse(k)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const kursMap = useMemo(() => {
    const map = new Map<string, Kurse>()
    kurse.forEach(k => map.set(k.record_id, k))
    return map
  }, [kurse])

  const anmeldungenPerTeilnehmer = useMemo(() => {
    const map = new Map<string, Anmeldungen[]>()
    anmeldungen.forEach(a => {
      const tnId = extractRecordId(a.fields.teilnehmer)
      if (!tnId) return
      if (!map.has(tnId)) map.set(tnId, [])
      map.get(tnId)!.push(a)
    })
    return map
  }, [anmeldungen])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return teilnehmer.filter(t => {
      const name = `${t.fields.vorname || ''} ${t.fields.nachname || ''}`.toLowerCase()
      const email = (t.fields.email || '').toLowerCase()
      return name.includes(q) || email.includes(q)
    })
  }, [teilnehmer, search])

  async function handleDelete() {
    if (!deleteRecord) return
    await LivingAppsService.deleteTeilnehmerEntry(deleteRecord.record_id)
    setDeleteRecord(null)
    setDetailRecord(null)
    loadData()
  }

  if (loading) return <PageLoading />
  if (error) return <PageError error={error} onRetry={loadData} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teilnehmer</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Neuer Teilnehmer
        </Button>
      </div>

      {teilnehmer.length === 0 ? (
        <EmptyState onAction={() => setShowCreateDialog(true)} />
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nach Name oder E-Mail suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Mobile: Card list */}
          <div className="md:hidden space-y-3">
            {filtered.map(t => {
              const name = `${t.fields.vorname || ''} ${t.fields.nachname || ''}`.trim()
              return (
                <div
                  key={t.record_id}
                  className="bg-card rounded-lg border p-4 cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => setDetailRecord(t)}
                >
                  <p className="font-medium">{name || '(Ohne Name)'}</p>
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    {t.fields.email && <p>{t.fields.email}</p>}
                    {t.fields.telefon && <p>{t.fields.telefon}</p>}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Keine Teilnehmer gefunden.</p>}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Geburtsdatum</TableHead>
                  <TableHead className="w-[100px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(t => {
                  const name = `${t.fields.vorname || ''} ${t.fields.nachname || ''}`.trim()
                  return (
                    <TableRow key={t.record_id} className="cursor-pointer" onClick={() => setDetailRecord(t)}>
                      <TableCell className="font-medium">{name || '(Ohne Name)'}</TableCell>
                      <TableCell className="text-muted-foreground">{t.fields.email || '–'}</TableCell>
                      <TableCell className="text-muted-foreground">{t.fields.telefon || '–'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.fields.geburtsdatum ? format(parseISO(t.fields.geburtsdatum), 'dd.MM.yyyy', { locale: de }) : '–'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditRecord(t)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteRecord(t)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Keine Teilnehmer gefunden.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <TeilnehmerDialog
        open={showCreateDialog || !!editRecord}
        onOpenChange={open => { if (!open) { setShowCreateDialog(false); setEditRecord(null) } }}
        record={editRecord}
        onSuccess={() => { setShowCreateDialog(false); setEditRecord(null); loadData() }}
      />

      <TeilnehmerDetailDialog
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
        anmeldungen={anmeldungenPerTeilnehmer.get(detailRecord?.record_id || '') || []}
        kursMap={kursMap}
        onEdit={t => { setDetailRecord(null); setEditRecord(t) }}
        onDelete={t => { setDetailRecord(null); setDeleteRecord(t) }}
      />

      <DeleteConfirmDialog
        open={!!deleteRecord}
        onOpenChange={open => { if (!open) setDeleteRecord(null) }}
        recordName={deleteRecord ? `${deleteRecord.fields.vorname || ''} ${deleteRecord.fields.nachname || ''}`.trim() : ''}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function TeilnehmerDialog({
  open, onOpenChange, record, onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: Teilnehmer | null
  onSuccess: () => void
}) {
  const isEditing = !!record
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    vorname: '', nachname: '', email: '', telefon: '', geburtsdatum: '',
  })

  useEffect(() => {
    if (open) {
      if (record) {
        setFormData({
          vorname: record.fields.vorname || '',
          nachname: record.fields.nachname || '',
          email: record.fields.email || '',
          telefon: record.fields.telefon || '',
          geburtsdatum: record.fields.geburtsdatum?.split('T')[0] || '',
        })
      } else {
        setFormData({ vorname: '', nachname: '', email: '', telefon: '', geburtsdatum: '' })
      }
    }
  }, [open, record])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.vorname.trim() || !formData.nachname.trim()) {
      toast.error('Bitte Vor- und Nachname eingeben.')
      return
    }
    setSubmitting(true)
    try {
      const apiData: Teilnehmer['fields'] = {
        vorname: formData.vorname,
        nachname: formData.nachname,
        email: formData.email || undefined,
        telefon: formData.telefon || undefined,
        geburtsdatum: formData.geburtsdatum || undefined,
      }
      if (isEditing) {
        await LivingAppsService.updateTeilnehmerEntry(record!.record_id, apiData)
        toast.success('Teilnehmer aktualisiert')
      } else {
        await LivingAppsService.createTeilnehmerEntry(apiData)
        toast.success('Teilnehmer erstellt')
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Teilnehmer bearbeiten' : 'Neuer Teilnehmer'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Bearbeite die Teilnehmerdaten.' : 'Füge einen neuen Teilnehmer hinzu.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tn-vorname">Vorname *</Label>
              <Input id="tn-vorname" value={formData.vorname} onChange={e => setFormData(p => ({ ...p, vorname: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tn-nachname">Nachname *</Label>
              <Input id="tn-nachname" value={formData.nachname} onChange={e => setFormData(p => ({ ...p, nachname: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tn-email">E-Mail</Label>
            <Input id="tn-email" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tn-telefon">Telefon</Label>
            <Input id="tn-telefon" type="tel" value={formData.telefon} onChange={e => setFormData(p => ({ ...p, telefon: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tn-geb">Geburtsdatum</Label>
            <Input id="tn-geb" type="date" value={formData.geburtsdatum} onChange={e => setFormData(p => ({ ...p, geburtsdatum: e.target.value }))} />
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

function TeilnehmerDetailDialog({
  record, onClose, anmeldungen, kursMap, onEdit, onDelete,
}: {
  record: Teilnehmer | null
  onClose: () => void
  anmeldungen: Anmeldungen[]
  kursMap: Map<string, Kurse>
  onEdit: (t: Teilnehmer) => void
  onDelete: (t: Teilnehmer) => void
}) {
  if (!record) return null
  const name = `${record.fields.vorname || ''} ${record.fields.nachname || ''}`.trim()

  return (
    <Dialog open={!!record} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{name || '(Ohne Name)'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          {record.fields.email && <div><span className="text-muted-foreground">E-Mail:</span> {record.fields.email}</div>}
          {record.fields.telefon && <div><span className="text-muted-foreground">Telefon:</span> {record.fields.telefon}</div>}
          {record.fields.geburtsdatum && (
            <div><span className="text-muted-foreground">Geburtsdatum:</span> {format(parseISO(record.fields.geburtsdatum), 'dd.MM.yyyy', { locale: de })}</div>
          )}
          {anmeldungen.length > 0 && (
            <div className="pt-3 border-t">
              <h3 className="font-semibold mb-2">Anmeldungen ({anmeldungen.length})</h3>
              <div className="space-y-1">
                {anmeldungen.map(a => {
                  const kursId = extractRecordId(a.fields.kurs)
                  const kurs = kursId ? kursMap.get(kursId) : null
                  return (
                    <div key={a.record_id} className="flex items-center justify-between text-xs py-1">
                      <span>{kurs?.fields.titel || '–'}</span>
                      <Badge variant={a.fields.bezahlt ? 'default' : 'secondary'} className="text-[10px]">
                        {a.fields.bezahlt ? 'Bezahlt' : 'Offen'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
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
      <div className="flex items-center justify-between"><Skeleton className="h-8 w-36" /><Skeleton className="h-9 w-40" /></div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}

function PageError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <Button variant="outline" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  )
}

function EmptyState({ onAction }: { onAction: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <p className="text-muted-foreground">Noch keine Teilnehmer vorhanden.</p>
      <Button onClick={onAction}><Plus className="h-4 w-4 mr-2" /> Teilnehmer hinzufügen</Button>
    </div>
  )
}
