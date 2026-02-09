import { useState, useEffect, useMemo } from 'react'
import type { Anmeldungen, Teilnehmer, Kurse } from '@/types/app'
import { APP_IDS } from '@/types/app'
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { toast } from 'sonner'

export function AnmeldungenPage() {
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([])
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([])
  const [kurse, setKurse] = useState<Kurse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [editRecord, setEditRecord] = useState<Anmeldungen | null>(null)
  const [deleteRecord, setDeleteRecord] = useState<Anmeldungen | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  async function loadData() {
    try {
      setLoading(true); setError(null)
      const [a, t, k] = await Promise.all([
        LivingAppsService.getAnmeldungen(),
        LivingAppsService.getTeilnehmer(),
        LivingAppsService.getKurse(),
      ])
      setAnmeldungen(a); setTeilnehmer(t); setKurse(k)
    } catch (err) { setError(err instanceof Error ? err : new Error('Fehler')) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const tnMap = useMemo(() => { const m = new Map<string, Teilnehmer>(); teilnehmer.forEach(t => m.set(t.record_id, t)); return m }, [teilnehmer])
  const kursMap = useMemo(() => { const m = new Map<string, Kurse>(); kurse.forEach(k => m.set(k.record_id, k)); return m }, [kurse])

  const sorted = useMemo(() =>
    [...anmeldungen].sort((a, b) => (b.fields.anmeldedatum || b.createdat).localeCompare(a.fields.anmeldedatum || a.createdat)),
    [anmeldungen]
  )

  function resolveName(a: Anmeldungen) {
    const tnId = extractRecordId(a.fields.teilnehmer)
    const tn = tnId ? tnMap.get(tnId) : null
    return tn ? `${tn.fields.vorname || ''} ${tn.fields.nachname || ''}`.trim() : 'Unbekannt'
  }

  function resolveKurs(a: Anmeldungen) {
    const kId = extractRecordId(a.fields.kurs)
    const k = kId ? kursMap.get(kId) : null
    return k?.fields.titel || 'Unbekannt'
  }

  async function handleDelete() {
    if (!deleteRecord) return
    try {
      await LivingAppsService.deleteAnmeldungenEntry(deleteRecord.record_id)
      toast.success('Anmeldung gelöscht')
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
        <h1 className="text-2xl font-bold">Anmeldungen</h1>
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="h-4 w-4" /> Neue Anmeldung</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : sorted.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground mb-4">Noch keine Anmeldungen vorhanden</p><Button onClick={() => setShowCreate(true)}>Erste Anmeldung erstellen</Button></CardContent></Card>
      ) : (
        <>
          <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teilnehmer</TableHead>
                    <TableHead>Kurs</TableHead>
                    <TableHead>Anmeldedatum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map(a => (
                    <TableRow key={a.record_id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{resolveName(a)}</TableCell>
                      <TableCell>{resolveKurs(a)}</TableCell>
                      <TableCell>{a.fields.anmeldedatum ? format(parseISO(a.fields.anmeldedatum), 'dd.MM.yyyy', { locale: de }) : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={a.fields.bezahlt ? 'default' : 'secondary'} className={a.fields.bezahlt ? 'bg-[hsl(152_55%_42%)] hover:bg-[hsl(152_55%_38%)] text-white' : ''}>
                          {a.fields.bezahlt ? 'Bezahlt' : 'Offen'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditRecord(a)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteRecord(a)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
          <div className="md:hidden space-y-3">
            {sorted.map(a => (
              <Card key={a.record_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{resolveName(a)}</div>
                      <div className="text-sm text-muted-foreground">{resolveKurs(a)}</div>
                      <div className="text-sm text-muted-foreground">{a.fields.anmeldedatum ? format(parseISO(a.fields.anmeldedatum), 'dd.MM.yyyy') : '-'}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={a.fields.bezahlt ? 'default' : 'secondary'} className={a.fields.bezahlt ? 'bg-[hsl(152_55%_42%)] text-white text-xs' : 'text-xs'}>
                        {a.fields.bezahlt ? 'Bezahlt' : 'Offen'}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => setEditRecord(a)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteRecord(a)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <AnmeldungDialog open={showCreate || !!editRecord} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditRecord(null) } }} record={editRecord} teilnehmer={teilnehmer} kurse={kurse} onSuccess={loadData} />

      <AlertDialog open={!!deleteRecord} onOpenChange={(o) => !o && setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anmeldung löschen?</AlertDialogTitle>
            <AlertDialogDescription>Möchtest du diese Anmeldung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</AlertDialogDescription>
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

function AnmeldungDialog({ open, onOpenChange, record, teilnehmer, kurse, onSuccess }: {
  open: boolean; onOpenChange: (o: boolean) => void; record: Anmeldungen | null; teilnehmer: Teilnehmer[]; kurse: Kurse[]; onSuccess: () => void
}) {
  const isEditing = !!record
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ teilnehmer: '', kurs: '', anmeldedatum: new Date().toISOString().split('T')[0], bezahlt: false })

  useEffect(() => {
    if (open) {
      setForm(record ? {
        teilnehmer: extractRecordId(record.fields.teilnehmer) || '',
        kurs: extractRecordId(record.fields.kurs) || '',
        anmeldedatum: record.fields.anmeldedatum?.split('T')[0] || '',
        bezahlt: record.fields.bezahlt === true,
      } : { teilnehmer: '', kurs: '', anmeldedatum: new Date().toISOString().split('T')[0], bezahlt: false })
    }
  }, [open, record])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.teilnehmer || !form.kurs) { toast.error('Bitte Teilnehmer und Kurs auswählen'); return }
    setSubmitting(true)
    try {
      const data: Anmeldungen['fields'] = {
        teilnehmer: createRecordUrl(APP_IDS.TEILNEHMER, form.teilnehmer),
        kurs: createRecordUrl(APP_IDS.KURSE, form.kurs),
        anmeldedatum: form.anmeldedatum || undefined,
        bezahlt: form.bezahlt,
      }
      if (isEditing) {
        await LivingAppsService.updateAnmeldungenEntry(record!.record_id, data)
        toast.success('Anmeldung aktualisiert')
      } else {
        await LivingAppsService.createAnmeldungenEntry(data)
        toast.success('Anmeldung erstellt')
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
        <DialogHeader><DialogTitle>{isEditing ? 'Anmeldung bearbeiten' : 'Neue Anmeldung'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Teilnehmer *</Label>
            <Select value={form.teilnehmer || 'none'} onValueChange={v => setForm(p => ({ ...p, teilnehmer: v === 'none' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder="Teilnehmer wählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bitte wählen...</SelectItem>
                {teilnehmer.map(t => <SelectItem key={t.record_id} value={t.record_id}>{t.fields.vorname} {t.fields.nachname}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kurs *</Label>
            <Select value={form.kurs || 'none'} onValueChange={v => setForm(p => ({ ...p, kurs: v === 'none' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder="Kurs wählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bitte wählen...</SelectItem>
                {kurse.map(k => <SelectItem key={k.record_id} value={k.record_id}>{k.fields.titel}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Anmeldedatum</Label>
            <Input type="date" value={form.anmeldedatum} onChange={e => setForm(p => ({ ...p, anmeldedatum: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="bezahlt-edit" checked={form.bezahlt} onCheckedChange={(v) => setForm(p => ({ ...p, bezahlt: v === true }))} />
            <Label htmlFor="bezahlt-edit" className="text-sm">Bezahlt</Label>
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
