// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface Kurse {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    titel?: string;
    beschreibung?: string;
    startdatum?: string; // Format: YYYY-MM-DD oder ISO String
    enddatum?: string; // Format: YYYY-MM-DD oder ISO String
    maximale_teilnehmer?: number;
    preis?: number;
    dozent?: string; // applookup -> URL zu 'Dozenten' Record
    raum?: string; // applookup -> URL zu 'Raeume' Record
  };
}

export interface Raeume {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    raumname?: string;
    gebaeude?: string;
    kapazitaet?: number;
  };
}

export interface Dozenten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
    fachgebiet?: string;
  };
}

export interface Anmeldungen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    teilnehmer?: string; // applookup -> URL zu 'Teilnehmer' Record
    kurs?: string; // applookup -> URL zu 'Kurse' Record
    anmeldedatum?: string; // Format: YYYY-MM-DD oder ISO String
    bezahlt?: boolean;
  };
}

export interface Teilnehmer {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    email?: string;
    telefon?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    vorname?: string;
    nachname?: string;
  };
}

export const APP_IDS = {
  KURSE: '6989fba5d8a2b2c7cde545c5',
  RAEUME: '6989fba40d9a8c21a46a7d96',
  DOZENTEN: '6989fb9e7ec54fdd7f7cc847',
  ANMELDUNGEN: '6989fba67d62a555af2368e0',
  TEILNEHMER: '6989fba5e714566fa12888de',
} as const;

// Helper Types for creating new records
export type CreateKurse = Kurse['fields'];
export type CreateRaeume = Raeume['fields'];
export type CreateDozenten = Dozenten['fields'];
export type CreateAnmeldungen = Anmeldungen['fields'];
export type CreateTeilnehmer = Teilnehmer['fields'];