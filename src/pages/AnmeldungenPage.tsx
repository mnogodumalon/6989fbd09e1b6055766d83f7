import { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type { Anmeldungen } from '@/types/app';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export default function AnmeldungenPage() {
  const { anmeldungen, kurse, teilnehmer, loading, error, fetchAll, resolveTeilnehmerName, resolveKursName } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Anmeldungen | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  function handleAdd() {
    setEditRecord(null);
    setDialogOpen(true);
  }

  function handleEdit(record: Anmeldungen) {
    setEditRecord(record);
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await LivingAppsService.deleteAnmeldungenEntry(deleteTarget.id);
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
        title="Anmeldungen" 
        description="Verwalte alle Kursanmeldungen"
        onAdd={handleAdd}
        addLabel="Neue Anmeldung"
        onRefresh={fetchAll}
      />

      {anmeldungen.length === 0 ? (
        <EmptyState 
          message="Noch keine Anmeldungen vorhanden." 
          onAdd={handleAdd} 
          addLabel="Anmeldung erstellen" 
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teilnehmer</TableHead>
                    <TableHead>Kurs</TableHead>
                    <TableHead className="hidden sm:table-cell">Anmeldedatum</TableHead>
                    <TableHead>Bezahlt</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anmeldungen.map(a => (
                    <TableRow 
                      key={a.record_id} 
                      className="hover:bg-muted/50 cursor-pointer" 
                      onClick={() => handleEdit(a)}
                    >
                      <TableCell className="font-medium">{resolveTeilnehmerName(a.fields.teilnehmer)}</TableCell>
                      <TableCell>{resolveKursName(a.fields.kurs)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(a.fields.anmeldedatum)}</TableCell>
                      <TableCell>
                        <Badge variant={a.fields.bezahlt ? 'default' : 'destructive'} className="text-xs">
                          {a.fields.bezahlt ? 'Bezahlt' : 'Offen'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(a)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive" 
                            onClick={() => setDeleteTarget({ 
                              id: a.record_id, 
                              name: `Anmeldung von ${resolveTeilnehmerName(a.fields.teilnehmer)}`
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

      <AnmeldungDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        record={editRecord}
        kurse={kurse}
        teilnehmer={teilnehmer}
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

// Anmeldung Dialog
function AnmeldungDialog({ open, onOpenChange, record, kurse, teilnehmer, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: Anmeldungen | null;
  kurse: ReturnType<typeof useData>['kurse'];
  teilnehmer: ReturnType<typeof useData>['teilnehmer'];
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [formTeilnehmer, setFormTeilnehmer] = useState('');
  const [formKurs, setFormKurs] = useState('');
  const [formDatum, setFormDatum] = useState('');
  const [formBezahlt, setFormBezahlt] = useState(false);

  useEffect(() => {
    if (open) {
      setFormTeilnehmer(extractRecordId(record?.fields.teilnehmer) ?? '');
      setFormKurs(extractRecordId(record?.fields.kurs) ?? '');
      setFormDatum(record?.fields.anmeldedatum?.split('T')[0] ?? todayISO());
      setFormBezahlt(record?.fields.bezahlt ?? false);
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Anmeldungen['fields'] = {
        teilnehmer: formTeilnehmer ? createRecordUrl(APP_IDS.TEILNEHMER, formTeilnehmer) : undefined,
        kurs: formKurs ? createRecordUrl(APP_IDS.KURSE, formKurs) : undefined,
        anmeldedatum: formDatum || undefined,
        bezahlt: formBezahlt,
      };
      if (isEditing) {
        await LivingAppsService.updateAnmeldungenEntry(record!.record_id, fields);
        toast.success('Gespeichert', { description: 'Anmeldung wurde aktualisiert.' });
      } else {
        await LivingAppsService.createAnmeldungenEntry(fields);
        toast.success('Erstellt', { description: 'Neue Anmeldung wurde erstellt.' });
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
          <DialogTitle>{isEditing ? 'Anmeldung bearbeiten' : 'Neue Anmeldung'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Bearbeite die Anmeldung.' : 'Erstelle eine neue Kursanmeldung.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Teilnehmer</Label>
            <Select value={formTeilnehmer || 'none'} onValueChange={v => setFormTeilnehmer(v === 'none' ? '' : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Teilnehmer wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Kein Teilnehmer --</SelectItem>
                {teilnehmer.map(t => (
                  <SelectItem key={t.record_id} value={t.record_id}>
                    {t.fields.vorname ?? ''} {t.fields.nachname ?? ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kurs</Label>
            <Select value={formKurs || 'none'} onValueChange={v => setFormKurs(v === 'none' ? '' : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Kurs wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Kein Kurs --</SelectItem>
                {kurse.map(k => (
                  <SelectItem key={k.record_id} value={k.record_id}>
                    {k.fields.titel ?? 'Unbenannt'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="anmeldedatum">Anmeldedatum</Label>
            <Input id="anmeldedatum" type="date" value={formDatum} onChange={e => setFormDatum(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="bezahlt" checked={formBezahlt} onCheckedChange={(c) => setFormBezahlt(c === true)} />
            <Label htmlFor="bezahlt" className="cursor-pointer">Bezahlt</Label>
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

