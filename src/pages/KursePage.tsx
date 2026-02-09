import { useState, useEffect, useMemo } from 'react';
import type { Kurse, Dozenten, Raeume, Anmeldungen } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
}

export function KursePage() {
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [dozenten, setDozenten] = useState<Dozenten[]>([]);
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editRecord, setEditRecord] = useState<Kurse | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<Kurse | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function refreshData() {
    try {
      setLoading(true);
      setError(null);
      const [k, d, r, a] = await Promise.all([
        LivingAppsService.getKurse(),
        LivingAppsService.getDozenten(),
        LivingAppsService.getRaeume(),
        LivingAppsService.getAnmeldungen(),
      ]);
      setKurse(k);
      setDozenten(d);
      setRaeume(r);
      setAnmeldungen(a);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshData(); }, []);

  const dozentMap = useMemo(() => {
    const m = new Map<string, Dozenten>();
    dozenten.forEach((d) => m.set(d.record_id, d));
    return m;
  }, [dozenten]);

  const raumMap = useMemo(() => {
    const m = new Map<string, Raeume>();
    raeume.forEach((r) => m.set(r.record_id, r));
    return m;
  }, [raeume]);

  const anmeldungenPerKurs = useMemo(() => {
    const counts = new Map<string, number>();
    anmeldungen.forEach((a) => {
      const kursId = extractRecordId(a.fields.kurs);
      if (!kursId) return;
      counts.set(kursId, (counts.get(kursId) || 0) + 1);
    });
    return counts;
  }, [anmeldungen]);

  async function handleDelete() {
    if (!deleteRecord) return;
    setDeleting(true);
    try {
      await LivingAppsService.deleteKurseEntry(deleteRecord.record_id);
      toast.success(`Kurs "${deleteRecord.fields.titel}" wurde gelöscht.`);
      setDeleteRecord(null);
      refreshData();
    } catch {
      toast.error('Fehler beim Löschen des Kurses.');
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
        <h1 className="text-2xl font-bold">Kurse</h1>
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
        <h1 className="text-2xl font-bold">Kurse</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Neuen Kurs erstellen</span>
          <span className="sm:hidden">Neu</span>
        </Button>
      </div>

      {kurse.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Noch keine Kurse vorhanden.</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" /> Ersten Kurs erstellen
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
                      <th className="p-3 font-medium">Titel</th>
                      <th className="p-3 font-medium">Dozent</th>
                      <th className="p-3 font-medium">Raum</th>
                      <th className="p-3 font-medium">Start</th>
                      <th className="p-3 font-medium">Ende</th>
                      <th className="p-3 font-medium text-center">Teilnehmer</th>
                      <th className="p-3 font-medium text-right">Preis</th>
                      <th className="p-3 font-medium text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kurse.map((k) => {
                      const dozentId = extractRecordId(k.fields.dozent);
                      const dozent = dozentId ? dozentMap.get(dozentId) : null;
                      const raumId = extractRecordId(k.fields.raum);
                      const raum = raumId ? raumMap.get(raumId) : null;
                      const enrolled = anmeldungenPerKurs.get(k.record_id) || 0;
                      const max = k.fields.maximale_teilnehmer;

                      return (
                        <tr key={k.record_id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="p-3 font-medium">{k.fields.titel || '-'}</td>
                          <td className="p-3 text-muted-foreground">
                            {dozent ? `${dozent.fields.vorname || ''} ${dozent.fields.nachname || ''}`.trim() : '-'}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {raum ? `${raum.fields.raumname || ''}${raum.fields.gebaeude ? ` (${raum.fields.gebaeude})` : ''}` : '-'}
                          </td>
                          <td className="p-3">
                            {k.fields.startdatum ? format(parseISO(k.fields.startdatum), 'dd.MM.yyyy', { locale: de }) : '-'}
                          </td>
                          <td className="p-3">
                            {k.fields.enddatum ? format(parseISO(k.fields.enddatum), 'dd.MM.yyyy', { locale: de }) : '-'}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={max && enrolled >= max ? 'destructive' : 'secondary'}>
                              {enrolled}{max ? `/${max}` : ''}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">{formatCurrency(k.fields.preis)}</td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setEditRecord(k)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteRecord(k)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-2">
            {kurse.map((k) => {
              const dozentId = extractRecordId(k.fields.dozent);
              const dozent = dozentId ? dozentMap.get(dozentId) : null;
              const enrolled = anmeldungenPerKurs.get(k.record_id) || 0;
              const max = k.fields.maximale_teilnehmer;

              return (
                <Card key={k.record_id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <p className="font-semibold">{k.fields.titel || 'Ohne Titel'}</p>
                        {dozent && (
                          <p className="text-sm text-muted-foreground">
                            {dozent.fields.vorname} {dozent.fields.nachname}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {k.fields.startdatum && (
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(k.fields.startdatum), 'dd.MM.yyyy', { locale: de })}
                              {k.fields.enddatum && ` - ${format(parseISO(k.fields.enddatum), 'dd.MM.yyyy', { locale: de })}`}
                            </span>
                          )}
                          <Badge variant={max && enrolled >= max ? 'destructive' : 'secondary'} className="text-xs">
                            {enrolled}{max ? `/${max}` : ''}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditRecord(k)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteRecord(k)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Create Dialog */}
      <KursDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        record={null}
        dozenten={dozenten}
        raeume={raeume}
        onSuccess={refreshData}
      />

      {/* Edit Dialog */}
      <KursDialog
        open={!!editRecord}
        onOpenChange={(open) => !open && setEditRecord(null)}
        record={editRecord}
        dozenten={dozenten}
        raeume={raeume}
        onSuccess={refreshData}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRecord} onOpenChange={(open) => !open && setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kurs löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Kurs &quot;{deleteRecord?.fields.titel || ''}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
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

function KursDialog({
  open,
  onOpenChange,
  record,
  dozenten,
  raeume,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: Kurse | null;
  dozenten: Dozenten[];
  raeume: Raeume[];
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [titel, setTitel] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [startdatum, setStartdatum] = useState('');
  const [enddatum, setEnddatum] = useState('');
  const [maxTeilnehmer, setMaxTeilnehmer] = useState('');
  const [preis, setPreis] = useState('');
  const [dozentId, setDozentId] = useState('');
  const [raumId, setRaumId] = useState('');

  useEffect(() => {
    if (open) {
      if (record) {
        setTitel(record.fields.titel || '');
        setBeschreibung(record.fields.beschreibung || '');
        setStartdatum(record.fields.startdatum?.split('T')[0] || '');
        setEnddatum(record.fields.enddatum?.split('T')[0] || '');
        setMaxTeilnehmer(record.fields.maximale_teilnehmer?.toString() || '');
        setPreis(record.fields.preis?.toString() || '');
        setDozentId(extractRecordId(record.fields.dozent) || '');
        setRaumId(extractRecordId(record.fields.raum) || '');
      } else {
        setTitel('');
        setBeschreibung('');
        setStartdatum('');
        setEnddatum('');
        setMaxTeilnehmer('');
        setPreis('');
        setDozentId('');
        setRaumId('');
      }
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
        maximale_teilnehmer: maxTeilnehmer ? Number(maxTeilnehmer) : undefined,
        preis: preis ? Number(preis) : undefined,
        dozent: dozentId ? createRecordUrl(APP_IDS.DOZENTEN, dozentId) : undefined,
        raum: raumId ? createRecordUrl(APP_IDS.RAEUME, raumId) : undefined,
      };
      if (isEditing) {
        await LivingAppsService.updateKurseEntry(record!.record_id, fields);
        toast.success('Kurs wurde aktualisiert.');
      } else {
        await LivingAppsService.createKurseEntry(fields);
        toast.success('Neuer Kurs wurde erstellt.');
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Kurs bearbeiten' : 'Neuen Kurs erstellen'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kurs-titel">Kurstitel *</Label>
            <Input id="kurs-titel" value={titel} onChange={(e) => setTitel(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kurs-beschreibung">Beschreibung</Label>
            <Textarea id="kurs-beschreibung" value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="kurs-start">Startdatum</Label>
              <Input id="kurs-start" type="date" value={startdatum} onChange={(e) => setStartdatum(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kurs-end">Enddatum</Label>
              <Input id="kurs-end" type="date" value={enddatum} onChange={(e) => setEnddatum(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="kurs-max">Max. Teilnehmer</Label>
              <Input id="kurs-max" type="number" min="0" value={maxTeilnehmer} onChange={(e) => setMaxTeilnehmer(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kurs-preis">Preis (EUR)</Label>
              <Input id="kurs-preis" type="number" min="0" step="0.01" value={preis} onChange={(e) => setPreis(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="kurs-dozent">Dozent</Label>
            <Select value={dozentId || 'none'} onValueChange={(v) => setDozentId(v === 'none' ? '' : v)}>
              <SelectTrigger id="kurs-dozent">
                <SelectValue placeholder="Dozent wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Dozent</SelectItem>
                {dozenten.map((d) => (
                  <SelectItem key={d.record_id} value={d.record_id}>
                    {`${d.fields.vorname || ''} ${d.fields.nachname || ''}`.trim() || 'Ohne Name'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="kurs-raum">Raum</Label>
            <Select value={raumId || 'none'} onValueChange={(v) => setRaumId(v === 'none' ? '' : v)}>
              <SelectTrigger id="kurs-raum">
                <SelectValue placeholder="Raum wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Raum</SelectItem>
                {raeume.map((r) => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {`${r.fields.raumname || ''}${r.fields.gebaeude ? ` (${r.fields.gebaeude})` : ''}`}
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
