import { useState, useEffect, useMemo } from 'react';
import type { Anmeldungen, Kurse, Teilnehmer } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function AnmeldungenPage() {
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editRecord, setEditRecord] = useState<Anmeldungen | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<Anmeldungen | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function refreshData() {
    try {
      setLoading(true);
      setError(null);
      const [a, k, t] = await Promise.all([
        LivingAppsService.getAnmeldungen(),
        LivingAppsService.getKurse(),
        LivingAppsService.getTeilnehmer(),
      ]);
      setAnmeldungen(a);
      setKurse(k);
      setTeilnehmer(t);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshData(); }, []);

  const kursMap = useMemo(() => {
    const m = new Map<string, Kurse>();
    kurse.forEach((k) => m.set(k.record_id, k));
    return m;
  }, [kurse]);

  const teilnehmerMap = useMemo(() => {
    const m = new Map<string, Teilnehmer>();
    teilnehmer.forEach((t) => m.set(t.record_id, t));
    return m;
  }, [teilnehmer]);

  function getTeilnehmerName(a: Anmeldungen): string {
    const id = extractRecordId(a.fields.teilnehmer);
    if (!id) return '-';
    const t = teilnehmerMap.get(id);
    return t ? `${t.fields.vorname || ''} ${t.fields.nachname || ''}`.trim() || '-' : '-';
  }

  function getKursTitel(a: Anmeldungen): string {
    const id = extractRecordId(a.fields.kurs);
    if (!id) return '-';
    const k = kursMap.get(id);
    return k?.fields.titel || '-';
  }

  async function handleDelete() {
    if (!deleteRecord) return;
    setDeleting(true);
    try {
      await LivingAppsService.deleteAnmeldungenEntry(deleteRecord.record_id);
      toast.success('Anmeldung wurde gelöscht.');
      setDeleteRecord(null);
      refreshData();
    } catch {
      toast.error('Fehler beim Löschen der Anmeldung.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Anmeldungen</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription className="flex items-center gap-2">
            {error.message}
            <Button variant="outline" size="sm" onClick={refreshData}>Erneut versuchen</Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Anmeldungen</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Neue Anmeldung</span>
          <span className="sm:hidden">Neu</span>
        </Button>
      </div>

      {anmeldungen.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Noch keine Anmeldungen vorhanden.</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" /> Erste Anmeldung erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-3 font-medium">Teilnehmer</th>
                      <th className="p-3 font-medium">Kurs</th>
                      <th className="p-3 font-medium">Anmeldedatum</th>
                      <th className="p-3 font-medium text-center">Bezahlt</th>
                      <th className="p-3 font-medium text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anmeldungen.map((a) => (
                      <tr key={a.record_id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="p-3 font-medium">{getTeilnehmerName(a)}</td>
                        <td className="p-3 text-muted-foreground">{getKursTitel(a)}</td>
                        <td className="p-3">
                          {a.fields.anmeldedatum
                            ? format(parseISO(a.fields.anmeldedatum), 'dd.MM.yyyy', { locale: de })
                            : '-'}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={a.fields.bezahlt ? 'default' : 'secondary'}>
                            {a.fields.bezahlt ? 'Ja' : 'Nein'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setEditRecord(a)} aria-label="Bearbeiten">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteRecord(a)} aria-label="Löschen" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-2">
            {anmeldungen.map((a) => (
              <Card key={a.record_id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <p className="font-medium">{getTeilnehmerName(a)}</p>
                      <p className="text-sm text-muted-foreground">{getKursTitel(a)}</p>
                      <div className="flex items-center gap-2">
                        {a.fields.anmeldedatum && (
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(a.fields.anmeldedatum), 'dd.MM.yyyy', { locale: de })}
                          </span>
                        )}
                        <Badge variant={a.fields.bezahlt ? 'default' : 'secondary'} className="text-xs">
                          {a.fields.bezahlt ? 'Bezahlt' : 'Offen'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditRecord(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteRecord(a)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Create Dialog */}
      <AnmeldungDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        record={null}
        kurse={kurse}
        teilnehmer={teilnehmer}
        onSuccess={refreshData}
      />

      {/* Edit Dialog */}
      <AnmeldungDialog
        open={!!editRecord}
        onOpenChange={(open) => !open && setEditRecord(null)}
        record={editRecord}
        kurse={kurse}
        teilnehmer={teilnehmer}
        onSuccess={refreshData}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRecord} onOpenChange={(open) => !open && setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anmeldung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Anmeldung von &quot;{deleteRecord ? getTeilnehmerName(deleteRecord) : ''}&quot; für &quot;{deleteRecord ? getKursTitel(deleteRecord) : ''}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Löscht...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Exported so Dashboard can reuse it
export function AnmeldungDialog({
  open,
  onOpenChange,
  record,
  kurse,
  teilnehmer,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: Anmeldungen | null;
  kurse: Kurse[];
  teilnehmer: Teilnehmer[];
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [kursId, setKursId] = useState('');
  const [teilnehmerId, setTeilnehmerId] = useState('');
  const [anmeldedatum, setAnmeldedatum] = useState('');
  const [bezahlt, setBezahlt] = useState(false);

  useEffect(() => {
    if (open) {
      if (record) {
        setKursId(extractRecordId(record.fields.kurs) || '');
        setTeilnehmerId(extractRecordId(record.fields.teilnehmer) || '');
        setAnmeldedatum(record.fields.anmeldedatum?.split('T')[0] || '');
        setBezahlt(record.fields.bezahlt || false);
      } else {
        setKursId('');
        setTeilnehmerId('');
        setAnmeldedatum(new Date().toISOString().split('T')[0]);
        setBezahlt(false);
      }
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Anmeldungen['fields'] = {
        kurs: kursId ? createRecordUrl(APP_IDS.KURSE, kursId) : undefined,
        teilnehmer: teilnehmerId ? createRecordUrl(APP_IDS.TEILNEHMER, teilnehmerId) : undefined,
        anmeldedatum: anmeldedatum || undefined,
        bezahlt,
      };
      if (isEditing) {
        await LivingAppsService.updateAnmeldungenEntry(record!.record_id, fields);
        toast.success('Anmeldung wurde aktualisiert.');
      } else {
        await LivingAppsService.createAnmeldungenEntry(fields);
        toast.success('Neue Anmeldung wurde erstellt.');
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(`Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Anmeldung bearbeiten' : 'Neue Anmeldung'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="anm-kurs">Kurs</Label>
            <Select value={kursId || 'none'} onValueChange={(v) => setKursId(v === 'none' ? '' : v)}>
              <SelectTrigger id="anm-kurs">
                <SelectValue placeholder="Kurs wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Kurs</SelectItem>
                {kurse.map((k) => (
                  <SelectItem key={k.record_id} value={k.record_id}>
                    {k.fields.titel || 'Ohne Titel'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="anm-teilnehmer">Teilnehmer</Label>
            <Select value={teilnehmerId || 'none'} onValueChange={(v) => setTeilnehmerId(v === 'none' ? '' : v)}>
              <SelectTrigger id="anm-teilnehmer">
                <SelectValue placeholder="Teilnehmer wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Teilnehmer</SelectItem>
                {teilnehmer.map((t) => (
                  <SelectItem key={t.record_id} value={t.record_id}>
                    {`${t.fields.vorname || ''} ${t.fields.nachname || ''}`.trim() || 'Ohne Name'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="anm-datum">Anmeldedatum</Label>
            <Input
              id="anm-datum"
              type="date"
              value={anmeldedatum}
              onChange={(e) => setAnmeldedatum(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="anm-bezahlt"
              checked={bezahlt}
              onCheckedChange={(checked) => setBezahlt(checked === true)}
            />
            <Label htmlFor="anm-bezahlt">Bezahlt</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
