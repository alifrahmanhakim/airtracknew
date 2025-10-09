
// This script is NOT part of the application runtime.
// It is a utility script to seed the Firestore database with initial data.
// To use it, run `npm run seed` from your terminal.

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

// IMPORTANT: This configuration is now aligned with your actual Firebase config from src/lib/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyCqr_jQW1ZxMuBjLDmDsoSZA8RKF-kjHO0",
  authDomain: "airtrack-c7979.firebaseapp.com",
  projectId: "airtrack-c7979",
  storageBucket: "airtrack-c7979.appspot.com",
  messagingSenderId: "1090515897511",
  appId: "1:1090515897511:web:40a0425c8ce80d70599f82",
  measurementId: "G-DFBV3WYJ6M"
};




const accidentIncidentRecords = [
    { tanggal: '2022-02-24', kategori: 'Serious Incident (SI)', aoc: 'AOC 135', registrasiPesawat: 'PK-RJH', tipePesawat: 'Eurocopter EC135P2', lokasi: 'Seletar Airport', taxonomy: 'Runway Incursion' },
    { tanggal: '2022-02-26', kategori: 'Serious Incident (SI)', aoc: 'AOC 135', registrasiPesawat: 'PK-SNB', tipePesawat: 'Pilatus PC-6 Porter', lokasi: 'Baya Biru Airstrip, Nabire', taxonomy: 'Runway Excursion (RE)' },
    { tanggal: '2022-02-28', kategori: 'Accident (A)', aoc: 'AOC 135', registrasiPesawat: 'PK-FSW', tipePesawat: 'Cessna C208B - Grand Caravan', lokasi: 'Bilogai Sugapa, Papua', taxonomy: 'Runway Excursion (RE)' },
    { tanggal: '2022-05-24', kategori: 'Serious Incident (SI)', aoc: 'AOC 135', registrasiPesawat: 'PK-BVE', tipePesawat: 'Cessna C208B - Grand Caravan', lokasi: 'Bandara Yuvai Semaring Krayan, Kalimantan Utara', taxonomy: 'Ground Collision (GCOL)' },
    { tanggal: '2022-05-31', kategori: 'Serious Incident (SI)', aoc: 'AOC 121', registrasiPesawat: 'PK-WGF', tipePesawat: 'ATR 72', lokasi: 'I Gusti Ngurah Rai Airport, Bali', taxonomy: 'Navigation Errors (NAV)' },
    { tanggal: '2022-06-04', kategori: 'Serious Incident (SI)', aoc: 'AOC 121', registrasiPesawat: 'PK-LUS', tipePesawat: 'Airbus A320', lokasi: 'Enroute from Ternate to CGK', taxonomy: 'Turbulence Encounter (TURB)' },
    { tanggal: '2022-06-08', kategori: 'Accident (A)', aoc: 'AOC 135', registrasiPesawat: 'PK-DAR', tipePesawat: 'Bell 412', lokasi: 'Enroute from Jila to Timika', taxonomy: 'Controlled Flight into or Toward Terrain (CFIT)' },
    { tanggal: '2022-06-23', kategori: 'Accident (A)', aoc: 'AOC 135', registrasiPesawat: 'PK-BVM', tipePesawat: 'Pilatus PC-6 Porter', lokasi: 'Duma District, Papua', taxonomy: 'Controlled Flight into or Toward Terrain (CFIT)' },
    { tanggal: '2022-06-28', kategori: 'Accident (A)', aoc: 'AOC 135', registrasiPesawat: 'PK-RCQ', tipePesawat: 'Pilatus PC-6 Porter', lokasi: 'Senggi Area, Papua', taxonomy: 'Fuel Related (FUEL)' },
    { tanggal: '2022-07-12', kategori: 'Accident (A)', aoc: 'AOC 135', registrasiPesawat: 'PK-WSU', tipePesawat: 'Bell 505', lokasi: 'Fly Bali Heliport, Ungasan Bali', taxonomy: 'Ground Handling (RAMP)' },
    { tanggal: '2022-07-21', kategori: 'Serious Incident (SI)', aoc: 'AOC 121', registrasiPesawat: 'PK-GLW', tipePesawat: 'Airbus A320', lokasi: 'Juanda International Airport, Surabaya', taxonomy: 'Medical (MED)' },
    { tanggal: '2022-08-03', kategori: 'Serious Incident (SI)', aoc: 'AOC 121', registrasiPesawat: 'PK-WGL', tipePesawat: 'ATR 72', lokasi: 'I Gusti Ngurah Rai Airport, Bali', taxonomy: 'System/Component Failure or Malfunction (Powerplant) (SCF-PP)' },
    { tanggal: '2022-08-14', kategori: 'Serious Incident (SI)', aoc: 'AOC 121', registrasiPesawat: 'PK-YGV', tipePesawat: 'Boeing 737-300F', lokasi: 'Syamsudin Noor International Airport, Banjarmasin', taxonomy: 'Abnormal Runway Contact (ARC)' },
    { tanggal: '2022-08-30', kategori: 'Accident (A)', aoc: 'AOC 135', registrasiPesawat: 'PK-SNW', tipePesawat: 'Cessna C208B - Grand Caravan', lokasi: 'Sinak Airport, Puncak, Papua', taxonomy: 'Runway Excursion (RE)' },
    { tanggal: '2022-09-05', kategori: 'Serious Incident (SI)', aoc: 'PSC 141', registrasiPesawat: 'PK-BYC', tipePesawat: 'Cessna 172', lokasi: 'Pelengkung Beach', taxonomy: 'Low Altitude Operation (LALT)' },
    { tanggal: '2022-09-26', kategori: 'Serious Incident (SI)', aoc: 'AOC 121', registrasiPesawat: 'PK-PAH', tipePesawat: 'ATR 72', lokasi: 'Bandara Internasional Sultan Aji Muhammad Sulaiman Sepinggan, Balikpapan', taxonomy: 'Runway Excursion (RE)' },
    { tanggal: '2022-10-25', kategori: 'Serious Incident (SI)', aoc: 'AOC 135', registrasiPesawat: 'PK-RVA', tipePesawat: 'Cessna C208B - Grand Caravan', lokasi: 'UPBU Ilaga, Papua', taxonomy: 'Runway Excursion (RE)' },
    { tanggal: '2022-12-01', kategori: 'Serious Incident (SI)', aoc: 'AOC 135', registrasiPesawat: 'PK-VPJ', tipePesawat: 'Robinson R66', lokasi: 'Fly Bali Heliport, Ungasan Bali', taxonomy: 'Lost of Control-Inflight (LOC-I)' },
    { tanggal: '2022-12-05', kategori: 'Accident (A)', aoc: 'AOC 135', registrasiPesawat: 'PK-CDO', tipePesawat: 'Bell 206B3', lokasi: 'Area Mining 01 Helipad', taxonomy: 'Ground Handling (RAMP)' },
    { tanggal: '2022-12-17', kategori: 'Serious Incident (SI)', aoc: 'OC 137', registrasiPesawat: 'PK-PND', tipePesawat: 'Thrush S2R-T34', lokasi: 'Kajui Airstrip', taxonomy: 'Runway Excursion (RE)' },
    { tanggal: '2022-12-23', kategori: 'Accident (A)', aoc: 'AOC 135', registrasiPesawat: 'PK-OTY', tipePesawat: 'DHC6-300 Twin Otter', lokasi: 'Bandara Moanamani', taxonomy: 'Runway Excursion (RE)' },
    { tanggal: '2025-01-27', kategori: 'Serious Incident (SI)', aoc: 'AOC 119_121', registrasiPesawat: 'PK-GMC', tipePesawat: 'Boeing 737-800', lokasi: 'Enroute from Aceh to Jakarta', taxonomy: 'Turbulence Encounter (TURB)', keteranganKejadian: 'Pesawat mengalami Turbulensi pada saat cruising level, pesawat melanjutkan penerbangan ke Jakarta dan mendarat dengan selamat.', korbanJiwa: 'Tidak ada' },
    { tanggal: '2025-02-04', kategori: 'Accident (A)', aoc: 'PSC 141', registrasiPesawat: 'PK-BYK', tipePesawat: 'Cessna C172', lokasi: 'Coastline South of Banyuwangi Airport', taxonomy: 'System/Component Failure or Malfunction (Powerplant) (SCF-PP)', keteranganKejadian: 'Pesawat mengalami engine loss saat meninggalkan area latihan Teluk Panggang dan melakukan pendaratan darurat di perairan dekat pantai Gumuk Kantong.', korbanJiwa: 'Tidak ada' },
    { tanggal: '2025-02-06', kategori: 'Accident (A)', aoc: 'AOC 119_135', registrasiPesawat: 'PK-ZUV', tipePesawat: 'Bell 206 L4', lokasi: 'Pahang, Malaysia', taxonomy: 'Loss of Control Inflight (LOC-I)', keteranganKejadian: 'Helikopter tengah melaksanakan pekerjaan external load kehilangan kendali saat hover untuk landing mengalami terguling, dan terbakar. Satu engineer meninggal akibat tertabrak bilah rotor, sementara pilot selamat dengan luka ringan.', korbanJiwa: 'Ada (1 enginner)' },
    { tanggal: '2025-02-14', kategori: 'Serious Incident (SI)', aoc: 'AOC 119_121', registrasiPesawat: 'PK-TLG', tipePesawat: 'A321-211', lokasi: 'Sultan Abdul Aziz Shah Subang Airport, Malaysia', taxonomy: 'Abnormal Runway Contact (ARC)', keteranganKejadian: 'Pada saat melakukan pendaratan, pesawat mengalami severe hard landing. PIC tidak melaporkan kondisi tersebut, sehingga terlambat mendeteksi kerusakan pesawat.', korbanJiwa: 'Tidak ada' },
    { tanggal: '2025-03-08', kategori: 'Serious Incident (SI)', aoc: 'AOC 119_135', registrasiPesawat: 'PK-OAM', tipePesawat: 'DHC6-400 Amphibian', lokasi: 'I Gusti Ngurang Rai International Airport, Denpasar', taxonomy: 'Abnormal Runway Contact (ARC)', keteranganKejadian: 'Pada saat mendarat di runway pesawat mendarat dengan roda pendaratan tidak diturunkan. Seluruh penumpang dan awak selamat tanpa korban jiwa.', korbanJiwa: 'Tidak ada' },
    { tanggal: '2025-04-22', kategori: 'Accident (A)', aoc: 'AOC 119_135', registrasiPesawat: 'PK-URT', tipePesawat: 'Bell 505', lokasi: 'Wiladatika Airstrip, Cibubur', taxonomy: 'Abnormal Runway Contact (ARC)', keteranganKejadian: 'Helikopter mengalami kecelakaan saat latihan circuit ke-7 dengan simulasi autorotation di Wiladatika, Cibubur. Helikopter menghantam landasan, namun instruktur dan siswa penerbang selamat tanpa luka.', korbanJiwa: 'Tidak ada' },
    { tanggal: '2025-04-26', kategori: 'Accident (A)', aoc: '119_OC 91', registrasiPesawat: 'PK-ITA', tipePesawat: 'AT502-B', lokasi: 'Indo Lampung Perkasa Airstrip, Lampung', taxonomy: 'Runway Excursion (RE)', keteranganKejadian: 'Pesawat keluar landasan saat take off di runway 27 Airstrip ILP dan menabrak tanggul sisi kiri runway. pesawat mengalami kerusakan parah. Pilot selamat tanpa cedera.', korbanJiwa: 'Tidak ada' },
    { tanggal: '2025-05-19', kategori: 'Serious Incident (SI)', aoc: 'FAOC 129', registrasiPesawat: '9V-JSK', tipePesawat: 'Airbus A320', lokasi: 'Juanda International Airport, Surabaya', taxonomy: 'ATM/CNS (ATM)', keteranganKejadian: 'Pada saat pesawat taxy ke arah taxiway 02, terdapat helikopter militer yang bergerak dan mendarat sekitar 100 meter di depan taxiway 02. Tidak ada informasi dari ATC terkait kegiatan helikopter militer tersebut dan juga tidak ada instruksi ATC kepada pesawat jetstar untuk berhenti sebelum taxiway SP2', korbanJiwa: 'Tidak ada' },
    { tanggal: '2025-06-10', kategori: 'Serious Incident (SI)', aoc: 'AOC 119_135', registrasiPesawat: 'PK-SNV', tipePesawat: 'Cessna C208B - Grand Caravan', lokasi: 'Douw Aturure Airport Nabire', taxonomy: 'Runway Excursion (RE)', keteranganKejadian: 'Setelah mendarat di Bandara Douw Aturure, Nabire, pesawat berbelok kekiri dan tidak dapat dikontrol. Karena ban utama kiri kempes akibat tertancap screw. Tidak ada kerusakan lain pada pesawat.', korbanJiwa: 'Tidak ada' },
    { tanggal: '2025-06-23', kategori: 'Serious Incident (SI)', aoc: 'AOC 119_121', registrasiPesawat: 'PK-WJZ', tipePesawat: 'ATR 72-600', lokasi: 'Sultan Aji Muhammad Sulaiman Sepinggan, Balikpapan', taxonomy: 'Fuel Related (FUEL)', keteranganKejadian: 'Saat Final Approach pesawat mengalami engine no.2 flame-out, pilot mendaratkan pesawat dengan selamat.', korbanJiwa: 'Tidak ada' },
    { tanggal: '2025-06-28', kategori: 'Serious Incident (SI)', aoc: 'AOC 119_121', registrasiPesawat: 'PK-PWJ', tipePesawat: 'Airbus A320', lokasi: 'Sultan Syarif Kasim II Airport, Pekanbaru', taxonomy: 'Abnormal Runway Contact (ARC)', keteranganKejadian: 'Pesawat mengalami suspected hard landing saat final approach di RW18 dengan Vertical G tercatat 2,55 G. PF sempat meminta go-around, namun PM memutuskan melanjutkan pendaratan.', korbanJiwa: 'Tidak ada' },
    { tanggal: '2025-07-06', kategori: 'Accident (A)', aoc: 'AOC 119_121', registrasiPesawat: 'PK-GFR', tipePesawat: 'Boeing 737-800', lokasi: 'Enroute WAMM - WIII', taxonomy: 'Turbulence Encounter (TURB)', keteranganKejadian: 'Saat en route penerbangan Manado ke Jakarta, pesawat mengalami moderate turbulensi, mengakibatkan satu pramugari terluka karena terkena air panas.', korbanJiwa: 'Tidak ada' },
    { tanggal: '2025-07-10', kategori: 'Serious Incident (SI)', aoc: 'AOC 119_135', registrasiPesawat: 'PK-DLA', tipePesawat: 'Cessna C208B - Grand Caravan', lokasi: 'Mulia Airport, Papua', taxonomy: 'Runway Excursion (RE)', keteranganKejadian: 'Pada saat pesawat touchdown, ban kanan utama mengalami flat tire. PIC berhasil mengarahkan pesawat ke sisi kanan runway dan mendarat dengan aman.', korbanJiwa: 'Tidak ada' },
    { tanggal: '2025-08-25', kategori: 'Accident (A)', aoc: 'AOC 119_135', registrasiPesawat: 'PK-PPI', tipePesawat: 'Cessna Grand Caravan 208B', lokasi: 'Bandara Udara Ilaga, Papua', taxonomy: 'Runway Excursion (RE)', keteranganKejadian: 'Setelah mendarat pesawat tidak dapat dapat berhenti dan menghantam pos penjagaan di ujung landasan. Bagian depan engine terbakar yang diikuti dengan terbakarnya badan pesawat.', korbanJiwa: 'Tidak ada' },
    { tanggal: '2025-08-25', kategori: 'Serious Incident (SI)', aoc: 'AOC 119_135', registrasiPesawat: 'PK-SNU', tipePesawat: 'PAC750 XL', lokasi: 'Bandara Moses Kilangi Timika', taxonomy: 'SCF-NP (System/Component Failure - Non-Powerplant)', keteranganKejadian: 'Pesawat mengalami permasalahan mesin dan gagal mencapai Runway 12, sehingga melakukan pendaratan darurat di area final approach sebelum runway.', korbanJiwa: 'Tidak ada' },
    { tanggal: '2025-09-01', kategori: 'Accident (A)', aoc: 'AOC 119_135', registrasiPesawat: 'PK-RGH', tipePesawat: 'BK117-D3', lokasi: 'Mentewe, Kalimantan Selatan', taxonomy: null, keteranganKejadian: 'Helikopter hilang kontak setelah lepas landas dari Bandara Gusti Sjamsir Alam, Kotabaru menuju Palangka Raya pada 3 September 2025. Helikopter kemudian ditemukan jatuh di Hutan Mandin Damar, Tanah Bumbu.', korbanJiwa: 'Ada (2 pilot serta 6 penumpang meninggal)' },
    { tanggal: '2025-09-10', kategori: 'Accident (A)', aoc: 'AOC 119_135', registrasiPesawat: 'PK-IWS', tipePesawat: 'AS 350 B3', lokasi: 'Timika', taxonomy: 'Turbulence Encounter (TURB)', keteranganKejadian: 'Helikopter hilang kontak dalam penerbangan dari Ilaga menuju Timika, Papua. Lokasi jatuhnya ditemukan di Distrik Jila, Kabupaten Mimika.', korbanJiwa: 'Ada (4 orang)' },
];

