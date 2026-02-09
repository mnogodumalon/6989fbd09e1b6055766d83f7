import { useState, useEffect } from 'react';
import type { Teilnehmer } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function TeilnehmerPage() {
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editRecord, setEditRecord] = useState<Teilnehmer | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<Teilnehmer | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function refreshData() {
    try {
      setLoading(true);
      setError(null);
      const t = await LivingAppsService.getTeilnehmer();
      setTeilnehmer(t);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshData(); }, []);

  function getFullName(t: Teilnehmer): string {
    return `${t.fields.vorname || ''} ${t.fields.nachname || ''}`.trim() || '-';
  }

  async function handleDelete() {
    if (!deleteRecord) return;
    setDeleting(true);
    try {
      await LivingAppsService.deleteTeilnehmerEntry(deleteRecord.record_id);
      toast.success(`Teilnehmer "${getFullName(deleteRecord)}" wurde gelöscht.`);
      setDeleteRecord(null);
      refreshData();
    } catch {
      toast.error('Fehler beim Löschen des Teilnehmers.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Teilnehmer</h1>
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
        <h1 className="text-2xl font-bold">Teilnehmer</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Neuen Teilnehmer erstellen</span>
          <span className="sm:hidden">Neu</span>
        </Button>
      </div>

      {teilnehmer.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Noch keine Teilnehmer vorhanden.</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" /> Ersten Teilnehmer erstellen
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
                      <th className="p-3 font-medium">Name</th>
                      <th className="p-3 font-medium">E-Mail</th>
                      <th className="p-3 font-medium">Telefon</th>
                      <th className="p-3 font-medium">Geburtsdatum</th>
                      <th className="p-3 font-medium text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teilnehmer.map((t) => (
                      <tr key={t.record_id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="p-3 font-medium">{getFullName(t)}</td>
                        <td className="p-3 text-muted-foreground">{t.fields.email || '-'}</td>
                        <td className="p-3 text-muted-foreground">{t.fields.telefon || '-'}</td>
                        <td className="p-3">
                          {t.fields.geburtsdatum
                            ? format(parseISO(t.fields.geburtsdatum), 'dd.MM.yyyy', { locale: de })
                            : '-'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setEditRecord(t)} aria-label="Bearbeiten">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteRecord(t)} aria-label="Löschen" className="text-destructive hover:text-destructive">
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
            {teilnehmer.map((t) => (
              <Card key={t.record_id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <p className="font-medium">{getFullName(t)}</p>
                      <p className="text-sm text-muted-foreground">{t.fields.email || '-'}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditRecord(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteRecord(t)} className="text-destructive">
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
      <TeilnehmerDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        record={null}
        onSuccess={refreshData}
      />

      {/* Edit Dialog */}
      <TeilnehmerDialog
        open={!!editRecord}
        onOpenChange={(open) => !open && setEditRecord(null)}
        record={editRecord}
        onSuccess={refreshData}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRecord} onOpenChange={(open) => !open && setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Teilnehmer löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Teilnehmer &quot;{deleteRecord ? getFullName(deleteRecord) : ''}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
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

function TeilnehmerDialog({
  open,
  onOpenChange,
  record,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: Teilnehmer | null;
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [vorname, setVorname] = useState('');
  const [nachname, setNachname] = useState('');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [geburtsdatum, setGeburtsdatum] = useState('');

  useEffect(() => {
    if (open) {
      if (record) {
        setVorname(record.fields.vorname || '');
        setNachname(record.fields.nachname || '');
        setEmail(record.fields.email || '');
        setTelefon(record.fields.telefon || '');
        setGeburtsdatum(record.fields.geburtsdatum?.split('T')[0] || '');
      } else {
        setVorname('');
        setNachname('');
        setEmail('');
        setTelefon('');
        setGeburtsdatum('');
      }
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Teilnehmer['fields'] = {
        vorname: vorname || undefined,
        nachname: nachname || undefined,
        email: email || undefined,
        telefon: telefon || undefined,
        geburtsdatum: geburtsdatum || undefined,
      };
      if (isEditing) {
        await LivingAppsService.updateTeilnehmerEntry(record!.record_id, fields);
        toast.success('Teilnehmer wurde aktualisiert.');
      } else {
        await LivingAppsService.createTeilnehmerEntry(fields);
        toast.success('Neuer Teilnehmer wurde erstellt.');
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Teilnehmer bearbeiten' : 'Neuen Teilnehmer erstellen'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tn-vorname">Vorname *</Label>
              <Input id="tn-vorname" value={vorname} onChange={(e) => setVorname(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tn-nachname">Nachname *</Label>
              <Input id="tn-nachname" value={nachname} onChange={(e) => setNachname(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tn-email">E-Mail</Label>
            <Input id="tn-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tn-telefon">Telefon</Label>
            <Input id="tn-telefon" type="tel" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tn-geburtsdatum">Geburtsdatum</Label>
            <Input id="tn-geburtsdatum" type="date" value={geburtsdatum} onChange={(e) => setGeburtsdatum(e.target.value)} />
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
