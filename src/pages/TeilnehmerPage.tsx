import { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Teilnehmer } from '@/types/app';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
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

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr.split('T')[0]), 'dd.MM.yyyy', { locale: de });
  } catch {
    return dateStr;
  }
}

export default function TeilnehmerPage() {
  const { teilnehmer, loading, error, fetchAll } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Teilnehmer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  function handleAdd() {
    setEditRecord(null);
    setDialogOpen(true);
  }

  function handleEdit(record: Teilnehmer) {
    setEditRecord(record);
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await LivingAppsService.deleteTeilnehmerEntry(deleteTarget.id);
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
        title="Teilnehmer" 
        description="Verwalte alle Kursteilnehmer"
        onAdd={handleAdd}
        addLabel="Neuer Teilnehmer"
        onRefresh={fetchAll}
      />

      {teilnehmer.length === 0 ? (
        <EmptyState 
          message="Noch keine Teilnehmer vorhanden." 
          onAdd={handleAdd} 
          addLabel="Teilnehmer erstellen" 
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
                    <TableHead className="hidden lg:table-cell">Geburtsdatum</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teilnehmer.map(t => (
                    <TableRow 
                      key={t.record_id} 
                      className="hover:bg-muted/50 cursor-pointer" 
                      onClick={() => handleEdit(t)}
                    >
                      <TableCell className="font-medium">{t.fields.vorname ?? '-'}</TableCell>
                      <TableCell>{t.fields.nachname ?? '-'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{t.fields.email ?? '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">{t.fields.telefon ?? '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{formatDate(t.fields.geburtsdatum)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(t)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive" 
                            onClick={() => setDeleteTarget({ 
                              id: t.record_id, 
                              name: `${t.fields.vorname ?? ''} ${t.fields.nachname ?? ''}`.trim() || 'Teilnehmer'
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

      <TeilnehmerDialog
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

// Teilnehmer Dialog
function TeilnehmerDialog({ open, onOpenChange, record, onSuccess }: {
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
      setVorname(record?.fields.vorname ?? '');
      setNachname(record?.fields.nachname ?? '');
      setEmail(record?.fields.email ?? '');
      setTelefon(record?.fields.telefon ?? '');
      setGeburtsdatum(record?.fields.geburtsdatum?.split('T')[0] ?? '');
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
        toast.success('Gespeichert', { description: 'Teilnehmer wurde aktualisiert.' });
      } else {
        await LivingAppsService.createTeilnehmerEntry(fields);
        toast.success('Erstellt', { description: 'Neuer Teilnehmer wurde erstellt.' });
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
          <DialogTitle>{isEditing ? 'Teilnehmer bearbeiten' : 'Neuer Teilnehmer'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Bearbeite den Teilnehmer.' : 'Erstelle einen neuen Teilnehmer.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="t_vorname">Vorname *</Label>
              <Input id="t_vorname" value={vorname} onChange={e => setVorname(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t_nachname">Nachname *</Label>
              <Input id="t_nachname" value={nachname} onChange={e => setNachname(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="t_email">E-Mail</Label>
            <Input id="t_email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t_telefon">Telefon</Label>
            <Input id="t_telefon" type="tel" value={telefon} onChange={e => setTelefon(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t_geburtsdatum">Geburtsdatum</Label>
            <Input id="t_geburtsdatum" type="date" value={geburtsdatum} onChange={e => setGeburtsdatum(e.target.value)} />
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