const knktReports = [
  { tanggal_diterbitkan: '2022-01-07', nomor_laporan: 'KNKT.18.04.10.04', status: 'Final', aoc: 'AOC 135', registrasi: 'PK-WSX', tipe_pesawat: 'Bell 429', lokasi: 'Morowali, Sulawesi Tengah' },
  { tanggal_diterbitkan: '2022-01-13', nomor_laporan: 'KNKT.21.01.01.04', status: '1st Interim Statement', aoc: 'AOC 135', registrasi: 'PK-CLC', tipe_pesawat: 'Boeing 737-500', lokasi: 'Kepulauan Seribu District, DKI Jakarta' },
  { tanggal_diterbitkan: '2022-03-02', nomor_laporan: 'KNKT.21.12.20.04', status: 'Preliminary', aoc: 'AOC 135', registrasi: 'PK-ODB', tipe_pesawat: 'Eurocopter AS 350 B3', lokasi: 'Near Camp 99, Yahukimo' },
  { tanggal_diterbitkan: '2022-03-04', nomor_laporan: 'KNKT.21.12.19.04', status: 'Preliminary', aoc: 'AOC 121', registrasi: 'PK-JRW', tipe_pesawat: 'Boeing 737-200', lokasi: 'Sentani Airport' },
  { tanggal_diterbitkan: '2022-03-21', nomor_laporan: 'KNKT.21.12.18.04', status: 'Preliminary', aoc: 'AOC 121', registrasi: 'PK-LQR', tipe_pesawat: 'Boeing 737-900ER', lokasi: 'Enroute Padang to Batam' },
  { tanggal_diterbitkan: '2022-03-22', nomor_laporan: 'KNKT.18.01.02.04', status: 'Final', aoc: 'AOC 121', registrasi: 'PK-GLH & PK-GTA', tipe_pesawat: 'Airbus A320-200', lokasi: 'Near Waypoint EMARA, Surabaya Airspace' },
  { tanggal_diterbitkan: '2022-03-28', nomor_laporan: 'KNKT.21.03.03.04', status: '1st Interim Statement', aoc: 'AOC 121', registrasi: 'PK-LUT', tipe_pesawat: 'Airbus A320', lokasi: 'Bandara DJB' },
  { tanggal_diterbitkan: '2022-03-28', nomor_laporan: 'KNKT.22.02.01.04', status: 'Preliminary', aoc: 'AOC 135', registrasi: 'PK-SNB', tipe_pesawat: 'Pilatus PC-6 Porter', lokasi: 'Bayabiru Airstrip, Paniai' },
  { tanggal_diterbitkan: '2022-06-15', nomor_laporan: 'KNKT.21.01.01.04', status: 'Draft Final', aoc: 'AOC 121', registrasi: 'PK-CLC', tipe_pesawat: 'Boeing 737-500', lokasi: 'Kepulauan Seribu District, DKI Jakarta' },
  { tanggal_diterbitkan: '2022-07-27', nomor_laporan: 'KNKT.22.06.06.04', status: 'Preliminary', aoc: 'AOC 135', registrasi: 'PK-DAR', tipe_pesawat: 'Bell 412', lokasi: 'About 24 Nm East of Mozes Kilangin Airport' },
  { tanggal_diterbitkan: '2022-08-03', nomor_laporan: 'KNKT.22.05.03.04', status: 'Preliminary', aoc: 'AOC 135', registrasi: 'PK-BVE', tipe_pesawat: 'Cessna 208B', lokasi: 'Yuvai Semaring Airport, Long Bawan' },
  { tanggal_diterbitkan: '2022-08-03', nomor_laporan: 'KNKT.22.05.04.04', status: 'Preliminary', aoc: 'AOC 121', registrasi: 'PK-WGF', tipe_pesawat: 'ATR 72-212A', lokasi: 'Bandara I Gusti Ngurah Rai' },
  { tanggal_diterbitkan: '2022-08-03', nomor_laporan: 'KNKT.16.05.14.04', status: 'Draft Final', aoc: 'AOC 129', registrasi: 'B-LNE', tipe_pesawat: 'Airbus 330-223', lokasi: 'Near Banjarmasin' },
  { tanggal_diterbitkan: '2022-08-15', nomor_laporan: 'KNKT.16.10.35.04', status: 'Final', aoc: 'PSC 141', registrasi: 'PK-PBH', tipe_pesawat: 'Piper PA28-161 Warrior I', lokasi: 'Jeruk Legi Village, Cilacap' },
  { tanggal_diterbitkan: '2022-08-15', nomor_laporan: 'KNKT.13.09.25.04', status: 'Draft Final', aoc: 'AOC 135', registrasi: 'PK-WFV', tipe_pesawat: 'ATR 72-212A', lokasi: 'Sultan Hasannudin International Airport' },
  { tanggal_diterbitkan: '2022-08-22', nomor_laporan: 'KNKT.17.11.35.04', status: 'Draft Final', aoc: 'AOC 121', registrasi: 'PK-GPM', tipe_pesawat: 'Airbus A330-200', lokasi: 'South China Sea' },
  { tanggal_diterbitkan: '2022-08-24', nomor_laporan: 'KNKT.22.07.10.04', status: 'Preliminary', aoc: 'AOC 121', registrasi: 'PK-GLW', tipe_pesawat: 'Airbus A320-200', lokasi: 'Near Bandara Juanda, Surabaya' },
  { tanggal_diterbitkan: '2022-08-26', nomor_laporan: 'KNKT.22.06.07.04', status: 'Preliminary', aoc: 'AOC 135', registrasi: 'PK-BVM', tipe_pesawat: 'Pilatus PC-6/B2-H4', lokasi: 'Duma Airstrip' },
  { tanggal_diterbitkan: '2022-08-31', nomor_laporan: 'TIB/AAI/CAS.203', status: 'Final', aoc: 'AOC 135', registrasi: 'PK-RJH', tipe_pesawat: 'Eurocopter EC135P2', lokasi: 'Seletar Airport' },
  { tanggal_diterbitkan: '2022-09-19', nomor_laporan: 'KNKT.18.07.28.04', status: 'Draft Final', aoc: 'PSC 141', registrasi: 'PK-BYK', tipe_pesawat: 'Cessna 172 S', lokasi: 'Bandara Blimbingsari, Banyuwangi' },
  { tanggal_diterbitkan: '2022-09-19', nomor_laporan: 'KNKT.22.07.10.04', status: 'Preliminary', aoc: 'AOC 135', registrasi: 'PK-WSU', tipe_pesawat: 'Bell 505', lokasi: 'Ungasan Heliport' },
  { tanggal_diterbitkan: '2022-09-21', nomor_laporan: 'KNKT.22.08.12.04', status: 'Preliminary', aoc: 'AOC 135', registrasi: 'PK-YGV', tipe_pesawat: 'Boeing 737-300F', lokasi: 'Bandara Syamsudin Noor, Banjarmasin' },
  { tanggal_diterbitkan: '2022-10-18', nomor_laporan: 'KNKT.15.01.03.04', status: 'Draft Final', aoc: 'PSC 141', registrasi: 'PK-AEH', tipe_pesawat: 'Piper Warior III', lokasi: 'Bandara Budiarto, Curug, Tangerang' },
  { tanggal_diterbitkan: '2022-11-08', nomor_laporan: 'KNKT.17.11.35.04', status: 'Final', aoc: 'AOC 121', registrasi: 'PK-GPM', tipe_pesawat: 'Airbus A330-200', lokasi: 'South China Sea' },
  { tanggal_diterbitkan: '2022-11-08', nomor_laporan: 'KNKT.22.09.14.04', status: 'Preliminary', aoc: 'AOC 121', registrasi: 'PK-PAH', tipe_pesawat: 'ATR 72-212A', lokasi: 'Bandara Internasional Sultan Aji Muhammad Sulaiman Sepinggan, Balikpapan' },
  { tanggal_diterbitkan: '2022-11-08', nomor_laporan: 'KNKT.22.08.13.04', status: 'Preliminary', aoc: 'AOC 135', registrasi: 'PK-SNW', tipe_pesawat: 'Cessna 208B', lokasi: 'Bandara Sinak' },
  { tanggal_diterbitkan: '2022-11-10', nomor_laporan: 'KNKT.21.01.01.04', status: 'Final', aoc: 'AOC 121', registrasi: 'PK-CLC', tipe_pesawat: 'Boeing 737-500', lokasi: 'Kepulauan Seribu District, DKI Jakarta' },
  { tanggal_diterbitkan: '2022-12-27', nomor_laporan: 'KNKT.22.12.18.04', status: 'Preliminary', aoc: 'AOC 135', registrasi: 'PK-CDO', tipe_pesawat: 'Bell 206 B3', lokasi: 'Area Mining 1, Kawe' },
  { tanggal_diterbitkan: '2022-12-27', nomor_laporan: 'KNKT 22.10.15.04', status: 'Preliminary', aoc: 'AOC 135', registrasi: 'PK-RVA', tipe_pesawat: 'Cessna Grand Caravan C208B', lokasi: 'Bandara Ilaga' },
];


