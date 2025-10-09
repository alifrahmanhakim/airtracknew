
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
