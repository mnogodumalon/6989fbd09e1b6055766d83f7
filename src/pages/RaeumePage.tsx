import { useState, useEffect, useMemo } from 'react'
import type { Raeume } from '@/types/app'
import { LivingAppsService } from '@/services/livingAppsService'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export function RaeumePage() {
  const [records, setRecords] = useState<Raeume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [editRecord, setEditRecord] = useState<Raeume | null>(null)
  const [deleteRecord, setDeleteRecord] = useState<Raeume | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  async function loadData() {
    try { setLoading(true); setError(null); setRecords(await LivingAppsService.getRaeume()) } catch (err) { setError(err instanceof Error ? err : new Error('Fehler')) } finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const sorted = useMemo(() => [...records].sort((a, b) => (a.fields.raumname || '').localeCompare(b.fields.raumname || '')), [records])

  async function handleDelete() {
    if (!deleteRecord) return
    try {
      await LivingAppsService.deleteRaeumeEntry(deleteRecord.record_id)
      toast.success(`"${deleteRecord.fields.raumname}" gelöscht`)
      setDeleteRecord(null)
      loadData()
    } catch { toast.error('Fehler beim Löschen') }
  }

  if (error) {
    return (<div className="flex flex-col items-center justify-center py-20 gap-4"><AlertCircle className="h-12 w-12 text-destructive" /><p className="text-muted-foreground">{error.message}</p><Button variant="outline" onClick={loadData}>Erneut versuchen</Button></div>)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Räume</h1>
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="h-4 w-4" /> Neuer Raum</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : sorted.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground mb-4">Noch keine Räume vorhanden</p><Button onClick={() => setShowCreate(true)}>Ersten Raum anlegen</Button></CardContent></Card>
      ) : (
        <>
          <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Raumname</TableHead>
                    <TableHead>Gebäude</TableHead>
                    <TableHead>Kapazität</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map(r => (
                    <TableRow key={r.record_id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{r.fields.raumname || '-'}</TableCell>
                      <TableCell>{r.fields.gebaeude || '-'}</TableCell>
                      <TableCell>{r.fields.kapazitaet != null ? r.fields.kapazitaet : '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditRecord(r)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteRecord(r)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
          <div className="md:hidden space-y-3">
            {sorted.map(r => (
              <Card key={r.record_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{r.fields.raumname || 'Unbenannt'}</div>
                      {r.fields.gebaeude && <div className="text-sm text-muted-foreground">{r.fields.gebaeude}</div>}
                      {r.fields.kapazitaet != null && <div className="text-sm text-muted-foreground">Kapazität: {r.fields.kapazitaet}</div>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => setEditRecord(r)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteRecord(r)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <RaumDialog open={showCreate || !!editRecord} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditRecord(null) } }} record={editRecord} onSuccess={loadData} />

      <AlertDialog open={!!deleteRecord} onOpenChange={(o) => !o && setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Raum löschen?</AlertDialogTitle>
            <AlertDialogDescription>Möchtest du den Raum &quot;{deleteRecord?.fields.raumname}&quot; wirklich löschen?</AlertDialogDescription>
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

function RaumDialog({ open, onOpenChange, record, onSuccess }: {
  open: boolean; onOpenChange: (o: boolean) => void; record: Raeume | null; onSuccess: () => void
}) {
  const isEditing = !!record
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ raumname: '', gebaeude: '', kapazitaet: '' })

  useEffect(() => {
    if (open) {
      setForm(record ? {
        raumname: record.fields.raumname || '',
        gebaeude: record.fields.gebaeude || '',
        kapazitaet: record.fields.kapazitaet?.toString() || '',
      } : { raumname: '', gebaeude: '', kapazitaet: '' })
    }
  }, [open, record])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const data: Raeume['fields'] = {
        raumname: form.raumname,
        gebaeude: form.gebaeude || undefined,
        kapazitaet: form.kapazitaet ? Number(form.kapazitaet) : undefined,
      }
      if (isEditing) {
        await LivingAppsService.updateRaeumeEntry(record!.record_id, data)
        toast.success('Raum aktualisiert')
      } else {
        await LivingAppsService.createRaeumeEntry(data)
        toast.success('Raum erstellt')
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(`Fehler: ${err instanceof Error ? err.message : 'Unbekannt'}`)
    } finally { setSubmitting(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{isEditing ? 'Raum bearbeiten' : 'Neuer Raum'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Raumname *</Label><Input value={form.raumname} onChange={e => setForm(p => ({ ...p, raumname: e.target.value }))} required /></div>
          <div className="space-y-2"><Label>Gebäude</Label><Input value={form.gebaeude} onChange={e => setForm(p => ({ ...p, gebaeude: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Kapazität</Label><Input type="number" min="0" value={form.kapazitaet} onChange={e => setForm(p => ({ ...p, kapazitaet: e.target.value }))} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
