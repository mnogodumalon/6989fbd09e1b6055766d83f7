import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Kurse, Raeume, Dozenten, Anmeldungen, Teilnehmer } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Toaster } from '@/components/ui/sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  BookOpen,
  GraduationCap,
  DoorOpen,
  ClipboardList,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';

// ─── Utility Functions ───────────────────────────────────────────────

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '–';
  try {
    return format(parseISO(dateStr.split('T')[0]), 'dd.MM.yyyy', { locale: de });
  } catch {
    return dateStr;
  }
}

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '–';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
}

function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function capacityColor(ratio: number): string {
  if (ratio < 0.5) return 'hsl(152 55% 42%)';
  if (ratio < 0.8) return 'hsl(32 95% 52%)';
  return 'hsl(4 72% 52%)';
}

// ─── Delete Confirmation Dialog ──────────────────────────────────────

function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      toast.error('Fehler beim Löschen', {
        description: err instanceof Error ? err.message : 'Unbekannter Fehler',
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting ? 'Löscht...' : 'Löschen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Kurse CRUD Dialog ───────────────────────────────────────────────

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
  record?: Kurse | null;
  dozenten: Dozenten[];
  raeume: Raeume[];
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    titel: '',
    beschreibung: '',
    startdatum: todayStr(),
    enddatum: '',
    maximale_teilnehmer: '',
    preis: '',
    dozent: 'none',
    raum: 'none',
  });

  useEffect(() => {
    if (open) {
      if (record) {
        setForm({
          titel: record.fields.titel ?? '',
          beschreibung: record.fields.beschreibung ?? '',
          startdatum: record.fields.startdatum?.split('T')[0] ?? todayStr(),
          enddatum: record.fields.enddatum?.split('T')[0] ?? '',
          maximale_teilnehmer: record.fields.maximale_teilnehmer?.toString() ?? '',
          preis: record.fields.preis?.toString() ?? '',
          dozent: extractRecordId(record.fields.dozent) ?? 'none',
          raum: extractRecordId(record.fields.raum) ?? 'none',
        });
      } else {
        setForm({
          titel: '',
          beschreibung: '',
          startdatum: todayStr(),
          enddatum: '',
          maximale_teilnehmer: '',
          preis: '',
          dozent: 'none',
          raum: 'none',
        });
      }
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Kurse['fields'] = {
        titel: form.titel,
        beschreibung: form.beschreibung || undefined,
        startdatum: form.startdatum || undefined,
        enddatum: form.enddatum || undefined,
        maximale_teilnehmer: form.maximale_teilnehmer ? Number(form.maximale_teilnehmer) : undefined,
        preis: form.preis ? Number(form.preis) : undefined,
        dozent: form.dozent !== 'none' ? createRecordUrl(APP_IDS.DOZENTEN, form.dozent) : undefined,
        raum: form.raum !== 'none' ? createRecordUrl(APP_IDS.RAEUME, form.raum) : undefined,
      };
      if (isEditing) {
        await LivingAppsService.updateKurseEntry(record!.record_id, fields);
        toast.success('Kurs aktualisiert');
      } else {
        await LivingAppsService.createKurseEntry(fields);
        toast.success('Kurs erstellt');
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(`Fehler beim ${isEditing ? 'Speichern' : 'Erstellen'}`, {
        description: err instanceof Error ? err.message : 'Unbekannter Fehler',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Kurs bearbeiten' : 'Neuen Kurs erstellen'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Bearbeite die Kursdetails.' : 'Erstelle einen neuen Kurs.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kurs-titel">Kurstitel *</Label>
            <Input id="kurs-titel" value={form.titel} onChange={(e) => setForm((p) => ({ ...p, titel: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kurs-beschreibung">Beschreibung</Label>
            <Textarea id="kurs-beschreibung" value={form.beschreibung} onChange={(e) => setForm((p) => ({ ...p, beschreibung: e.target.value }))} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kurs-start">Startdatum *</Label>
              <Input id="kurs-start" type="date" value={form.startdatum} onChange={(e) => setForm((p) => ({ ...p, startdatum: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kurs-end">Enddatum</Label>
              <Input id="kurs-end" type="date" value={form.enddatum} onChange={(e) => setForm((p) => ({ ...p, enddatum: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kurs-max">Max. Teilnehmer</Label>
              <Input id="kurs-max" type="number" min={1} value={form.maximale_teilnehmer} onChange={(e) => setForm((p) => ({ ...p, maximale_teilnehmer: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kurs-preis">Preis (EUR)</Label>
              <Input id="kurs-preis" type="number" min={0} step="0.01" value={form.preis} onChange={(e) => setForm((p) => ({ ...p, preis: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Dozent</Label>
            <Select value={form.dozent} onValueChange={(v) => setForm((p) => ({ ...p, dozent: v }))}>
              <SelectTrigger><SelectValue placeholder="Dozent wählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Dozent</SelectItem>
                {dozenten.map((d) => (
                  <SelectItem key={d.record_id} value={d.record_id}>
                    {d.fields.vorname} {d.fields.nachname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Raum</Label>
            <Select value={form.raum} onValueChange={(v) => setForm((p) => ({ ...p, raum: v }))}>
              <SelectTrigger><SelectValue placeholder="Raum wählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Raum</SelectItem>
                {raeume.map((r) => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.raumname}{r.fields.gebaeude ? ` – ${r.fields.gebaeude}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dozenten CRUD Dialog ────────────────────────────────────────────

function DozentDialog({
  open,
  onOpenChange,
  record,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: Dozenten | null;
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ vorname: '', nachname: '', email: '', telefon: '', fachgebiet: '' });

  useEffect(() => {
    if (open) {
      setForm({
        vorname: record?.fields.vorname ?? '',
        nachname: record?.fields.nachname ?? '',
        email: record?.fields.email ?? '',
        telefon: record?.fields.telefon ?? '',
        fachgebiet: record?.fields.fachgebiet ?? '',
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Dozenten['fields'] = {
        vorname: form.vorname || undefined,
        nachname: form.nachname || undefined,
        email: form.email || undefined,
        telefon: form.telefon || undefined,
        fachgebiet: form.fachgebiet || undefined,
      };
      if (isEditing) {
        await LivingAppsService.updateDozentenEntry(record!.record_id, fields);
        toast.success('Dozent aktualisiert');
      } else {
        await LivingAppsService.createDozentenEntry(fields);
        toast.success('Dozent erstellt');
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(`Fehler beim ${isEditing ? 'Speichern' : 'Erstellen'}`, { description: err instanceof Error ? err.message : 'Unbekannter Fehler' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Dozent bearbeiten' : 'Neuen Dozenten erstellen'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Bearbeite die Dozentendaten.' : 'Erstelle einen neuen Dozenten.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doz-vorname">Vorname</Label>
              <Input id="doz-vorname" value={form.vorname} onChange={(e) => setForm((p) => ({ ...p, vorname: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doz-nachname">Nachname</Label>
              <Input id="doz-nachname" value={form.nachname} onChange={(e) => setForm((p) => ({ ...p, nachname: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="doz-email">E-Mail</Label>
            <Input id="doz-email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doz-telefon">Telefon</Label>
            <Input id="doz-telefon" type="tel" value={form.telefon} onChange={(e) => setForm((p) => ({ ...p, telefon: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doz-fach">Fachgebiet</Label>
            <Input id="doz-fach" value={form.fachgebiet} onChange={(e) => setForm((p) => ({ ...p, fachgebiet: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Räume CRUD Dialog ───────────────────────────────────────────────

function RaumDialog({
  open,
  onOpenChange,
  record,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: Raeume | null;
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ raumname: '', gebaeude: '', kapazitaet: '' });

  useEffect(() => {
    if (open) {
      setForm({
        raumname: record?.fields.raumname ?? '',
        gebaeude: record?.fields.gebaeude ?? '',
        kapazitaet: record?.fields.kapazitaet?.toString() ?? '',
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Raeume['fields'] = {
        raumname: form.raumname || undefined,
        gebaeude: form.gebaeude || undefined,
        kapazitaet: form.kapazitaet ? Number(form.kapazitaet) : undefined,
      };
      if (isEditing) {
        await LivingAppsService.updateRaeumeEntry(record!.record_id, fields);
        toast.success('Raum aktualisiert');
      } else {
        await LivingAppsService.createRaeumeEntry(fields);
        toast.success('Raum erstellt');
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(`Fehler beim ${isEditing ? 'Speichern' : 'Erstellen'}`, { description: err instanceof Error ? err.message : 'Unbekannter Fehler' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Raum bearbeiten' : 'Neuen Raum erstellen'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Bearbeite die Raumdaten.' : 'Erstelle einen neuen Raum.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="raum-name">Raumname</Label>
            <Input id="raum-name" value={form.raumname} onChange={(e) => setForm((p) => ({ ...p, raumname: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="raum-gebaeude">Gebäude</Label>
            <Input id="raum-gebaeude" value={form.gebaeude} onChange={(e) => setForm((p) => ({ ...p, gebaeude: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="raum-kap">Kapazität</Label>
            <Input id="raum-kap" type="number" min={1} value={form.kapazitaet} onChange={(e) => setForm((p) => ({ ...p, kapazitaet: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Teilnehmer CRUD Dialog ──────────────────────────────────────────

function TeilnehmerDialog({
  open,
  onOpenChange,
  record,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: Teilnehmer | null;
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ vorname: '', nachname: '', email: '', telefon: '', geburtsdatum: '' });

  useEffect(() => {
    if (open) {
      setForm({
        vorname: record?.fields.vorname ?? '',
        nachname: record?.fields.nachname ?? '',
        email: record?.fields.email ?? '',
        telefon: record?.fields.telefon ?? '',
        geburtsdatum: record?.fields.geburtsdatum?.split('T')[0] ?? '',
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Teilnehmer['fields'] = {
        vorname: form.vorname || undefined,
        nachname: form.nachname || undefined,
        email: form.email || undefined,
        telefon: form.telefon || undefined,
        geburtsdatum: form.geburtsdatum || undefined,
      };
      if (isEditing) {
        await LivingAppsService.updateTeilnehmerEntry(record!.record_id, fields);
        toast.success('Teilnehmer aktualisiert');
      } else {
        await LivingAppsService.createTeilnehmerEntry(fields);
        toast.success('Teilnehmer erstellt');
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(`Fehler beim ${isEditing ? 'Speichern' : 'Erstellen'}`, { description: err instanceof Error ? err.message : 'Unbekannter Fehler' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Teilnehmer bearbeiten' : 'Neuen Teilnehmer erstellen'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Bearbeite die Teilnehmerdaten.' : 'Erstelle einen neuen Teilnehmer.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tn-vorname">Vorname</Label>
              <Input id="tn-vorname" value={form.vorname} onChange={(e) => setForm((p) => ({ ...p, vorname: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tn-nachname">Nachname</Label>
              <Input id="tn-nachname" value={form.nachname} onChange={(e) => setForm((p) => ({ ...p, nachname: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tn-email">E-Mail</Label>
            <Input id="tn-email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tn-telefon">Telefon</Label>
            <Input id="tn-telefon" type="tel" value={form.telefon} onChange={(e) => setForm((p) => ({ ...p, telefon: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tn-geb">Geburtsdatum</Label>
            <Input id="tn-geb" type="date" value={form.geburtsdatum} onChange={(e) => setForm((p) => ({ ...p, geburtsdatum: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Anmeldungen CRUD Dialog ─────────────────────────────────────────

function AnmeldungDialog({
  open,
  onOpenChange,
  record,
  teilnehmer,
  kurse,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: Anmeldungen | null;
  teilnehmer: Teilnehmer[];
  kurse: Kurse[];
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ teilnehmerId: 'none', kursId: 'none', anmeldedatum: todayStr(), bezahlt: false });

  useEffect(() => {
    if (open) {
      setForm({
        teilnehmerId: extractRecordId(record?.fields.teilnehmer) ?? 'none',
        kursId: extractRecordId(record?.fields.kurs) ?? 'none',
        anmeldedatum: record?.fields.anmeldedatum?.split('T')[0] ?? todayStr(),
        bezahlt: record?.fields.bezahlt ?? false,
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Anmeldungen['fields'] = {
        teilnehmer: form.teilnehmerId !== 'none' ? createRecordUrl(APP_IDS.TEILNEHMER, form.teilnehmerId) : undefined,
        kurs: form.kursId !== 'none' ? createRecordUrl(APP_IDS.KURSE, form.kursId) : undefined,
        anmeldedatum: form.anmeldedatum || undefined,
        bezahlt: form.bezahlt,
      };
      if (isEditing) {
        await LivingAppsService.updateAnmeldungenEntry(record!.record_id, fields);
        toast.success('Anmeldung aktualisiert');
      } else {
        await LivingAppsService.createAnmeldungenEntry(fields);
        toast.success('Anmeldung erstellt');
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(`Fehler beim ${isEditing ? 'Speichern' : 'Erstellen'}`, { description: err instanceof Error ? err.message : 'Unbekannter Fehler' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Anmeldung bearbeiten' : 'Neue Anmeldung'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Bearbeite die Anmeldung.' : 'Erstelle eine neue Kursanmeldung.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Teilnehmer</Label>
            <Select value={form.teilnehmerId} onValueChange={(v) => setForm((p) => ({ ...p, teilnehmerId: v }))}>
              <SelectTrigger><SelectValue placeholder="Teilnehmer wählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">– Bitte wählen –</SelectItem>
                {teilnehmer.map((t) => (
                  <SelectItem key={t.record_id} value={t.record_id}>
                    {t.fields.vorname} {t.fields.nachname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kurs</Label>
            <Select value={form.kursId} onValueChange={(v) => setForm((p) => ({ ...p, kursId: v }))}>
              <SelectTrigger><SelectValue placeholder="Kurs wählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">– Bitte wählen –</SelectItem>
                {kurse.map((k) => (
                  <SelectItem key={k.record_id} value={k.record_id}>
                    {k.fields.titel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="anm-datum">Anmeldedatum</Label>
            <Input id="anm-datum" type="date" value={form.anmeldedatum} onChange={(e) => setForm((p) => ({ ...p, anmeldedatum: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="anm-bezahlt" checked={form.bezahlt} onCheckedChange={(c) => setForm((p) => ({ ...p, bezahlt: c === true }))} />
            <Label htmlFor="anm-bezahlt">Bezahlt</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : isEditing ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Loading State ───────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 animate-in fade-in duration-300">
      <div className="max-w-[1280px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

// ─── Error State ─────────────────────────────────────────────────────

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold">Fehler beim Laden</h2>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" /> Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Dashboard Component ────────────────────────────────────────

export default function Dashboard() {
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [dozenten, setDozenten] = useState<Dozenten[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Dialog states
  const [kursDialog, setKursDialog] = useState<{ open: boolean; record?: Kurse | null }>({ open: false });
  const [dozentDialog, setDozentDialog] = useState<{ open: boolean; record?: Dozenten | null }>({ open: false });
  const [raumDialog, setRaumDialog] = useState<{ open: boolean; record?: Raeume | null }>({ open: false });
  const [teilnehmerDialog, setTeilnehmerDialog] = useState<{ open: boolean; record?: Teilnehmer | null }>({ open: false });
  const [anmeldungDialog, setAnmeldungDialog] = useState<{ open: boolean; record?: Anmeldungen | null }>({ open: false });

  // Delete states
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);

  // Search/filter
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [k, r, d, a, t] = await Promise.all([
        LivingAppsService.getKurse(),
        LivingAppsService.getRaeume(),
        LivingAppsService.getDozenten(),
        LivingAppsService.getAnmeldungen(),
        LivingAppsService.getTeilnehmer(),
      ]);
      setKurse(k);
      setRaeume(r);
      setDozenten(d);
      setAnmeldungen(a);
      setTeilnehmer(t);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Lookup Maps ─────────────────────────────────────────────────

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

  // ─── Derived Data ────────────────────────────────────────────────

  const anmeldungenPerKurs = useMemo(() => {
    const counts = new Map<string, number>();
    anmeldungen.forEach((a) => {
      const kursId = extractRecordId(a.fields.kurs);
      if (!kursId) return;
      counts.set(kursId, (counts.get(kursId) ?? 0) + 1);
    });
    return counts;
  }, [anmeldungen]);

  const totalAnmeldungen = anmeldungen.length;
  const bezahlteAnmeldungen = anmeldungen.filter((a) => a.fields.bezahlt === true).length;
  const offeneAnmeldungen = totalAnmeldungen - bezahlteAnmeldungen;

  const avgAuslastung = useMemo(() => {
    const ratios: number[] = [];
    kurse.forEach((k) => {
      if (k.fields.maximale_teilnehmer && k.fields.maximale_teilnehmer > 0) {
        const count = anmeldungenPerKurs.get(k.record_id) ?? 0;
        ratios.push(count / k.fields.maximale_teilnehmer);
      }
    });
    if (ratios.length === 0) return 0;
    return ratios.reduce((a, b) => a + b, 0) / ratios.length;
  }, [kurse, anmeldungenPerKurs]);

  const totalUmsatzBezahlt = useMemo(() => {
    let sum = 0;
    anmeldungen.forEach((a) => {
      if (a.fields.bezahlt !== true) return;
      const kursId = extractRecordId(a.fields.kurs);
      if (!kursId) return;
      const kurs = kursMap.get(kursId);
      if (kurs?.fields.preis) sum += kurs.fields.preis;
    });
    return sum;
  }, [anmeldungen, kursMap]);

  const totalUmsatzOffen = useMemo(() => {
    let sum = 0;
    anmeldungen.forEach((a) => {
      if (a.fields.bezahlt === true) return;
      const kursId = extractRecordId(a.fields.kurs);
      if (!kursId) return;
      const kurs = kursMap.get(kursId);
      if (kurs?.fields.preis) sum += kurs.fields.preis;
    });
    return sum;
  }, [anmeldungen, kursMap]);

  const recentAnmeldungen = useMemo(() => {
    return [...anmeldungen]
      .sort((a, b) => (b.fields.anmeldedatum ?? '').localeCompare(a.fields.anmeldedatum ?? ''))
      .slice(0, 8);
  }, [anmeldungen]);

  const sortedKurse = useMemo(() => {
    return [...kurse].sort((a, b) => (a.fields.startdatum ?? '').localeCompare(b.fields.startdatum ?? ''));
  }, [kurse]);

  // ─── Delete Handler ──────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    try {
      switch (type) {
        case 'kurse': await LivingAppsService.deleteKurseEntry(id); break;
        case 'dozenten': await LivingAppsService.deleteDozentenEntry(id); break;
        case 'raeume': await LivingAppsService.deleteRaeumeEntry(id); break;
        case 'teilnehmer': await LivingAppsService.deleteTeilnehmerEntry(id); break;
        case 'anmeldungen': await LivingAppsService.deleteAnmeldungenEntry(id); break;
      }
      toast.success('Gelöscht', { description: `"${deleteTarget.name}" wurde gelöscht.` });
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      toast.error('Fehler beim Löschen', { description: err instanceof Error ? err.message : 'Unbekannter Fehler' });
    }
  }

  // ─── Resolve helpers ─────────────────────────────────────────────

  function resolveDozentName(url: string | undefined): string {
    if (!url) return '–';
    const id = extractRecordId(url);
    if (!id) return '–';
    const d = dozentMap.get(id);
    return d ? `${d.fields.vorname ?? ''} ${d.fields.nachname ?? ''}`.trim() || '–' : '–';
  }

  function resolveRaumName(url: string | undefined): string {
    if (!url) return '–';
    const id = extractRecordId(url);
    if (!id) return '–';
    const r = raumMap.get(id);
    return r ? `${r.fields.raumname ?? ''}${r.fields.gebaeude ? ` – ${r.fields.gebaeude}` : ''}` || '–' : '–';
  }

  function resolveKursTitle(url: string | undefined): string {
    if (!url) return '–';
    const id = extractRecordId(url);
    if (!id) return '–';
    return kursMap.get(id)?.fields.titel ?? '–';
  }

  function resolveTeilnehmerName(url: string | undefined): string {
    if (!url) return '–';
    const id = extractRecordId(url);
    if (!id) return '–';
    const t = teilnehmerMap.get(id);
    return t ? `${t.fields.vorname ?? ''} ${t.fields.nachname ?? ''}`.trim() || '–' : '–';
  }

  // ─── Render ──────────────────────────────────────────────────────

  if (loading) return <><LoadingState /><Toaster position="top-right" /></>;
  if (error) return <><ErrorState error={error} onRetry={fetchAll} /><Toaster position="top-right" /></>;

  const paymentRate = totalAnmeldungen > 0 ? Math.round((bezahlteAnmeldungen / totalAnmeldungen) * 100) : 0;

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-300">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Kursverwaltung</h1>
          <Button onClick={() => setAnmeldungDialog({ open: true, record: null })} className="hidden md:inline-flex">
            <Plus className="h-4 w-4 mr-2" /> Neue Anmeldung
          </Button>
          <Button size="icon" onClick={() => setAnmeldungDialog({ open: true, record: null })} className="md:hidden">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-6">
        {/* ─── Desktop Layout ─────────────────────────────────── */}
        <div className="hidden md:grid md:grid-cols-[1fr_380px] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Hero Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              {/* Anmeldungen */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Anmeldungen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold tracking-tight">{totalAnmeldungen}</div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'hsl(152 55% 42%)' }} />
                      {bezahlteAnmeldungen} bezahlt
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'hsl(32 95% 52%)' }} />
                      {offeneAnmeldungen} offen
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Aktive Kurse */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aktive Kurse</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold tracking-tight">{kurse.length}</div>
                  <p className="text-sm text-muted-foreground mt-1">{dozenten.length} Dozenten, {raeume.length} Räume</p>
                </CardContent>
              </Card>

              {/* Auslastung */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ø Auslastung</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold tracking-tight">{Math.round(avgAuslastung * 100)}%</div>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(avgAuslastung * 100, 100)}%`, background: capacityColor(avgAuslastung) }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs - Main Content */}
            <Tabs defaultValue="kurse">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="kurse"><BookOpen className="h-4 w-4 mr-1.5" /> Kurse</TabsTrigger>
                <TabsTrigger value="dozenten"><GraduationCap className="h-4 w-4 mr-1.5" /> Dozenten</TabsTrigger>
                <TabsTrigger value="raeume"><DoorOpen className="h-4 w-4 mr-1.5" /> Räume</TabsTrigger>
                <TabsTrigger value="teilnehmer"><Users className="h-4 w-4 mr-1.5" /> Teilnehmer</TabsTrigger>
                <TabsTrigger value="anmeldungen"><ClipboardList className="h-4 w-4 mr-1.5" /> Anmeldungen</TabsTrigger>
              </TabsList>

              {/* ── Kurse Tab ─────────────────────────────────────── */}
              <TabsContent value="kurse" className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Kurse suchen..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <Button size="sm" onClick={() => setKursDialog({ open: true, record: null })}>
                    <Plus className="h-4 w-4 mr-1" /> Neuen Kurs erstellen
                  </Button>
                </div>
                {sortedKurse.length === 0 ? (
                  <Card><CardContent className="py-12 text-center text-muted-foreground">Noch keine Kurse vorhanden. Erstelle deinen ersten Kurs!</CardContent></Card>
                ) : (
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titel</TableHead>
                          <TableHead>Dozent</TableHead>
                          <TableHead>Raum</TableHead>
                          <TableHead>Zeitraum</TableHead>
                          <TableHead>Auslastung</TableHead>
                          <TableHead className="text-right">Preis</TableHead>
                          <TableHead className="w-20" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedKurse
                          .filter((k) => !searchQuery || k.fields.titel?.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((kurs) => {
                            const count = anmeldungenPerKurs.get(kurs.record_id) ?? 0;
                            const max = kurs.fields.maximale_teilnehmer ?? 0;
                            const ratio = max > 0 ? count / max : 0;
                            return (
                              <TableRow key={kurs.record_id} className="group hover:bg-muted/50">
                                <TableCell className="font-medium">{kurs.fields.titel ?? '–'}</TableCell>
                                <TableCell className="text-muted-foreground">{resolveDozentName(kurs.fields.dozent)}</TableCell>
                                <TableCell className="text-muted-foreground">{resolveRaumName(kurs.fields.raum)}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {formatDate(kurs.fields.startdatum)}{kurs.fields.enddatum ? ` – ${formatDate(kurs.fields.enddatum)}` : ''}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 min-w-[120px]">
                                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(ratio * 100, 100)}%`, background: capacityColor(ratio) }} />
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">{count}/{max || '∞'}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(kurs.fields.preis)}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setKursDialog({ open: true, record: kurs })}>
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: 'kurse', id: kurs.record_id, name: kurs.fields.titel ?? 'Kurs' })}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </TabsContent>

              {/* ── Dozenten Tab ───────────────────────────────────── */}
              <TabsContent value="dozenten" className="space-y-4">
                <div className="flex items-center justify-end">
                  <Button size="sm" onClick={() => setDozentDialog({ open: true, record: null })}>
                    <Plus className="h-4 w-4 mr-1" /> Neuen Dozenten erstellen
                  </Button>
                </div>
                {dozenten.length === 0 ? (
                  <Card><CardContent className="py-12 text-center text-muted-foreground">Noch keine Dozenten vorhanden.</CardContent></Card>
                ) : (
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>E-Mail</TableHead>
                          <TableHead>Telefon</TableHead>
                          <TableHead>Fachgebiet</TableHead>
                          <TableHead className="w-20" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...dozenten].sort((a, b) => (a.fields.nachname ?? '').localeCompare(b.fields.nachname ?? '')).map((d) => (
                          <TableRow key={d.record_id} className="group hover:bg-muted/50">
                            <TableCell className="font-medium">{d.fields.vorname} {d.fields.nachname}</TableCell>
                            <TableCell className="text-muted-foreground">{d.fields.email ?? '–'}</TableCell>
                            <TableCell className="text-muted-foreground">{d.fields.telefon ?? '–'}</TableCell>
                            <TableCell className="text-muted-foreground">{d.fields.fachgebiet ?? '–'}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDozentDialog({ open: true, record: d })}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: 'dozenten', id: d.record_id, name: `${d.fields.vorname} ${d.fields.nachname}` })}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </TabsContent>

              {/* ── Räume Tab ──────────────────────────────────────── */}
              <TabsContent value="raeume" className="space-y-4">
                <div className="flex items-center justify-end">
                  <Button size="sm" onClick={() => setRaumDialog({ open: true, record: null })}>
                    <Plus className="h-4 w-4 mr-1" /> Neuen Raum erstellen
                  </Button>
                </div>
                {raeume.length === 0 ? (
                  <Card><CardContent className="py-12 text-center text-muted-foreground">Noch keine Räume vorhanden.</CardContent></Card>
                ) : (
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Raumname</TableHead>
                          <TableHead>Gebäude</TableHead>
                          <TableHead className="text-right">Kapazität</TableHead>
                          <TableHead className="w-20" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...raeume].sort((a, b) => (a.fields.gebaeude ?? '').localeCompare(b.fields.gebaeude ?? '')).map((r) => (
                          <TableRow key={r.record_id} className="group hover:bg-muted/50">
                            <TableCell className="font-medium">{r.fields.raumname ?? '–'}</TableCell>
                            <TableCell className="text-muted-foreground">{r.fields.gebaeude ?? '–'}</TableCell>
                            <TableCell className="text-right">{r.fields.kapazitaet ?? '–'}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRaumDialog({ open: true, record: r })}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: 'raeume', id: r.record_id, name: r.fields.raumname ?? 'Raum' })}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </TabsContent>

              {/* ── Teilnehmer Tab ─────────────────────────────────── */}
              <TabsContent value="teilnehmer" className="space-y-4">
                <div className="flex items-center justify-end">
                  <Button size="sm" onClick={() => setTeilnehmerDialog({ open: true, record: null })}>
                    <Plus className="h-4 w-4 mr-1" /> Neuen Teilnehmer erstellen
                  </Button>
                </div>
                {teilnehmer.length === 0 ? (
                  <Card><CardContent className="py-12 text-center text-muted-foreground">Noch keine Teilnehmer vorhanden.</CardContent></Card>
                ) : (
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>E-Mail</TableHead>
                          <TableHead>Telefon</TableHead>
                          <TableHead>Geburtsdatum</TableHead>
                          <TableHead className="w-20" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...teilnehmer].sort((a, b) => (a.fields.nachname ?? '').localeCompare(b.fields.nachname ?? '')).map((t) => (
                          <TableRow key={t.record_id} className="group hover:bg-muted/50">
                            <TableCell className="font-medium">{t.fields.vorname} {t.fields.nachname}</TableCell>
                            <TableCell className="text-muted-foreground">{t.fields.email ?? '–'}</TableCell>
                            <TableCell className="text-muted-foreground">{t.fields.telefon ?? '–'}</TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(t.fields.geburtsdatum)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTeilnehmerDialog({ open: true, record: t })}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: 'teilnehmer', id: t.record_id, name: `${t.fields.vorname} ${t.fields.nachname}` })}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </TabsContent>

              {/* ── Anmeldungen Tab ────────────────────────────────── */}
              <TabsContent value="anmeldungen" className="space-y-4">
                <div className="flex items-center justify-end">
                  <Button size="sm" onClick={() => setAnmeldungDialog({ open: true, record: null })}>
                    <Plus className="h-4 w-4 mr-1" /> Neue Anmeldung
                  </Button>
                </div>
                {anmeldungen.length === 0 ? (
                  <Card><CardContent className="py-12 text-center text-muted-foreground">Noch keine Anmeldungen vorhanden.</CardContent></Card>
                ) : (
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Teilnehmer</TableHead>
                          <TableHead>Kurs</TableHead>
                          <TableHead>Anmeldedatum</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-20" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...anmeldungen].sort((a, b) => (b.fields.anmeldedatum ?? '').localeCompare(a.fields.anmeldedatum ?? '')).map((a) => (
                          <TableRow key={a.record_id} className="group hover:bg-muted/50">
                            <TableCell className="font-medium">{resolveTeilnehmerName(a.fields.teilnehmer)}</TableCell>
                            <TableCell className="text-muted-foreground">{resolveKursTitle(a.fields.kurs)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(a.fields.anmeldedatum)}</TableCell>
                            <TableCell>
                              <Badge variant={a.fields.bezahlt ? 'default' : 'secondary'} className={a.fields.bezahlt ? 'bg-[hsl(152_55%_42%)] hover:bg-[hsl(152_55%_38%)] text-white' : 'text-foreground'}>
                                {a.fields.bezahlt ? 'Bezahlt' : 'Offen'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAnmeldungDialog({ open: true, record: a })}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: 'anmeldungen', id: a.record_id, name: `${resolveTeilnehmerName(a.fields.teilnehmer)} → ${resolveKursTitle(a.fields.kurs)}` })}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Letzte Anmeldungen */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Letzte Anmeldungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {recentAnmeldungen.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Keine Anmeldungen vorhanden.</p>
                ) : (
                  recentAnmeldungen.map((a) => (
                    <div
                      key={a.record_id}
                      className="flex items-center justify-between py-2.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setAnmeldungDialog({ open: true, record: a })}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{resolveTeilnehmerName(a.fields.teilnehmer)}</div>
                        <div className="text-xs text-muted-foreground truncate">{resolveKursTitle(a.fields.kurs)}</div>
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        <span className="text-xs text-muted-foreground">{formatDate(a.fields.anmeldedatum)}</span>
                        <Badge variant={a.fields.bezahlt ? 'default' : 'secondary'} className={`text-[10px] px-1.5 py-0 ${a.fields.bezahlt ? 'bg-[hsl(152_55%_42%)] hover:bg-[hsl(152_55%_38%)] text-white' : 'text-foreground'}`}>
                          {a.fields.bezahlt ? 'Bezahlt' : 'Offen'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Zahlungsübersicht */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Zahlungsübersicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Einnahmen (bezahlt)</span>
                  <span className="text-sm font-semibold" style={{ color: 'hsl(152 55% 42%)' }}>{formatCurrency(totalUmsatzBezahlt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ausstehend</span>
                  <span className="text-sm font-semibold" style={{ color: 'hsl(32 95% 52%)' }}>{formatCurrency(totalUmsatzOffen)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Zahlungsrate</span>
                    <span className="text-sm font-semibold">{paymentRate}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${paymentRate}%`, background: 'hsl(152 55% 42%)' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Übersicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5" /> Dozenten</span>
                  <span className="font-medium">{dozenten.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-2"><DoorOpen className="h-3.5 w-3.5" /> Räume</span>
                  <span className="font-medium">{raeume.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Teilnehmer</span>
                  <span className="font-medium">{teilnehmer.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ─── Mobile Layout ──────────────────────────────────── */}
        <div className="md:hidden space-y-5">
          {/* Hero - Anmeldungen */}
          <Card>
            <CardContent className="pt-6 pb-5 text-center">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Anmeldungen gesamt</p>
              <div className="text-5xl font-extrabold tracking-tight">{totalAnmeldungen}</div>
              <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'hsl(152 55% 42%)' }} />
                  {bezahlteAnmeldungen} bezahlt
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'hsl(32 95% 52%)' }} />
                  {offeneAnmeldungen} offen
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick KPI Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {[
              { icon: BookOpen, value: kurse.length, label: 'Kurse aktiv' },
              { icon: GraduationCap, value: dozenten.length, label: 'Dozenten' },
              { icon: DoorOpen, value: raeume.length, label: 'Räume' },
              { icon: Users, value: teilnehmer.length, label: 'Teilnehmer' },
            ].map((chip) => (
              <div key={chip.label} className="flex items-center gap-2 bg-muted rounded-full px-4 py-2 shrink-0">
                <chip.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{chip.value}</span>
                <span className="text-sm text-muted-foreground">{chip.label}</span>
              </div>
            ))}
          </div>

          {/* Mobile Tabs */}
          <Tabs defaultValue="kurse">
            <TabsList className="w-full">
              <TabsTrigger value="kurse" className="flex-1 text-xs">Kurse</TabsTrigger>
              <TabsTrigger value="dozenten" className="flex-1 text-xs">Dozenten</TabsTrigger>
              <TabsTrigger value="raeume" className="flex-1 text-xs">Räume</TabsTrigger>
              <TabsTrigger value="teilnehmer" className="flex-1 text-xs">Teiln.</TabsTrigger>
              <TabsTrigger value="anmeldungen" className="flex-1 text-xs">Anmeld.</TabsTrigger>
            </TabsList>

            {/* Mobile Kurse */}
            <TabsContent value="kurse" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Kurse</h2>
                <Button size="sm" variant="outline" onClick={() => setKursDialog({ open: true, record: null })}>
                  <Plus className="h-4 w-4 mr-1" /> Neu
                </Button>
              </div>
              {sortedKurse.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Noch keine Kurse vorhanden.</p>
              ) : (
                sortedKurse.map((kurs) => {
                  const count = anmeldungenPerKurs.get(kurs.record_id) ?? 0;
                  const max = kurs.fields.maximale_teilnehmer ?? 0;
                  const ratio = max > 0 ? count / max : 0;
                  return (
                    <Card key={kurs.record_id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setKursDialog({ open: true, record: kurs })}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold">{kurs.fields.titel ?? '–'}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {resolveDozentName(kurs.fields.dozent)} · {formatDate(kurs.fields.startdatum)}{kurs.fields.enddatum ? ` – ${formatDate(kurs.fields.enddatum)}` : ''}
                            </div>
                          </div>
                          <span className="text-xs font-medium text-muted-foreground shrink-0">{formatCurrency(kurs.fields.preis)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(ratio * 100, 100)}%`, background: capacityColor(ratio) }} />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">{count} / {max || '∞'} Plätze</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setKursDialog({ open: true, record: kurs }); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'kurse', id: kurs.record_id, name: kurs.fields.titel ?? 'Kurs' }); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* Mobile Dozenten */}
            <TabsContent value="dozenten" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Dozenten</h2>
                <Button size="sm" variant="outline" onClick={() => setDozentDialog({ open: true, record: null })}>
                  <Plus className="h-4 w-4 mr-1" /> Neu
                </Button>
              </div>
              {dozenten.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Noch keine Dozenten vorhanden.</p>
              ) : (
                [...dozenten].sort((a, b) => (a.fields.nachname ?? '').localeCompare(b.fields.nachname ?? '')).map((d) => (
                  <div key={d.record_id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{d.fields.vorname} {d.fields.nachname}</div>
                      <div className="text-xs text-muted-foreground">{d.fields.fachgebiet ?? '–'}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDozentDialog({ open: true, record: d })}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget({ type: 'dozenten', id: d.record_id, name: `${d.fields.vorname} ${d.fields.nachname}` })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Mobile Räume */}
            <TabsContent value="raeume" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Räume</h2>
                <Button size="sm" variant="outline" onClick={() => setRaumDialog({ open: true, record: null })}>
                  <Plus className="h-4 w-4 mr-1" /> Neu
                </Button>
              </div>
              {raeume.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Noch keine Räume vorhanden.</p>
              ) : (
                [...raeume].sort((a, b) => (a.fields.gebaeude ?? '').localeCompare(b.fields.gebaeude ?? '')).map((r) => (
                  <div key={r.record_id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{r.fields.raumname ?? '–'}</div>
                      <div className="text-xs text-muted-foreground">{r.fields.gebaeude ?? '–'} · Kapazität: {r.fields.kapazitaet ?? '–'}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRaumDialog({ open: true, record: r })}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget({ type: 'raeume', id: r.record_id, name: r.fields.raumname ?? 'Raum' })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Mobile Teilnehmer */}
            <TabsContent value="teilnehmer" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Teilnehmer</h2>
                <Button size="sm" variant="outline" onClick={() => setTeilnehmerDialog({ open: true, record: null })}>
                  <Plus className="h-4 w-4 mr-1" /> Neu
                </Button>
              </div>
              {teilnehmer.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Noch keine Teilnehmer vorhanden.</p>
              ) : (
                [...teilnehmer].sort((a, b) => (a.fields.nachname ?? '').localeCompare(b.fields.nachname ?? '')).map((t) => (
                  <div key={t.record_id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{t.fields.vorname} {t.fields.nachname}</div>
                      <div className="text-xs text-muted-foreground">{t.fields.email ?? '–'}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTeilnehmerDialog({ open: true, record: t })}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget({ type: 'teilnehmer', id: t.record_id, name: `${t.fields.vorname} ${t.fields.nachname}` })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Mobile Anmeldungen */}
            <TabsContent value="anmeldungen" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Anmeldungen</h2>
                <Button size="sm" variant="outline" onClick={() => setAnmeldungDialog({ open: true, record: null })}>
                  <Plus className="h-4 w-4 mr-1" /> Neu
                </Button>
              </div>
              {anmeldungen.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Noch keine Anmeldungen vorhanden.</p>
              ) : (
                [...anmeldungen].sort((a, b) => (b.fields.anmeldedatum ?? '').localeCompare(a.fields.anmeldedatum ?? '')).map((a) => (
                  <div key={a.record_id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm">{resolveTeilnehmerName(a.fields.teilnehmer)}</div>
                      <div className="text-xs text-muted-foreground">{resolveKursTitle(a.fields.kurs)} · {formatDate(a.fields.anmeldedatum)}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={a.fields.bezahlt ? 'default' : 'secondary'} className={`text-[10px] ${a.fields.bezahlt ? 'bg-[hsl(152_55%_42%)] text-white' : 'text-foreground'}`}>
                        {a.fields.bezahlt ? 'Bezahlt' : 'Offen'}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAnmeldungDialog({ open: true, record: a })}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ type: 'anmeldungen', id: a.record_id, name: `${resolveTeilnehmerName(a.fields.teilnehmer)} → ${resolveKursTitle(a.fields.kurs)}` })}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>

          {/* Recent Anmeldungen (mobile) */}
          <div className="space-y-2">
            <h2 className="text-base font-semibold">Letzte Anmeldungen</h2>
            {recentAnmeldungen.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">Keine Anmeldungen.</p>
            ) : (
              recentAnmeldungen.slice(0, 5).map((a) => (
                <div key={a.record_id} className="flex items-center justify-between py-2" onClick={() => setAnmeldungDialog({ open: true, record: a })}>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{resolveTeilnehmerName(a.fields.teilnehmer)}</div>
                    <div className="text-xs text-muted-foreground">{resolveKursTitle(a.fields.kurs)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-muted-foreground">{formatDate(a.fields.anmeldedatum)}</span>
                    <Badge variant={a.fields.bezahlt ? 'default' : 'secondary'} className={`text-[10px] px-1.5 py-0 ${a.fields.bezahlt ? 'bg-[hsl(152_55%_42%)] text-white' : 'text-foreground'}`}>
                      {a.fields.bezahlt ? 'Bezahlt' : 'Offen'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Fixed bottom CTA spacer */}
          <div className="h-16" />
        </div>
      </main>

      {/* ─── Fixed Mobile CTA ─────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t z-40">
        <Button className="w-full h-12 text-base font-semibold" onClick={() => setAnmeldungDialog({ open: true, record: null })}>
          <Plus className="h-5 w-5 mr-2" /> Neue Anmeldung
        </Button>
      </div>

      {/* ─── All Dialogs ──────────────────────────────────────── */}
      <KursDialog
        open={kursDialog.open}
        onOpenChange={(open) => setKursDialog((p) => ({ ...p, open }))}
        record={kursDialog.record}
        dozenten={dozenten}
        raeume={raeume}
        onSuccess={fetchAll}
      />
      <DozentDialog
        open={dozentDialog.open}
        onOpenChange={(open) => setDozentDialog((p) => ({ ...p, open }))}
        record={dozentDialog.record}
        onSuccess={fetchAll}
      />
      <RaumDialog
        open={raumDialog.open}
        onOpenChange={(open) => setRaumDialog((p) => ({ ...p, open }))}
        record={raumDialog.record}
        onSuccess={fetchAll}
      />
      <TeilnehmerDialog
        open={teilnehmerDialog.open}
        onOpenChange={(open) => setTeilnehmerDialog((p) => ({ ...p, open }))}
        record={teilnehmerDialog.record}
        onSuccess={fetchAll}
      />
      <AnmeldungDialog
        open={anmeldungDialog.open}
        onOpenChange={(open) => setAnmeldungDialog((p) => ({ ...p, open }))}
        record={anmeldungDialog.record}
        teilnehmer={teilnehmer}
        kurse={kurse}
        onSuccess={fetchAll}
      />
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Eintrag löschen?"
        description={deleteTarget ? `Möchtest du "${deleteTarget.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.` : ''}
        onConfirm={handleDelete}
      />

      <Toaster position="top-right" />
    </div>
  );
}
