import { useState, useEffect } from 'react';
import type { Raeume } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function RaeumePage() {
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editRecord, setEditRecord] = useState<Raeume | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<Raeume | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function refreshData() {
    try {
      setLoading(true);
      setError(null);
      const r = await LivingAppsService.getRaeume();
      setRaeume(r);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshData(); }, []);

  async function handleDelete() {
    if (!deleteRecord) return;
    setDeleting(true);
    try {
      await LivingAppsService.deleteRaeumeEntry(deleteRecord.record_id);
      toast.success(`Raum "${deleteRecord.fields.raumname}" wurde gelöscht.`);
      setDeleteRecord(null);
      refreshData();
    } catch {
      toast.error('Fehler beim Löschen des Raums.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Räume</h1>
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
        <h1 className="text-2xl font-bold">Räume</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Neuen Raum erstellen</span>
          <span className="sm:hidden">Neu</span>
        </Button>
      </div>

      {raeume.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Noch keine Räume vorhanden.</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" /> Ersten Raum erstellen
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
                      <th className="p-3 font-medium">Raumname</th>
                      <th className="p-3 font-medium">Gebäude</th>
                      <th className="p-3 font-medium text-right">Kapazität</th>
                      <th className="p-3 font-medium text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raeume.map((r) => (
                      <tr key={r.record_id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="p-3 font-medium">{r.fields.raumname || '-'}</td>
                        <td className="p-3 text-muted-foreground">{r.fields.gebaeude || '-'}</td>
                        <td className="p-3 text-right">{r.fields.kapazitaet != null ? r.fields.kapazitaet : '-'}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setEditRecord(r)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteRecord(r)} className="text-destructive hover:text-destructive">
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
            {raeume.map((r) => (
              <Card key={r.record_id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold">{r.fields.raumname || 'Ohne Name'}</p>
                      {r.fields.gebaeude && (
                        <p className="text-sm text-muted-foreground">{r.fields.gebaeude}</p>
                      )}
                      {r.fields.kapazitaet != null && (
                        <p className="text-xs text-muted-foreground">Kapazität: {r.fields.kapazitaet}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditRecord(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteRecord(r)} className="text-destructive">
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
      <RaumDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        record={null}
        onSuccess={refreshData}
      />

      {/* Edit Dialog */}
      <RaumDialog
        open={!!editRecord}
        onOpenChange={(open) => !open && setEditRecord(null)}
        record={editRecord}
        onSuccess={refreshData}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRecord} onOpenChange={(open) => !open && setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Raum löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Raum &quot;{deleteRecord?.fields.raumname || ''}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Löscht...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RaumDialog({
  open,
  onOpenChange,
  record,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: Raeume | null;
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [raumname, setRaumname] = useState('');
  const [gebaeude, setGebaeude] = useState('');
  const [kapazitaet, setKapazitaet] = useState('');

  useEffect(() => {
    if (open) {
      if (record) {
        setRaumname(record.fields.raumname || '');
        setGebaeude(record.fields.gebaeude || '');
        setKapazitaet(record.fields.kapazitaet?.toString() || '');
      } else {
        setRaumname('');
        setGebaeude('');
        setKapazitaet('');
      }
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Raeume['fields'] = {
        raumname: raumname || undefined,
        gebaeude: gebaeude || undefined,
        kapazitaet: kapazitaet ? Number(kapazitaet) : undefined,
      };
      if (isEditing) {
        await LivingAppsService.updateRaeumeEntry(record!.record_id, fields);
        toast.success('Raum wurde aktualisiert.');
      } else {
        await LivingAppsService.createRaeumeEntry(fields);
        toast.success('Neuer Raum wurde erstellt.');
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
          <DialogTitle>{isEditing ? 'Raum bearbeiten' : 'Neuen Raum erstellen'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="raum-raumname">Raumname *</Label>
            <Input id="raum-raumname" value={raumname} onChange={(e) => setRaumname(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="raum-gebaeude">Gebäude</Label>
            <Input id="raum-gebaeude" value={gebaeude} onChange={(e) => setGebaeude(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="raum-kapazitaet">Kapazität</Label>
            <Input id="raum-kapazitaet" type="number" min="0" value={kapazitaet} onChange={(e) => setKapazitaet(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
