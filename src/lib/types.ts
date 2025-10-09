

export type Project = {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    startDate: string;
    endDate: string;
    status: 'On Track' | 'At Risk' | 'Off Track' | 'Completed';
    team: User[];
    tasks: Task[];
    documents: Document[];
    subProjects: SubProject[];
    notes?: string;
    checklist: ChecklistItem[];
    projectType: 'Rulemaking' | 'Tim Kerja';
    annex?: string;
    casr?: string;
    casrRevision?: string;
    tags?: string[];
    createdAt: string;
};

export type Task = {
    id: string;
    title: string;
    assigneeIds: string[];
    startDate: string;
    dueDate: string;
    status: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
    parentId: string | null;
    subTasks: Task[];
    attachments?: Attachment[];
    doneDate?: string;
    criticalIssue?: string;
    namaSurat?: string;
    tanggalPelaksanaan?: string;
    progress?: number;
};

export type Attachment = {
    id: string;
    name: string;
    url: string;
};

export type Document = {
    id: string;
    name: string;
    url: string;
    type: 'PDF' | 'Word' | 'Excel' | 'Image' | 'Other';
    uploadDate: string;
};

export type SubProject = {
    id: string;
    name: string;
    status: 'On Track' | 'At Risk' | 'Off Track' | 'Completed';
};

export type ChecklistItem = {
    id: string;
    text: string;
    completed: boolean;
};

export type User = {
    id: string;
    name: string;
    email: string | null;
    avatarUrl?: string;
    role: 'Sub-Directorate Head' | 'Team Lead' | 'PIC' | 'PIC Assistant' | 'Functional';
    isApproved?: boolean;
    lastOnline?: string;
};

export type CcefodRecord = {
    id: string;
    adaPerubahan: 'YA' | 'TIDAK';
    usulanPerubahan?: string;
    isiUsulan?: string;
    annex: string;
    annexReference: string;
    standardPractice: string;
    legislationReference: string;
    implementationLevel: string;
    differenceText?: string;
    differenceReason?: string;
    remarks?: string;
    status: 'Draft' | 'Final' | 'Existing';
    createdAt: string;
};

export type PqRecord = {
    id: string;
    pqNumber: string;
    protocolQuestion: string;
    guidance: string;
    icaoReferences: string;
    ppq: 'YES' | 'NO';
    criticalElement: 'CE - 1' | 'CE - 2' | 'CE - 3' | 'CE - 4' | 'CE - 5' | 'CE - 6' | 'CE - 7' | 'CE - 8';
    remarks?: string;
    evidence?: string;
    answer?: string;
    poc?: string;
    icaoStatus: 'Satisfactory' | 'No Satisfactory';
    cap?: string;
    sspComponent?: string;
    status: 'Existing' | 'Draft' | 'Final';
    createdAt: string;
};

export type EvaluationItem = {
    id: string;
    icaoSarp: string;
    review: string;
    complianceStatus: 'No Differences' | 'More Exacting or Exceeds' | 'Different in character or other means of compliance' | 'Less protective or partially implemented or not implemented' | 'Not Applicable';
    casrAffected: string;
};

export type Inspector = {
    id: string;
    name: string;
    signature?: string;
};

export type GapAnalysisRecord = {
    id: string;
    slReferenceNumber: string;
    annex: string;
    typeOfStateLetter: string;
    dateOfEvaluation: string;
    subject: string;
    letterName: string;
    letterSubject: string;
    implementationDate?: string;
    actionRequired: string;
    effectiveDate?: string;
    applicabilityDate?: string;
    embeddedApplicabilityDate: string;
    evaluations: EvaluationItem[];
    statusItem: 'OPEN' | 'CLOSED';
    summary: string;
    inspectors: Inspector[];
    createdAt: string;
};

export type GlossaryRecord = {
    id: string;
    tsu: string;
    tsa: string;
    editing: string;
    makna: string;
    keterangan: string;
    referensi?: string;
    status: 'Draft' | 'Final';
    createdAt: string | Date;
};

export type Notification = {
    id: string;
    userId: string;
    title: string;
    description: string;
    href: string;
    isRead: boolean;
    createdAt: any; // Firestore Timestamp
};

export type AccidentIncidentRecord = {
    id: string;
    tanggal: string;
    kategori: 'Accident (A)' | 'Serious Incident (SI)';
    aoc: string;
    registrasiPesawat: string;
    tipePesawat: string;
    lokasi: string;
    taxonomy: string;
    keteranganKejadian?: string;
    korbanJiwa: string; // Will store the final combined string
    createdAt: string;
};

export type KnktReport = {
    id: string;
    tanggal_diterbitkan: string;
    nomor_laporan: string;
    status: string;
    operator: string;
    registrasi: string;
    tipe_pesawat: string;
    lokasi: string;
    taxonomy?: string;
    keterangan?: string;
    fileUrl?: string;
    createdAt: string;
};

export type PemeriksaanRecord = {
    id: string;
    kategori: string;
    jenisPesawat: string;
    registrasi: string;
    tahunPembuatan: string;
    operator: string;
    tanggal: string;
    lokasi: string;
    korban: string;
    ringkasanKejadian: string;
    statusPenanganan: string;
    tindakLanjut: string;
    filePemeriksaanUrl?: string;
    createdAt: string;
};

export type RekomendasiKeselamatan = {
    id: string;
    nomor: string;
    deskripsi: string;
};

export type TindakLanjutRecord = {
    id: string;
    judulLaporan: string;
    nomorLaporan: string;
    tanggalTerbit?: string;
    tanggalKejadian: string;
    status: 'Draft' | 'Final' | 'Preliminary' | 'Interim Statement' | 'Draft Final';
    penerimaRekomendasi: string[];
    rekomendasi: RekomendasiKeselamatan[];
    tindakLanjutDkppu?: string;
    tindakLanjutOperator?: string;
    tahun: number;
    createdAt: string;
    registrasiPesawat?: string;
    tipePesawat?: string;
    lokasiKejadian?: string;
    fileUrl?: string;
};

export type TindakLanjutDgcaRecord = {
  id: string;
  judulLaporan: string;
  nomorLaporan: string;
  operator: string;
  tipePesawat: string;
  registrasi: string;
  lokasi: string;
  tanggalKejadian: string;
  tanggalTerbit?: string;
  rekomendasiKeDgca: string;
  nomorRekomendasi: string;
  tindakLanjutDkppu: string;
  fileUrl?: string;
  createdAt: string;
};

export type LawEnforcementReference = {
    id: string;
    sanctionType: string;
    refLetter: string;
    dateLetter: string;
};

export type LawEnforcementRecord = {
    id: string;
    impositionType: 'aoc' | 'personnel' | 'organization';
    sanctionedAoc?: { value: string }[];
    sanctionedPersonnel?: { value: string }[];
    sanctionedOrganization?: { value: string }[];
    references: LawEnforcementReference[];
    createdAt: string;
};

export type ChatMessage = {
    id: string;
    chatRoomId: string;
    text: string;
    senderId: string;
    senderName: string;
    senderAvatarUrl?: string;
    createdAt: any; // Firestore Timestamp
};