async function seedDatabase() {
    try {
        console.log('Initializing Firebase...');
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        console.log('Firebase initialized.');

        console.log('Starting to seed accident/incident records...');
        const accidentIncidentCollection = collection(db, 'accidentIncidentRecords');
        const accidentPromises = accidentIncidentRecords.map((record, index) => {
            const { wilayah, ...restOfRecord } = record;
            const recordId = `record-${String(index + 1).padStart(3, '0')}`;
            const recordRef = doc(accidentIncidentCollection, recordId);
            console.log(`Preparing to set accident/incident record with ID: ${recordId}`);
            
            // Standardize date format to ISO string for Firestore
            const dataToSet = {
                ...restOfRecord,
                tanggal: new Date(record.tanggal).toISOString(),
                createdAt: new Date().toISOString()
            };

            return setDoc(recordRef, dataToSet, { merge: true });
        });
        
        await Promise.all(accidentPromises);
        console.log(`${accidentIncidentRecords.length} accident/incident records have been added or updated.`);
        
        console.log('Starting to seed KNKT reports...');
        const knktReportsCollection = collection(db, 'knktReports');
        const knktReportPromises = knktReports.map((report, index) => {
            const { wilayah, ...restOfRecord } = report;
            const reportId = `knkt-${String(index + 1).padStart(3, '0')}`;
            const reportRef = doc(knktReportsCollection, reportId);
            console.log(`Preparing to set KNKT report with ID: ${reportId}`);
             const dataToSet = {
                ...restOfRecord,
                tanggal_diterbitkan: new Date(report.tanggal_diterbitkan).toISOString(),
                createdAt: new Date().toISOString()
            };
            return setDoc(reportRef, dataToSet, { merge: true });
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
