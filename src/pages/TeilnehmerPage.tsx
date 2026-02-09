import { useState, useEffect, useMemo } from 'react'
import type { Teilnehmer } from '@/types/app'
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
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { toast } from 'sonner'

export function TeilnehmerPage() {
  const [records, setRecords] = useState<Teilnehmer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [editRecord, setEditRecord] = useState<Teilnehmer | null>(null)
  const [deleteRecord, setDeleteRecord] = useState<Teilnehmer | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  async function loadData() {
    try { setLoading(true); setError(null); setRecords(await LivingAppsService.getTeilnehmer()) } catch (err) { setError(err instanceof Error ? err : new Error('Fehler')) } finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const sorted = useMemo(() => [...records].sort((a, b) => (a.fields.nachname || '').localeCompare(b.fields.nachname || '')), [records])

  async function handleDelete() {
    if (!deleteRecord) return
    try {
      await LivingAppsService.deleteTeilnehmerEntry(deleteRecord.record_id)
      toast.success(`"${deleteRecord.fields.vorname} ${deleteRecord.fields.nachname}" gelöscht`)
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
        <h1 className="text-2xl font-bold">Teilnehmer</h1>
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="h-4 w-4" /> Neuer Teilnehmer</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : sorted.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground mb-4">Noch keine Teilnehmer vorhanden</p><Button onClick={() => setShowCreate(true)}>Ersten Teilnehmer anlegen</Button></CardContent></Card>
      ) : (
        <>
          <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vorname</TableHead>
                    <TableHead>Nachname</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Geburtsdatum</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map(r => (
                    <TableRow key={r.record_id} className="hover:bg-muted/50">
                      <TableCell>{r.fields.vorname || '-'}</TableCell>
                      <TableCell className="font-medium">{r.fields.nachname || '-'}</TableCell>
                      <TableCell>{r.fields.email || '-'}</TableCell>
                      <TableCell>{r.fields.telefon || '-'}</TableCell>
                      <TableCell>{r.fields.geburtsdatum ? format(parseISO(r.fields.geburtsdatum), 'dd.MM.yyyy', { locale: de }) : '-'}</TableCell>
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
                      <div className="font-semibold">{r.fields.vorname} {r.fields.nachname}</div>
                      {r.fields.email && <div className="text-sm text-muted-foreground">{r.fields.email}</div>}
                      {r.fields.telefon && <div className="text-sm text-muted-foreground">{r.fields.telefon}</div>}
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

      <TeilnehmerDialog open={showCreate || !!editRecord} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditRecord(null) } }} record={editRecord} onSuccess={loadData} />

      <AlertDialog open={!!deleteRecord} onOpenChange={(o) => !o && setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Teilnehmer löschen?</AlertDialogTitle>
            <AlertDialogDescription>Möchtest du den Teilnehmer &quot;{deleteRecord?.fields.vorname} {deleteRecord?.fields.nachname}&quot; wirklich löschen?</AlertDialogDescription>
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

function TeilnehmerDialog({ open, onOpenChange, record, onSuccess }: {
  open: boolean; onOpenChange: (o: boolean) => void; record: Teilnehmer | null; onSuccess: () => void
}) {
  const isEditing = !!record
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ vorname: '', nachname: '', email: '', telefon: '', geburtsdatum: '' })

  useEffect(() => {
    if (open) {
      setForm(record ? {
        vorname: record.fields.vorname || '',
        nachname: record.fields.nachname || '',
        email: record.fields.email || '',
        telefon: record.fields.telefon || '',
        geburtsdatum: record.fields.geburtsdatum?.split('T')[0] || '',
      } : { vorname: '', nachname: '', email: '', telefon: '', geburtsdatum: '' })
    }
  }, [open, record])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const data: Teilnehmer['fields'] = {
        vorname: form.vorname,
        nachname: form.nachname,
        email: form.email || undefined,
        telefon: form.telefon || undefined,
        geburtsdatum: form.geburtsdatum || undefined,
      }
      if (isEditing) {
        await LivingAppsService.updateTeilnehmerEntry(record!.record_id, data)
        toast.success('Teilnehmer aktualisiert')
      } else {
        await LivingAppsService.createTeilnehmerEntry(data)
        toast.success('Teilnehmer erstellt')
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(`Fehler: ${err instanceof Error ? err.message : 'Unbekannt'}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{isEditing ? 'Teilnehmer bearbeiten' : 'Neuer Teilnehmer'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Vorname *</Label><Input value={form.vorname} onChange={e => setForm(p => ({ ...p, vorname: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Nachname *</Label><Input value={form.nachname} onChange={e => setForm(p => ({ ...p, nachname: e.target.value }))} required /></div>
          </div>
          <div className="space-y-2"><Label>E-Mail</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Telefon</Label><Input type="tel" value={form.telefon} onChange={e => setForm(p => ({ ...p, telefon: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Geburtsdatum</Label><Input type="date" value={form.geburtsdatum} onChange={e => setForm(p => ({ ...p, geburtsdatum: e.target.value }))} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
