

import { z } from 'zod';

export const ccefodFormSchema = z.object({
    adaPerubahan: z.enum(['YA', 'TIDAK']),
    usulanPerubahan: z.string().nullable().optional(),
    isiUsulan: z.string().nullable().optional(),
    annex: z.string().min(1, 'Annex is required'),
    annexReference: z.string().min(1, 'Annex Reference is required'),
    standardPractice: z.any().refine(val => typeof val === 'string' && val.trim().length > 0 && val.trim() !== '<p></p>', {
      message: "Standard or Recommended Practice is required"
    }),
    legislationReference: z.string().min(1, 'State Legislation Reference is required'),
    implementationLevel: z.enum([
      "No difference",
      "More exacting or exceeds",
      "Different in character or other means of compliance",
      "Less protective or patially implemented or not implemented",
      "Not applicable",
      "No  Information  Provided",
      "Insufficient  Information  Provided"
    ]),
    differenceText: z.string().nullable().optional(),
    differenceReason: z.string().nullable().optional(),
    remarks: z.string().nullable().optional(),
    status: z.enum(['Existing', 'Draft', 'Final']),
});
  
export const pqFormSchema = z.object({
  pqNumber: z.string().min(1, 'PQ Number is required'),
  protocolQuestion: z.string().min(1, 'Protocol Question is required'),
  guidance: z.string().min(1, 'Guidance for Review of Evidence is required'),
  icaoReferences: z.string().min(1, 'ICAO References are required'),
  ppq: z.enum(['YES', 'NO']),
  criticalElement: z.enum(['CE - 1','CE - 2','CE - 3','CE - 4','CE - 5','CE - 6','CE - 7','CE - 8']),
  remarks: z.string().optional(),
  evidence: z.string().optional(),
  answer: z.string().optional(),
  poc: z.string().optional(),
  icaoStatus: z.enum(['Satisfactory', 'No Satisfactory']),
  cap: z.string().optional(),
  sspComponent: z.string().optional(),
  status: z.enum(['Existing', 'Draft', 'Final']),
});

const inspectorSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Inspector name is required'),
  signature: z.string().optional(),
});

export const gapAnalysisFormSchema = z.object({
  slReferenceNumber: z.string().min(1, 'SL Reference Number is required'),
  annex: z.string().min(1, 'Annex is required'),
  typeOfStateLetter: z.string().min(1, 'Type of State Letter is required'),
  dateOfEvaluation: z.date().optional(),
  subject: z.string().min(1, 'Subject is required'),
  letterName: z.string().optional(),
  letterSubject: z.string().optional(),
  implementationDate: z.date().optional(),
  actionRequired: z.string().min(1, 'Action Required is required'),
  effectiveDate: z.date().optional(),
  applicabilityDate: z.date().optional(),
  embeddedApplicabilityDate: z.date({ required_error: 'Embedded applicability date is required.' }),
  evaluations: z.array(z.object({
    id: z.string(),
    icaoSarp: z.string().min(1, 'ICAO SARP is required'),
    review: z.string().min(1, 'Review is required'),
    complianceStatus: z.enum([
      'No Differences',
      'More Exacting or Exceeds',
      'Different in character or other means of compliance',
      'Less protective or partially implemented or not implemented',
      'Not Applicable',
    ]),
    casrAffected: z.string().min(1, 'CASR to be affected is required'),
  })).min(1, 'At least one evaluation item is required'),
  statusItem: z.enum(['OPEN', 'CLOSED']),
  summary: z.string().optional(),
  inspectors: z.array(inspectorSchema).optional(),
});

export const glossaryFormSchema = z.object({
  tsu: z.string().min(1, 'TSU is required'),
  tsa: z.string().min(1, 'TSA is required'),
  editing: z.string().min(1, 'Editing is required'),
  makna: z.string().min(1, 'Makna is required'),
  keterangan: z.string().min(1, 'Keterangan / Pengaplikasian is required'),
  referensi: z.string().optional(),
  status: z.enum(['Draft', 'Final']),
});

