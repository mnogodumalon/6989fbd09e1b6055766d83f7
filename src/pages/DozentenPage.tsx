import { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Dozenten } from '@/types/app';
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

export default function DozentenPage() {
  const { dozenten, loading, error, fetchAll } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Dozenten | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  function handleAdd() {
    setEditRecord(null);
    setDialogOpen(true);
  }

  function handleEdit(record: Dozenten) {
    setEditRecord(record);
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await LivingAppsService.deleteDozentenEntry(deleteTarget.id);
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
        title="Dozenten" 
        description="Verwalte alle Dozenten und deren Kontaktdaten"
        onAdd={handleAdd}
        addLabel="Neuer Dozent"
        onRefresh={fetchAll}
      />

      {dozenten.length === 0 ? (
        <EmptyState 
          message="Noch keine Dozenten vorhanden." 
          onAdd={handleAdd} 
          addLabel="Dozent erstellen" 
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vorname</TableHead>
                    <TableHead>Nachname</TableHead>
                    <TableHead className="hidden sm:table-cell">E-Mail</TableHead>
                    <TableHead className="hidden md:table-cell">Telefon</TableHead>
                    <TableHead className="hidden lg:table-cell">Fachgebiet</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dozenten.map(d => (
                    <TableRow 
                      key={d.record_id} 
                      className="hover:bg-muted/50 cursor-pointer" 
                      onClick={() => handleEdit(d)}
                    >
                      <TableCell className="font-medium">{d.fields.vorname ?? '-'}</TableCell>
                      <TableCell>{d.fields.nachname ?? '-'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{d.fields.email ?? '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">{d.fields.telefon ?? '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{d.fields.fachgebiet ?? '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(d)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive" 
                            onClick={() => setDeleteTarget({ 
                              id: d.record_id, 
                              name: `${d.fields.vorname ?? ''} ${d.fields.nachname ?? ''}`.trim() || 'Dozent'
                            })}
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

      <DozentDialog
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

// Dozent Dialog
function DozentDialog({ open, onOpenChange, record, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: Dozenten | null;
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [vorname, setVorname] = useState('');
  const [nachname, setNachname] = useState('');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [fachgebiet, setFachgebiet] = useState('');

  useEffect(() => {
    if (open) {
      setVorname(record?.fields.vorname ?? '');
      setNachname(record?.fields.nachname ?? '');
      setEmail(record?.fields.email ?? '');
      setTelefon(record?.fields.telefon ?? '');
      setFachgebiet(record?.fields.fachgebiet ?? '');
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Dozenten['fields'] = {
        vorname: vorname || undefined,
        nachname: nachname || undefined,
        email: email || undefined,
        telefon: telefon || undefined,
        fachgebiet: fachgebiet || undefined,
      };
      if (isEditing) {
        await LivingAppsService.updateDozentenEntry(record!.record_id, fields);
        toast.success('Gespeichert', { description: 'Dozent wurde aktualisiert.' });
      } else {
        await LivingAppsService.createDozentenEntry(fields);
        toast.success('Erstellt', { description: 'Neuer Dozent wurde erstellt.' });
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
          <DialogTitle>{isEditing ? 'Dozent bearbeiten' : 'Neuer Dozent'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Bearbeite den Dozenten.' : 'Erstelle einen neuen Dozenten.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="d_vorname">Vorname *</Label>
              <Input id="d_vorname" value={vorname} onChange={e => setVorname(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d_nachname">Nachname *</Label>
              <Input id="d_nachname" value={nachname} onChange={e => setNachname(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="d_email">E-Mail</Label>
            <Input id="d_email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="d_telefon">Telefon</Label>
            <Input id="d_telefon" type="tel" value={telefon} onChange={e => setTelefon(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="d_fachgebiet">Fachgebiet</Label>
            <Input id="d_fachgebiet" value={fachgebiet} onChange={e => setFachgebiet(e.target.value)} />
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

