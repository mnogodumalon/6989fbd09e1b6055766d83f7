import { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type { Kurse } from '@/types/app';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2 } from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { TableLoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { DeleteDialog } from '@/components/shared/DeleteDialog';

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr.split('T')[0]), 'dd.MM.yyyy', { locale: de });
  } catch {
    return dateStr;
  }
}

export default function KursePage() {
  const { kurse, dozenten, raeume, loading, error, fetchAll, resolveDozentName, resolveRaumName } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Kurse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  function handleAdd() {
    setEditRecord(null);
    setDialogOpen(true);
  }

  function handleEdit(record: Kurse) {
    setEditRecord(record);
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await LivingAppsService.deleteKurseEntry(deleteTarget.id);
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
        title="Kurse" 
        description="Verwalte alle Kurse und deren Details"
        onAdd={handleAdd}
        addLabel="Neuer Kurs"
        onRefresh={fetchAll}
      />

      {kurse.length === 0 ? (
        <EmptyState 
          message="Noch keine Kurse vorhanden." 
          onAdd={handleAdd} 
          addLabel="Kurs erstellen" 
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kurstitel</TableHead>
                    <TableHead className="hidden md:table-cell">Startdatum</TableHead>
                    <TableHead className="hidden md:table-cell">Enddatum</TableHead>
                    <TableHead className="hidden sm:table-cell">Max. TN</TableHead>
                    <TableHead className="hidden sm:table-cell">Preis</TableHead>
                    <TableHead className="hidden lg:table-cell">Dozent</TableHead>
                    <TableHead className="hidden lg:table-cell">Raum</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kurse.map(k => (
                    <TableRow 
                      key={k.record_id} 
                      className="hover:bg-muted/50 cursor-pointer" 
                      onClick={() => handleEdit(k)}
                    >
                      <TableCell className="font-medium">{k.fields.titel ?? '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(k.fields.startdatum)}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(k.fields.enddatum)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{k.fields.maximale_teilnehmer ?? '-'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatCurrency(k.fields.preis)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{resolveDozentName(k.fields.dozent)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{resolveRaumName(k.fields.raum)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(k)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive" 
                            onClick={() => setDeleteTarget({ id: k.record_id, name: k.fields.titel ?? 'Kurs' })}
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

      <KursDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        record={editRecord}
        dozenten={dozenten}
        raeume={raeume}
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

// Kurs Dialog
function KursDialog({ open, onOpenChange, record, dozenten, raeume, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: Kurse | null;
  dozenten: ReturnType<typeof useData>['dozenten'];
  raeume: ReturnType<typeof useData>['raeume'];
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [titel, setTitel] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [startdatum, setStartdatum] = useState('');
  const [enddatum, setEnddatum] = useState('');
  const [maxTN, setMaxTN] = useState('');
  const [preis, setPreis] = useState('');
  const [dozent, setDozent] = useState('');
  const [raum, setRaum] = useState('');

  useEffect(() => {
    if (open) {
      setTitel(record?.fields.titel ?? '');
      setBeschreibung(record?.fields.beschreibung ?? '');
      setStartdatum(record?.fields.startdatum?.split('T')[0] ?? '');
      setEnddatum(record?.fields.enddatum?.split('T')[0] ?? '');
      setMaxTN(record?.fields.maximale_teilnehmer?.toString() ?? '');
      setPreis(record?.fields.preis?.toString() ?? '');
      setDozent(extractRecordId(record?.fields.dozent) ?? '');
      setRaum(extractRecordId(record?.fields.raum) ?? '');
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Kurse['fields'] = {
        titel: titel || undefined,
        beschreibung: beschreibung || undefined,
        startdatum: startdatum || undefined,
        enddatum: enddatum || undefined,
        maximale_teilnehmer: maxTN ? Number(maxTN) : undefined,
        preis: preis ? Number(preis) : undefined,
        dozent: dozent ? createRecordUrl(APP_IDS.DOZENTEN, dozent) : undefined,
        raum: raum ? createRecordUrl(APP_IDS.RAEUME, raum) : undefined,
      };
      if (isEditing) {
        await LivingAppsService.updateKurseEntry(record!.record_id, fields);
        toast.success('Gespeichert', { description: 'Kurs wurde aktualisiert.' });
      } else {
        await LivingAppsService.createKurseEntry(fields);
        toast.success('Erstellt', { description: 'Neuer Kurs wurde erstellt.' });
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Kurs bearbeiten' : 'Neuer Kurs'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Bearbeite den Kurs.' : 'Erstelle einen neuen Kurs.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titel">Kurstitel *</Label>
            <Input id="titel" value={titel} onChange={e => setTitel(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="beschreibung">Beschreibung</Label>
            <Textarea id="beschreibung" value={beschreibung} onChange={e => setBeschreibung(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startdatum">Startdatum</Label>
              <Input id="startdatum" type="date" value={startdatum} onChange={e => setStartdatum(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enddatum">Enddatum</Label>
              <Input id="enddatum" type="date" value={enddatum} onChange={e => setEnddatum(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxtn">Max. Teilnehmer</Label>
              <Input id="maxtn" type="number" min="0" value={maxTN} onChange={e => setMaxTN(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preis">Preis (EUR)</Label>
              <Input id="preis" type="number" min="0" step="0.01" value={preis} onChange={e => setPreis(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Dozent</Label>
            <Select value={dozent || 'none'} onValueChange={v => setDozent(v === 'none' ? '' : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Dozent wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Kein Dozent --</SelectItem>
                {dozenten.map(d => (
                  <SelectItem key={d.record_id} value={d.record_id}>
                    {d.fields.vorname ?? ''} {d.fields.nachname ?? ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Raum</Label>
            <Select value={raum || 'none'} onValueChange={v => setRaum(v === 'none' ? '' : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Raum wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Kein Raum --</SelectItem>
                {raeume.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.raumname ?? 'Unbenannt'} {r.fields.gebaeude ? `(${r.fields.gebaeude})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

