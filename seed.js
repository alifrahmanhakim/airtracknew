
// This script is NOT part of the application runtime.
// It is a utility script to seed the Firestore database with initial data.
// To use it, run `npm run seed` from your terminal.

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

// IMPORTANT: This configuration is now aligned with your actual Firebase config from src/lib/firebase.ts
const firebaseConfig = {
    apiKey: "AIzaSyCVT1PDkGdczXUP_LatsS6Q4K1h0xvXeT0",
    authDomain: "aoc-insight.firebaseapp.com",
    projectId: "aoc-insight",
    storageBucket: "aoc-insight.appspot.com",
    messagingSenderId: "795850632942",
    appId: "1:795850632942:web:e780d8191316b17c8651a8",
    measurementId: "G-CNFZC766E2"
};


// These are the static users from src/lib/data.ts
const users = [
    { id: 'admin-00', name: 'Admin User', email: 'admin@admin2023.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Sub-Directorate Head', isApproved: true },
    { id: 'admin-01', name: 'Hakim Alif Rahman', email: 'hakimalifrahman@gmail.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Sub-Directorate Head', isApproved: true },
    { id: 'rizkywirapratama434', name: 'Rizky Wirapratama', email: 'rizkywirapratama434@gmail.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Sub-Directorate Head', isApproved: true },
    { id: '8aOs7OSaL8XFXLq7DxzbnuXN5eC3', name: 'Chewy Sihusky', email: 'chewysihusky@gmail.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Sub-Directorate Head' },
    { id: 'user-1', name: 'Alex Johnson', email: 'alex.johnson@example.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Team Lead' },
    { id: 'user-2', name: 'Maria Garcia', email: 'maria.garcia@example.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'PIC' },
    { id: 'user-3', name: 'James Smith', email: 'james.smith@example.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'PIC Assistant' },
    { id: 'user-4', name: 'Patricia Williams', email: 'patricia.williams@example.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'Functional' },
];

const accidentIncidentRecords = [
    { tanggal: '2022-02-24', kategori: 'Serious Incident (SI)', operator: 'PT. Ekspres Transportasi Antarbenua', aoc: 'AOC 135', registrasiPesawat: 'PK-RJH', tipePesawat: 'Eurocopter EC135P2', lokasi: 'Seletar Airport', wilayah: 'Singapura', taxonomy: 'Runway Incursion' },
    { tanggal: '2022-02-26', kategori: 'Serious Incident (SI)', operator: 'PT Smart Cakrawala Aviation', aoc: 'AOC 135', registrasiPesawat: 'PK-SNB', tipePesawat: 'Pilatus PC-6 Porter', lokasi: 'Baya Biru Airstrip, Nabire', wilayah: 'Papua', taxonomy: 'Runway Excursion (RE)' },
    { tanggal: '2022-02-28', kategori: 'Accident (A)', operator: 'PT. Spirit Avia Sentosa', aoc: 'AOC 135', registrasiPesawat: 'PK-FSW', tipePesawat: 'Cessna C208B - Grand Caravan', lokasi: 'Bilogai Sugapa, Papua', wilayah: 'Papua', taxonomy: 'Runway Excursion (RE)' },
    { tanggal: '2022-05-24', kategori: 'Serious Incident (SI)', operator: 'PT Asi Pudjiastuti Aviation (Susi Air)', aoc: 'AOC 135', registrasiPesawat: 'PK-BVE', tipePesawat: 'Cessna C208B - Grand Caravan', lokasi: 'Bandara Yuvai Semaring Krayan, Kalimantan Utara', wilayah: 'Kalimantan', taxonomy: 'Ground Collision (GCOL)' },
    { tanggal: '2022-05-31', kategori: 'Serious Incident (SI)', operator: 'PT Wings Abadi Airlines', aoc: 'AOC 121', registrasiPesawat: 'PK-WGF', tipePesawat: 'ATR 72', lokasi: 'I Gusti Ngurah Rai Airport, Bali', wilayah: 'Bali', taxonomy: 'Navigation Errors (NAV)' },
    { tanggal: '2022-06-04', kategori: 'Serious Incident (SI)', operator: 'PT Batik Air Indonesia', aoc: 'AOC 121', registrasiPesawat: 'PK-LUS', tipePesawat: 'Airbus A320', lokasi: 'Enroute from Ternate to CGK', wilayah: 'Jawa', taxonomy: 'Turbulence Encounter (TURB)' },
    { tanggal: '2022-06-08', kategori: 'Accident (A)', operator: 'PT Derazona Airlines', aoc: 'AOC 135', registrasiPesawat: 'PK-DAR', tipePesawat: 'Bell 412', lokasi: 'Enroute from Jila to Timika', wilayah: 'Papua', taxonomy: 'Controlled Flight into or Toward Terrain (CFIT)' },
    { tanggal: '2022-06-23', kategori: 'Accident (A)', operator: 'PT Asi Pudjiastuti Aviation (Susi Air)', aoc: 'AOC 135', registrasiPesawat: 'PK-BVM', tipePesawat: 'Pilatus PC-6 Porter', lokasi: 'Duma District, Papua', wilayah: 'Papua', taxonomy: 'Controlled Flight into or Toward Terrain (CFIT)' },
    { tanggal: '2022-06-28', kategori: 'Accident (A)', operator: 'PT AMA', aoc: 'AOC 135', registrasiPesawat: 'PK-RCQ', tipePesawat: 'Pilatus PC-6 Porter', lokasi: 'Senggi Area, Papua', wilayah: 'Papua', taxonomy: 'Fuel Related (FUEL)' },
    { tanggal: '2022-07-12', kategori: 'Accident (A)', operator: 'Whitesky Aviation', aoc: 'AOC 135', registrasiPesawat: 'PK-WSU', tipePesawat: 'Bell 505', lokasi: 'Fly Bali Heliport, Ungasan Bali', wilayah: 'Bali', taxonomy: 'Ground Handling (RAMP)' },
    { tanggal: '2022-07-21', kategori: 'Serious Incident (SI)', operator: 'PT Citilink Indonesia', aoc: 'AOC 121', registrasiPesawat: 'PK-GLW', tipePesawat: 'Airbus A320', lokasi: 'Juanda International Airport, Surabaya', wilayah: 'Jawa', taxonomy: 'Medical (MED)' },
    { tanggal: '2022-08-03', kategori: 'Serious Incident (SI)', operator: 'PT Wings Abadi Airlines', aoc: 'AOC 121', registrasiPesawat: 'PK-WGL', tipePesawat: 'ATR 72', lokasi: 'I Gusti Ngurah Rai Airport, Bali', wilayah: 'Bali', taxonomy: 'System/Component Failure or Malfunction (Powerplant) (SCF-PP)' },
    { tanggal: '2022-08-14', kategori: 'Serious Incident (SI)', operator: 'PT Asia Cargo Airlines', aoc: 'AOC 121', registrasiPesawat: 'PK-YGV', tipePesawat: 'Boeing 737-300F', lokasi: 'Syamsudin Noor International Airport, Banjarmasin', wilayah: 'Kalimantan', taxonomy: 'Abnormal Runway Contact (ARC)' },
    { tanggal: '2022-08-30', kategori: 'Accident (A)', operator: 'PT Smart Cakrawala Aviation', aoc: 'AOC 135', registrasiPesawat: 'PK-SNW', tipePesawat: 'Cessna C208B - Grand Caravan', lokasi: 'Sinak Airport, Puncak, Papua', wilayah: 'Papua', taxonomy: 'Runway Excursion (RE)' },
    { tanggal: '2022-09-05', kategori: 'Serious Incident (SI)', operator: 'Akademi Penerbang Indonesia Banyuwangi', aoc: 'PSC 141', registrasiPesawat: 'PK-BYC', tipePesawat: 'Cessna 172', lokasi: 'Pelengkung Beach', wilayah: 'Jawa', taxonomy: 'Low Altitude Operation (LALT)' },
    { tanggal: '2022-09-26', kategori: 'Serious Incident (SI)', operator: 'PT Pelita Air Service', aoc: 'AOC 121', registrasiPesawat: 'PK-PAH', tipePesawat: 'ATR 72', lokasi: 'Bandara Internasional Sultan Aji Muhammad Sulaiman Sepinggan, Balikpapan', wilayah: 'Kalimantan', taxonomy: 'Runway Excursion (RE)' },
    { tanggal: '2022-10-25', kategori: 'Serious Incident (SI)', operator: 'PT Reven Global Airtranspor', aoc: 'AOC 135', registrasiPesawat: 'PK-RVA', tipePesawat: 'Cessna C208B - Grand Caravan', lokasi: 'UPBU Ilaga, Papua', wilayah: 'Papua', taxonomy: 'Runway Excursion (RE)' },
    { tanggal: '2022-12-01', kategori: 'Serious Incident (SI)', operator: 'PT Volta Pasifik Aviasi', aoc: 'AOC 135', registrasiPesawat: 'PK-VPJ', tipePesawat: 'Robinson R66', lokasi: 'Fly Bali Heliport, Ungasan Bali', wilayah: 'Bali', taxonomy: 'Lost of Control-Inflight (LOC-I)' },
    { tanggal: '2022-12-05', kategori: 'Accident (A)', operator: 'PT Carpediem Aviasi Mandiri', aoc: 'AOC 135', registrasiPesawat: 'PK-CDO', tipePesawat: 'Bell 206B3', lokasi: 'Area Mining 01 Helipad', wilayah: 'Papua', taxonomy: 'Ground Handling (RAMP)' },
    { tanggal: '2022-12-17', kategori: 'Serious Incident (SI)', operator: 'PT Sinar Mas Super Air', aoc: 'OC 137', registrasiPesawat: 'PK-PND', tipePesawat: 'Thrush S2R-T34', lokasi: 'Kajui Airstrip', wilayah: 'Kalimantan', taxonomy: 'Runway Excursion (RE)' },
    { tanggal: '2022-12-23', kategori: 'Accident (A)', operator: 'PT Rimbun Abadi Aviasi', aoc: 'AOC 135', registrasiPesawat: 'PK-OTY', tipePesawat: 'DHC6-300 Twin Otter', lokasi: 'Bandara Moanamani', wilayah: 'Papua', taxonomy: 'Runway Excursion (RE)' },
];

const knktReports = [
  { tanggal_diterbitkan: '2022-01-07', nomor_laporan: 'KNKT.18.04.10.04', status: 'Final', operator: 'PT Whitesky Aviation', aoc: 'AOC 135', registrasi: 'PK-WSX', tipe_pesawat: 'Bell 429', lokasi: 'Morowali, Sulawesi Tengah', wilayah: 'Sulawesi' },
  { tanggal_diterbitkan: '2022-01-13', nomor_laporan: 'KNKT.21.01.01.04', status: '1st Interim Statement', operator: 'PT Sriwijaya Air', aoc: 'AOC 135', registrasi: 'PK-CLC', tipe_pesawat: 'Boeing 737-500', lokasi: 'Kepulauan Seribu District, DKI Jakarta', wilayah: 'Jawa' },
  { tanggal_diterbitkan: '2022-03-02', nomor_laporan: 'KNKT.21.12.20.04', status: 'Preliminary', operator: 'PT Airfast Indonesia', aoc: 'AOC 135', registrasi: 'PK-ODB', tipe_pesawat: 'Eurocopter AS 350 B3', lokasi: 'Near Camp 99, Yahukimo', wilayah: 'Papua' },
  { tanggal_diterbitkan: '2022-03-04', nomor_laporan: 'KNKT.21.12.19.04', status: 'Preliminary', operator: 'PT Jayawijaya Dirgantara', aoc: 'AOC 121', registrasi: 'PK-JRW', tipe_pesawat: 'Boeing 737-200', lokasi: 'Sentani Airport', wilayah: 'Papua' },
  { tanggal_diterbitkan: '2022-03-21', nomor_laporan: 'KNKT.21.12.18.04', status: 'Preliminary', operator: 'PT Lion Mentari Airlines', aoc: 'AOC 121', registrasi: 'PK-LQR', tipe_pesawat: 'Boeing 737-900ER', lokasi: 'Enroute Padang to Batam', wilayah: 'Kep. Riau' },
  { tanggal_diterbitkan: '2022-03-22', nomor_laporan: 'KNKT.18.01.02.04', status: 'Final', operator: 'PT Citilink Indonesia', aoc: 'AOC 121', registrasi: 'PK-GLH & PK-GTA', tipe_pesawat: 'Airbus A320-200', lokasi: 'Near Waypoint EMARA, Surabaya Airspace', wilayah: 'Jawa' },
  { tanggal_diterbitkan: '2022-03-28', nomor_laporan: 'KNKT.21.03.03.04', status: '1st Interim Statement', operator: 'PT Jayawijaya Dirgantara', aoc: 'AOC 121', registrasi: 'PK-LUT', tipe_pesawat: 'Airbus A320', lokasi: 'Bandara DJB', wilayah: 'Sumatra' },
  { tanggal_diterbitkan: '2022-03-28', nomor_laporan: 'KNKT.22.02.01.04', status: 'Preliminary', operator: 'PT Smart Cakrawala Aviation', aoc: 'AOC 135', registrasi: 'PK-SNB', tipe_pesawat: 'Pilatus PC-6 Porter', lokasi: 'Bayabiru Airstrip, Paniai', wilayah: 'Papua' },
  { tanggal_diterbitkan: '2022-06-15', nomor_laporan: 'KNKT.21.01.01.04', status: 'Draft Final', operator: 'PT Sriwijaya Air', aoc: 'AOC 121', registrasi: 'PK-CLC', tipe_pesawat: 'Boeing 737-500', lokasi: 'Kepulauan Seribu District, DKI Jakarta', wilayah: 'Jawa' },
  { tanggal_diterbitkan: '2022-07-27', nomor_laporan: 'KNKT.22.06.06.04', status: 'Preliminary', operator: 'PT Derazona Air Service', aoc: 'AOC 135', registrasi: 'PK-DAR', tipe_pesawat: 'Bell 412', lokasi: 'About 24 Nm East of Mozes Kilangin Airport', wilayah: 'Papua' },
  { tanggal_diterbitkan: '2022-08-03', nomor_laporan: 'KNKT.22.05.03.04', status: 'Preliminary', operator: 'PT. ASI Pudjiastuti Aviation (Susi Air)', aoc: 'AOC 135', registrasi: 'PK-BVE', tipe_pesawat: 'Cessna 208B', lokasi: 'Yuvai Semaring Airport, Long Bawan', wilayah: 'Kalimantan' },
  { tanggal_diterbitkan: '2022-08-03', nomor_laporan: 'KNKT.22.05.04.04', status: 'Preliminary', operator: 'PT Wings Abadi Airlines', aoc: 'AOC 121', registrasi: 'PK-WGF', tipe_pesawat: 'ATR 72-212A', lokasi: 'Bandara I Gusti Ngurah Rai', wilayah: 'Bali' },
  { tanggal_diterbitkan: '2022-08-03', nomor_laporan: 'KNKT.16.05.14.04', status: 'Draft Final', operator: 'Hong Kong Airlines', aoc: 'AOC 129', registrasi: 'B-LNE', tipe_pesawat: 'Airbus 330-223', lokasi: 'Near Banjarmasin', wilayah: 'Kalimantan' },
  { tanggal_diterbitkan: '2022-08-15', nomor_laporan: 'KNKT.16.10.35.04', status: 'Final', operator: 'Perkasa Flying School', aoc: 'PSC 141', registrasi: 'PK-PBH', tipe_pesawat: 'Piper PA28-161 Warrior I', lokasi: 'Jeruk Legi Village, Cilacap', wilayah: 'Jawa' },
  { tanggal_diterbitkan: '2022-08-15', nomor_laporan: 'KNKT.13.09.25.04', status: 'Draft Final', operator: 'PT Wings Abadi Airlines', aoc: 'AOC 135', registrasi: 'PK-WFV', tipe_pesawat: 'ATR 72-212A', lokasi: 'Sultan Hasannudin International Airport', wilayah: 'Makassar' },
  { tanggal_diterbitkan: '2022-08-22', nomor_laporan: 'KNKT.17.11.35.04', status: 'Draft Final', operator: 'PT Garuda Indonesia', aoc: 'AOC 121', registrasi: 'PK-GPM', tipe_pesawat: 'Airbus A330-200', lokasi: 'South China Sea', wilayah: 'China' },
  { tanggal_diterbitkan: '2022-08-24', nomor_laporan: 'KNKT.22.07.10.04', status: 'Preliminary', operator: 'PT Citilink Indonesia', aoc: 'AOC 121', registrasi: 'PK-GLW', tipe_pesawat: 'Airbus A320-200', lokasi: 'Near Bandara Juanda, Surabaya', wilayah: 'Jawa' },
  { tanggal_diterbitkan: '2022-08-26', nomor_laporan: 'KNKT.22.06.07.04', status: 'Preliminary', operator: 'PT Asi Pudjiastuti (Susi Air)', aoc: 'AOC 135', registrasi: 'PK-BVM', tipe_pesawat: 'Pilatus PC-6/B2-H4', lokasi: 'Duma Airstrip', wilayah: 'Papua' },
  { tanggal_diterbitkan: '2022-08-31', nomor_laporan: 'TIB/AAI/CAS.203', status: 'Final', operator: 'PT Ekspres Transportasi Antarbenua', aoc: 'AOC 135', registrasi: 'PK-RJH', tipe_pesawat: 'Eurocopter EC135P2', lokasi: 'Seletar Airport', wilayah: 'Singapura' },
  { tanggal_diterbitkan: '2022-09-19', nomor_laporan: 'KNKT.18.07.28.04', status: 'Draft Final', operator: 'Akademi Penerbang Indonesia Banyuwangi', aoc: 'PSC 141', registrasi: 'PK-BYK', tipe_pesawat: 'Cessna 172 S', lokasi: 'Bandara Blimbingsari, Banyuwangi', wilayah: 'Jawa' },
  { tanggal_diterbitkan: '2022-09-19', nomor_laporan: 'KNKT.22.07.10.04', status: 'Preliminary', operator: 'PT White Sky Aviation', aoc: 'AOC 135', registrasi: 'PK-WSU', tipe_pesawat: 'Bell 505', lokasi: 'Ungasan Heliport', wilayah: 'Bali' },
  { tanggal_diterbitkan: '2022-09-21', nomor_laporan: 'KNKT.22.08.12.04', status: 'Preliminary', operator: 'PT Tri-M.G Intra Asia Airlines', aoc: 'AOC 135', registrasi: 'PK-YGV', tipe_pesawat: 'Boeing 737-300F', lokasi: 'Bandara Syamsudin Noor, Banjarmasin', wilayah: 'Kalimantan' },
  { tanggal_diterbitkan: '2022-10-18', nomor_laporan: 'KNKT.15.01.03.04', status: 'Draft Final', operator: 'Politeknik Penerbangan Indonesia Curug', aoc: 'PSC 141', registrasi: 'PK-AEH', tipe_pesawat: 'Piper Warior III', lokasi: 'Bandara Budiarto, Curug, Tangerang', wilayah: 'Jawa' },
  { tanggal_diterbitkan: '2022-11-08', nomor_laporan: 'KNKT.17.11.35.04', status: 'Final', operator: 'PT Garuda Indonesia', aoc: 'AOC 121', registrasi: 'PK-GPM', tipe_pesawat: 'Airbus A330-200', lokasi: 'South China Sea', wilayah: 'China' },
  { tanggal_diterbitkan: '2022-11-08', nomor_laporan: 'KNKT.22.09.14.04', status: 'Preliminary', operator: 'PT Pelita Air Service', aoc: 'AOC 121', registrasi: 'PK-PAH', tipe_pesawat: 'ATR 72-212A', lokasi: 'Bandara Internasional Sultan Aji Muhammad Sulaiman Sepinggan, Balikpapan', wilayah: 'Kalimantan' },
  { tanggal_diterbitkan: '2022-11-08', nomor_laporan: 'KNKT.22.08.13.04', status: 'Preliminary', operator: 'PT Smart Cakrawala Aviation', aoc: 'AOC 135', registrasi: 'PK-SNW', tipe_pesawat: 'Cessna 208B', lokasi: 'Bandara Sinak', wilayah: 'Papua' },
  { tanggal_diterbitkan: '2022-11-10', nomor_laporan: 'KNKT.21.01.01.04', status: 'Final', operator: 'PT Sriwijaya Air', aoc: 'AOC 121', registrasi: 'PK-CLC', tipe_pesawat: 'Boeing 737-500', lokasi: 'Kepulauan Seribu District, DKI Jakarta', wilayah: 'Jawa' },
  { tanggal_diterbitkan: '2022-12-27', nomor_laporan: 'KNKT.22.12.18.04', status: 'Preliminary', operator: 'PT Carpediem Aviasi Mandiri', aoc: 'AOC 135', registrasi: 'PK-CDO', tipe_pesawat: 'Bell 206 B3', lokasi: 'Area Mining 1, Kawe', wilayah: 'Papua' },
  { tanggal_diterbitkan: '2022-12-27', nomor_laporan: 'KNKT 22.10.15.04', status: 'Preliminary', operator: 'PT Reven Global Airtranspor', aoc: 'AOC 135', registrasi: 'PK-RVA', tipe_pesawat: 'Cessna Grand Caravan C208B', lokasi: 'Bandara Ilaga', wilayah: 'Papua' },
];


async function seedDatabase() {
    try {
        console.log('Initializing Firebase...');
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        console.log('Firebase initialized.');

        console.log('Starting to seed users...');
        const usersCollection = collection(db, 'users');
        
        const userPromises = users.map(user => {
            const userRef = doc(usersCollection, user.id);
            const { id, ...userData } = user;
            console.log(`Preparing to set user: ${user.email} with ID: ${user.id}`);
            return setDoc(userRef, userData, { merge: true });
        });

        await Promise.all(userPromises);
        console.log(`${users.length} users have been added or updated.`);

        console.log('Starting to seed accident/incident records...');
        const accidentIncidentCollection = collection(db, 'accidentIncidentRecords');
        const accidentPromises = accidentIncidentRecords.map((record, index) => {
            const recordId = `record-${String(index + 1).padStart(3, '0')}`;
            const recordRef = doc(accidentIncidentCollection, recordId);
            console.log(`Preparing to set accident/incident record with ID: ${recordId}`);
            return setDoc(recordRef, { ...record, createdAt: new Date().toISOString() }, { merge: true });
        });
        
        await Promise.all(accidentPromises);
        console.log(`${accidentIncidentRecords.length} accident/incident records have been added or updated.`);
        
        console.log('Starting to seed KNKT reports...');
        const knktReportsCollection = collection(db, 'knktReports');
        const knktReportPromises = knktReports.map((report, index) => {
            const reportId = `knkt-${String(index + 1).padStart(3, '0')}`;
            const reportRef = doc(knktReportsCollection, reportId);
            console.log(`Preparing to set KNKT report with ID: ${reportId}`);
            return setDoc(reportRef, { ...report, createdAt: new Date().toISOString() }, { merge: true });
        });

        await Promise.all(knktReportPromises);
        console.log(`${knktReports.length} KNKT reports have been added or updated.`);


        console.log('=============================================');
        console.log('✅ Seeding completed successfully!');
        console.log('=============================================');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1); // Exit with an error code
    }
}

seedDatabase().then(() => {
    // Firebase needs some time to close connections, so we'll wait a bit
    setTimeout(() => process.exit(0), 1000);
}).catch(() => {
    setTimeout(() => process.exit(1), 1000);
});
