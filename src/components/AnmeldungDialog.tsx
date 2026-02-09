import { useState, useEffect } from 'react'
import type { Kurse, Teilnehmer, Anmeldungen } from '@/types/app'
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService'
import { APP_IDS } from '@/types/app'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface AnmeldungDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record?: Anmeldungen | null
  kurse: Kurse[]
  teilnehmer: Teilnehmer[]
  onSuccess: () => void
}

export function AnmeldungDialog({ open, onOpenChange, record, kurse, teilnehmer, onSuccess }: AnmeldungDialogProps) {
  const isEditing = !!record
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    teilnehmer: '',
    kurs: '',
    anmeldedatum: new Date().toISOString().split('T')[0],
    bezahlt: false,
  })

  useEffect(() => {
    if (open) {
      if (record) {
        setFormData({
          teilnehmer: extractRecordId(record.fields.teilnehmer) || '',
          kurs: extractRecordId(record.fields.kurs) || '',
          anmeldedatum: record.fields.anmeldedatum?.split('T')[0] || new Date().toISOString().split('T')[0],
          bezahlt: record.fields.bezahlt || false,
        })
      } else {
        setFormData({
          teilnehmer: '',
          kurs: '',
          anmeldedatum: new Date().toISOString().split('T')[0],
          bezahlt: false,
        })
      }
    }
  }, [open, record])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.teilnehmer || !formData.kurs) {
      toast.error('Bitte wähle einen Teilnehmer und einen Kurs aus.')
      return
    }
    setSubmitting(true)
    try {
      const apiData = {
        teilnehmer: createRecordUrl(APP_IDS.TEILNEHMER, formData.teilnehmer),
        kurs: createRecordUrl(APP_IDS.KURSE, formData.kurs),
        anmeldedatum: formData.anmeldedatum,
        bezahlt: formData.bezahlt,
      }
      if (isEditing) {
        await LivingAppsService.updateAnmeldungenEntry(record!.record_id, apiData)
        toast.success('Anmeldung aktualisiert')
      } else {
        await LivingAppsService.createAnmeldungenEntry(apiData)
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(`Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Anmeldung bearbeiten' : 'Neue Anmeldung'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Ändere die Anmeldedaten.' : 'Melde einen Teilnehmer für einen Kurs an.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Teilnehmer *</Label>
            <Select value={formData.teilnehmer || 'none'} onValueChange={v => setFormData(p => ({ ...p, teilnehmer: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Teilnehmer wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">– Bitte wählen –</SelectItem>
                {teilnehmer.map(t => (
                  <SelectItem key={t.record_id} value={t.record_id}>
                    {`${t.fields.vorname || ''} ${t.fields.nachname || ''}`.trim() || '(Ohne Name)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kurs *</Label>
            <Select value={formData.kurs || 'none'} onValueChange={v => setFormData(p => ({ ...p, kurs: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Kurs wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">– Bitte wählen –</SelectItem>
                {kurse.map(k => (
                  <SelectItem key={k.record_id} value={k.record_id}>
                    {k.fields.titel || '(Ohne Titel)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="anmeldedatum">Anmeldedatum</Label>
            <Input
              id="anmeldedatum"
              type="date"
              value={formData.anmeldedatum}
              onChange={e => setFormData(p => ({ ...p, anmeldedatum: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="bezahlt"
              checked={formData.bezahlt}
              onCheckedChange={checked => setFormData(p => ({ ...p, bezahlt: checked === true }))}
            />
            <Label htmlFor="bezahlt" className="cursor-pointer">Bezahlt</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichert...' : (isEditing ? 'Speichern' : 'Anmelden')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
