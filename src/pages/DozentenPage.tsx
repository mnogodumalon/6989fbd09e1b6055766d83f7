import { useState, useEffect, useMemo } from 'react'
import type { Dozenten, Kurse } from '@/types/app'
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { Plus, Pencil, Trash2, AlertCircle, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'

export function DozentenPage() {
  const [dozenten, setDozenten] = useState<Dozenten[]>([])
  const [kurse, setKurse] = useState<Kurse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [editRecord, setEditRecord] = useState<Dozenten | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteRecord, setDeleteRecord] = useState<Dozenten | null>(null)
  const [detailRecord, setDetailRecord] = useState<Dozenten | null>(null)

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const [d, k] = await Promise.all([
        LivingAppsService.getDozenten(),
        LivingAppsService.getKurse(),
      ])
      setDozenten(d)
      setKurse(k)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const kursePerDozent = useMemo(() => {
    const map = new Map<string, Kurse[]>()
    kurse.forEach(k => {
      const dozentId = extractRecordId(k.fields.dozent)
      if (!dozentId) return
      if (!map.has(dozentId)) map.set(dozentId, [])
      map.get(dozentId)!.push(k)
    })
    return map
  }, [kurse])

  async function handleDelete() {
    if (!deleteRecord) return
    await LivingAppsService.deleteDozentenEntry(deleteRecord.record_id)
    setDeleteRecord(null)
    setDetailRecord(null)
    loadData()
  }

  if (loading) return <PageLoading />
  if (error) return <PageError error={error} onRetry={loadData} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dozenten</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Neuer Dozent
        </Button>
      </div>

      {dozenten.length === 0 ? (
        <EmptyState onAction={() => setShowCreateDialog(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dozenten.map(d => {
            const name = `${d.fields.vorname || ''} ${d.fields.nachname || ''}`.trim()
            const dKurse = kursePerDozent.get(d.record_id) || []
            return (
              <Card
                key={d.record_id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setDetailRecord(d)}
              >
                <CardContent className="py-4 px-5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-base">{name || '(Ohne Name)'}</p>
                      {d.fields.fachgebiet && (
                        <Badge variant="secondary" className="mt-1 text-xs">{d.fields.fachgebiet}</Badge>
                      )}
                      <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
                        {d.fields.email && (
                          <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {d.fields.email}</span>
                        )}
                        {d.fields.telefon && (
                          <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {d.fields.telefon}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {dKurse.length} {dKurse.length === 1 ? 'Kurs' : 'Kurse'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <DozentDialog
        open={showCreateDialog || !!editRecord}
        onOpenChange={open => { if (!open) { setShowCreateDialog(false); setEditRecord(null) } }}
        record={editRecord}
        onSuccess={() => { setShowCreateDialog(false); setEditRecord(null); loadData() }}
      />

      <DozentDetailDialog
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
        kurse={kursePerDozent.get(detailRecord?.record_id || '') || []}
        onEdit={d => { setDetailRecord(null); setEditRecord(d) }}
        onDelete={d => { setDetailRecord(null); setDeleteRecord(d) }}
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

function DozentDialog({
  open, onOpenChange, record, onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: Dozenten | null
  onSuccess: () => void
}) {
  const isEditing = !!record
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    vorname: '', nachname: '', email: '', telefon: '', fachgebiet: '',
  })

  useEffect(() => {
    if (open) {
      if (record) {
        setFormData({
          vorname: record.fields.vorname || '',
          nachname: record.fields.nachname || '',
          email: record.fields.email || '',
          telefon: record.fields.telefon || '',
          fachgebiet: record.fields.fachgebiet || '',
        })
      } else {
        setFormData({ vorname: '', nachname: '', email: '', telefon: '', fachgebiet: '' })
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
      const apiData: Dozenten['fields'] = {
        vorname: formData.vorname,
        nachname: formData.nachname,
        email: formData.email || undefined,
        telefon: formData.telefon || undefined,
        fachgebiet: formData.fachgebiet || undefined,
      }
      if (isEditing) {
        await LivingAppsService.updateDozentenEntry(record!.record_id, apiData)
        toast.success('Dozent aktualisiert')
      } else {
        await LivingAppsService.createDozentenEntry(apiData)
        toast.success('Dozent erstellt')
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
          <DialogTitle>{isEditing ? 'Dozent bearbeiten' : 'Neuer Dozent'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Bearbeite die Dozentendaten.' : 'Füge einen neuen Dozenten hinzu.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vorname">Vorname *</Label>
              <Input id="vorname" value={formData.vorname} onChange={e => setFormData(p => ({ ...p, vorname: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nachname">Nachname *</Label>
              <Input id="nachname" value={formData.nachname} onChange={e => setFormData(p => ({ ...p, nachname: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefon">Telefon</Label>
            <Input id="telefon" type="tel" value={formData.telefon} onChange={e => setFormData(p => ({ ...p, telefon: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fachgebiet">Fachgebiet</Label>
            <Input id="fachgebiet" value={formData.fachgebiet} onChange={e => setFormData(p => ({ ...p, fachgebiet: e.target.value }))} />
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

function DozentDetailDialog({
  record, onClose, kurse, onEdit, onDelete,
}: {
  record: Dozenten | null
  onClose: () => void
  kurse: Kurse[]
  onEdit: (d: Dozenten) => void
  onDelete: (d: Dozenten) => void
}) {
  if (!record) return null
  const name = `${record.fields.vorname || ''} ${record.fields.nachname || ''}`.trim()

  return (
    <Dialog open={!!record} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{name || '(Ohne Name)'}</DialogTitle>
          {record.fields.fachgebiet && <DialogDescription>{record.fields.fachgebiet}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-3 text-sm">
          {record.fields.email && (
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {record.fields.email}</div>
          )}
          {record.fields.telefon && (
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {record.fields.telefon}</div>
          )}
          {kurse.length > 0 && (
            <div className="pt-3 border-t">
              <h3 className="font-semibold mb-2">Kurse ({kurse.length})</h3>
              <div className="space-y-1">
                {kurse.map(k => (
                  <div key={k.record_id} className="text-xs py-1 text-muted-foreground">{k.fields.titel}</div>
                ))}
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
      <div className="flex items-center justify-between"><Skeleton className="h-8 w-32" /><Skeleton className="h-9 w-36" /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
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
      <p className="text-muted-foreground">Noch keine Dozenten vorhanden.</p>
      <Button onClick={onAction}><Plus className="h-4 w-4 mr-2" /> Dozent erstellen</Button>
    </div>
  )
}
