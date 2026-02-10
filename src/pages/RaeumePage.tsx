import { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Raeume } from '@/types/app';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2 } from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { TableLoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { DeleteDialog } from '@/components/shared/DeleteDialog';

export default function RaeumePage() {
  const { raeume, loading, error, fetchAll } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Raeume | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  function handleAdd() {
    setEditRecord(null);
    setDialogOpen(true);
  }

  function handleEdit(record: Raeume) {
    setEditRecord(record);
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await LivingAppsService.deleteRaeumeEntry(deleteTarget.id);
      toast.success('Gelöscht', { description: `"${deleteTarget.name}" wurde gelöscht.` });
      setDeleteTarget(null);
      fetchAll();
    } catch {
      toast.error('Fehler', { description: 'Eintrag konnte nicht gelöscht werden.' });
    }
  }

  if (loading) return <TableLoadingState />;
  if (error) return <ErrorState error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader 
        title="Räume" 
        description="Verwalte alle verfügbaren Räume"
        onAdd={handleAdd}
        addLabel="Neuer Raum"
        onRefresh={fetchAll}
      />

      {raeume.length === 0 ? (
        <EmptyState 
          message="Noch keine Räume vorhanden." 
          onAdd={handleAdd} 
          addLabel="Raum erstellen" 
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Raumname</TableHead>
                    <TableHead>Gebäude</TableHead>
                    <TableHead>Kapazität</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {raeume.map(r => (
                    <TableRow 
                      key={r.record_id} 
                      className="hover:bg-muted/50 cursor-pointer" 
                      onClick={() => handleEdit(r)}
                    >
                      <TableCell className="font-medium">{r.fields.raumname ?? '-'}</TableCell>
                      <TableCell>{r.fields.gebaeude ?? '-'}</TableCell>
                      <TableCell>{r.fields.kapazitaet ?? '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(r)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive" 
                            onClick={() => setDeleteTarget({ id: r.record_id, name: r.fields.raumname ?? 'Raum' })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <RaumDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        record={editRecord}
        onSuccess={fetchAll}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.name ?? ''}
      />
    </div>
  );
}

// Raum Dialog
function RaumDialog({ open, onOpenChange, record, onSuccess }: {
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
      setRaumname(record?.fields.raumname ?? '');
      setGebaeude(record?.fields.gebaeude ?? '');
      setKapazitaet(record?.fields.kapazitaet?.toString() ?? '');
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
        toast.success('Gespeichert', { description: 'Raum wurde aktualisiert.' });
      } else {
        await LivingAppsService.createRaeumeEntry(fields);
        toast.success('Erstellt', { description: 'Neuer Raum wurde erstellt.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Raum bearbeiten' : 'Neuer Raum'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Bearbeite den Raum.' : 'Erstelle einen neuen Raum.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="raumname">Raumname *</Label>
            <Input id="raumname" value={raumname} onChange={e => setRaumname(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gebaeude">Gebäude</Label>
            <Input id="gebaeude" value={gebaeude} onChange={e => setGebaeude(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kapazitaet">Kapazität</Label>
            <Input id="kapazitaet" type="number" min="0" value={kapazitaet} onChange={e => setKapazitaet(e.target.value)} />
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

