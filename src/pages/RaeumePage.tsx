import { useState, useEffect } from 'react'
import type { Raeume } from '@/types/app'
import { LivingAppsService } from '@/services/livingAppsService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export function RaeumePage() {
  const [raeume, setRaeume] = useState<Raeume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [editRecord, setEditRecord] = useState<Raeume | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteRecord, setDeleteRecord] = useState<Raeume | null>(null)
  const [detailRecord, setDetailRecord] = useState<Raeume | null>(null)

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const r = await LivingAppsService.getRaeume()
      setRaeume(r)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  async function handleDelete() {
    if (!deleteRecord) return
    await LivingAppsService.deleteRaeumeEntry(deleteRecord.record_id)
    setDeleteRecord(null)
    setDetailRecord(null)
    loadData()
  }

  if (loading) return <PageLoading />
  if (error) return <PageError error={error} onRetry={loadData} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Räume</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Neuer Raum
        </Button>
      </div>

      {raeume.length === 0 ? (
        <EmptyState onAction={() => setShowCreateDialog(true)} />
      ) : (
        <>
          {/* Mobile: Card list */}
          <div className="md:hidden space-y-3">
            {raeume.map(r => (
              <div
                key={r.record_id}
                className="bg-card rounded-lg border p-4 cursor-pointer hover:shadow-sm transition-shadow"
                onClick={() => setDetailRecord(r)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{r.fields.raumname || '(Ohne Name)'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.fields.gebaeude || '–'} · Kapazität: {r.fields.kapazitaet ?? '–'}
                    </p>
                  </div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditRecord(r)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteRecord(r)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Raumname</TableHead>
                  <TableHead>Gebäude</TableHead>
                  <TableHead>Kapazität</TableHead>
                  <TableHead className="w-[100px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {raeume.map(r => (
                  <TableRow key={r.record_id} className="cursor-pointer" onClick={() => setDetailRecord(r)}>
                    <TableCell className="font-medium">{r.fields.raumname || '(Ohne Name)'}</TableCell>
                    <TableCell className="text-muted-foreground">{r.fields.gebaeude || '–'}</TableCell>
                    <TableCell className="text-muted-foreground">{r.fields.kapazitaet ?? '–'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditRecord(r)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteRecord(r)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <RaumDialog
        open={showCreateDialog || !!editRecord}
        onOpenChange={open => { if (!open) { setShowCreateDialog(false); setEditRecord(null) } }}
        record={editRecord}
        onSuccess={() => { setShowCreateDialog(false); setEditRecord(null); loadData() }}
      />

      {/* Detail Dialog (simple for rooms) */}
      {detailRecord && (
        <Dialog open={!!detailRecord} onOpenChange={open => { if (!open) setDetailRecord(null) }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{detailRecord.fields.raumname || '(Ohne Name)'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Gebäude:</span> {detailRecord.fields.gebaeude || '–'}</div>
              <div><span className="text-muted-foreground">Kapazität:</span> {detailRecord.fields.kapazitaet ?? '–'}</div>
            </div>
            <DialogFooter>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setDeleteRecord(detailRecord); setDetailRecord(null) }}>
                <Trash2 className="h-4 w-4 mr-1" /> Löschen
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setEditRecord(detailRecord); setDetailRecord(null) }}>
                <Pencil className="h-4 w-4 mr-1" /> Bearbeiten
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <DeleteConfirmDialog
        open={!!deleteRecord}
        onOpenChange={open => { if (!open) setDeleteRecord(null) }}
        recordName={deleteRecord?.fields.raumname || ''}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function RaumDialog({
  open, onOpenChange, record, onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: Raeume | null
  onSuccess: () => void
}) {
  const isEditing = !!record
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    raumname: '', gebaeude: '', kapazitaet: '',
  })

  useEffect(() => {
    if (open) {
      if (record) {
        setFormData({
          raumname: record.fields.raumname || '',
          gebaeude: record.fields.gebaeude || '',
          kapazitaet: record.fields.kapazitaet?.toString() || '',
        })
      } else {
        setFormData({ raumname: '', gebaeude: '', kapazitaet: '' })
      }
    }
  }, [open, record])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.raumname.trim()) {
      toast.error('Bitte einen Raumnamen eingeben.')
      return
    }
    setSubmitting(true)
    try {
      const apiData: Raeume['fields'] = {
        raumname: formData.raumname,
        gebaeude: formData.gebaeude || undefined,
        kapazitaet: formData.kapazitaet ? Number(formData.kapazitaet) : undefined,
      }
      if (isEditing) {
        await LivingAppsService.updateRaeumeEntry(record!.record_id, apiData)
        toast.success('Raum aktualisiert')
      } else {
        await LivingAppsService.createRaeumeEntry(apiData)
        toast.success('Raum erstellt')
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Raum bearbeiten' : 'Neuer Raum'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Bearbeite die Raumdaten.' : 'Füge einen neuen Raum hinzu.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="raumname">Raumname *</Label>
            <Input id="raumname" value={formData.raumname} onChange={e => setFormData(p => ({ ...p, raumname: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gebaeude">Gebäude</Label>
            <Input id="gebaeude" value={formData.gebaeude} onChange={e => setFormData(p => ({ ...p, gebaeude: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kapazitaet">Kapazität</Label>
            <Input id="kapazitaet" type="number" min="0" value={formData.kapazitaet} onChange={e => setFormData(p => ({ ...p, kapazitaet: e.target.value }))} />
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

function PageLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><Skeleton className="h-8 w-28" /><Skeleton className="h-9 w-32" /></div>
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
      <p className="text-muted-foreground">Noch keine Räume vorhanden.</p>
      <Button onClick={onAction}><Plus className="h-4 w-4 mr-2" /> Raum erstellen</Button>
    </div>
  )
}