export const accidentIncidentFormSchema = z.object({
  tanggal: z.date({ required_error: "Tanggal is required." }),
  kategori: z.enum(['Accident (A)', 'Serious Incident (SI)'], { required_error: "Kategori is required." }),
  aoc: z.string().min(1, 'AOC is required.'),
  registrasiPesawat: z.string().min(1, 'Registrasi Pesawat is required.'),
  tipePesawat: z.string().min(1, 'Tipe Pesawat is required.'),
  lokasi: z.string().min(1, 'Lokasi is required.'),
  taxonomy: z.string().min(1, 'Taxonomy is required.'),
  keteranganKejadian: z.string().optional(),
  adaKorbanJiwa: z.enum(['Ada', 'Tidak Ada']),
  jumlahKorbanJiwa: z.string().optional(),
}).refine(data => {
    if (data.adaKorbanJiwa === 'Ada') {
        return !!data.jumlahKorbanJiwa && data.jumlahKorbanJiwa.length > 0;
    }
    return true;
}, {
    message: 'Jumlah korban jiwa is required when there are casualties.',
    path: ['jumlahKorbanJiwa'],
});

export const pemeriksaanFormSchema = z.object({
    kategori: z.enum(['Accident (A)', 'Serious Incident (SI)']),
    jenisPesawat: z.string().min(1, 'Jenis Pesawat is required.'),
    registrasi: z.string().min(1, 'Registrasi is required.'),
    tahunPembuatan: z.string().min(1, 'Tahun Pembuatan is required.'),
    operator: z.string().min(1, 'Operator is required.'),
    tanggal: z.date({ required_error: "Tanggal is required." }),
    lokasi: z.string().min(1, 'Lokasi is required.'),
    korban: z.string().min(1, 'Korban is required.'),
    ringkasanKejadian: z.string().min(1, 'Ringkasan Kejadian is required.'),
    statusPenanganan: z.string().min(1, 'Status Penanganan is required.'),
    tindakLanjut: z.string().min(1, 'Tindak Lanjut is required.'),
    filePemeriksaanUrl: z.string().url().optional().or(z.literal('')),
});

export const knktReportFormSchema = z.object({
  tanggal_diterbitkan: z.date({ required_error: 'Tanggal is required.' }),
  nomor_laporan: z.string().min(1, 'Nomor Laporan is required.'),
  status: z.enum(['Final', 'Preliminary', 'Interim Statement', 'Draft Final']),
  operator: z.string().min(1, 'Operator is required.'),
  registrasi: z.string().min(1, 'Registrasi is required.'),
  tipe_pesawat: z.string().min(1, 'Tipe Pesawat is required.'),
  lokasi: z.string().min(1, 'Lokasi is required.'),
  taxonomy: z.string().optional(),
  keterangan: z.string().optional(),
});

export const rekomendasiKeselamatanSchema = z.object({
    id: z.string(),
    nomor: z.string().min(1, 'Nomor rekomendasi is required.'),
    deskripsi: z.string().min(1, 'Deskripsi is required.'),
});

export const tindakLanjutFormSchema = z.object({
    judulLaporan: z.string().min(1, 'Judul Laporan is required.'),
    nomorLaporan: z.string().min(1, 'Nomor Laporan is required.'),
    tanggalTerbit: z.date({ required_error: "Tanggal Terbit is required." }),
    tanggalKejadian: z.date({ required_error: "Tanggal Kejadian is required." }),
    penerimaRekomendasi: z.string().min(1, 'Penerima Rekomendasi is required.'),
    rekomendasi: z.array(rekomendasiKeselamatanSchema).min(1, 'At least one recommendation is required.'),
    tindakLanjutDkppu: z.string().min(1, 'Tindak Lanjut DKPPU is required.'),
    tindakLanjutOperator: z.string().min(1, 'Tindak Lanjut Operator is required.'),
});
