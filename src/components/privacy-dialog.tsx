
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from './ui/button';

export function PrivacyDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground p-0 h-auto">Syarat &amp; Ketentuan, Kebijakan Privasi &amp; Cookie</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Syarat &amp; Ketentuan, Kebijakan Privasi &amp; Cookie</DialogTitle>
          <DialogDescription>
            Terakhir diperbarui: 24 Oktober 2025
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-6">
            <div className="space-y-4 text-justify text-foreground/80 text-sm">
                <h2 className="font-bold text-lg pt-4 text-foreground">Syarat dan Ketentuan Penggunaan</h2>
                <p>Syarat dan Ketentuan Penggunaan ("Ketentuan") ini merupakan aturan yang mengikat secara hukum antara Penyelenggara Sistem Elektronik, yaitu Direktorat Kelaikudaraan dan Pengoperasian Pesawat Udara ("Penyelenggara"), dengan Anda selaku pegawai di lingkungan Subdirektorat Standardisasi DKPPU ("Pengguna") dalam penggunaan Aplikasi AirTrack ("Layanan").</p>
                <p>Dengan melakukan registrasi dan/atau menggunakan Layanan ini, Anda menyatakan telah membaca, memahami, menyetujui, dan akan mematuhi seluruh Ketentuan yang tertulis di bawah ini.</p>

                <h3 className="font-bold pt-4 text-foreground">Pasal 1: Definisi</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Layanan</strong> adalah aplikasi berbasis web AirTrack yang berfungsi sebagai platform manajemen pekerjaan dan kepatuhan regulasi internal di lingkungan Subdirektorat Standardisasi DKPPU.</li>
                    <li><strong>Penyelenggara</strong> adalah Direktorat Kelaikudaraan dan Pengoperasian Pesawat Udara (DKPPU) yang bertanggung jawab atas pengelolaan dan operasional Layanan.</li>
                    <li><strong>Pengguna</strong> adalah Aparatur Sipil Negara (ASN) atau pegawai yang secara sah memiliki hak akses untuk menggunakan Layanan dalam rangka pelaksanaan tugas kedinasan.</li>
                    <li><strong>Akun Google</strong> adalah layanan autentikasi pihak ketiga yang digunakan untuk proses registrasi dan login ke dalam Layanan.</li>
                    <li><strong>Data Pribadi</strong> adalah data tentang orang perseorangan yang teridentifikasi atau dapat diidentifikasi secara tersendiri atau dikombinasi dengan informasi lainnya, sesuai dengan Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.</li>
                    <li><strong>Data Elektronik Kedinasan</strong> adalah data dan informasi terkait pekerjaan, proyek, dokumen, dan komunikasi yang dibuat atau diunggah oleh Pengguna ke dalam Layanan untuk tujuan pelaksanaan tugas dan fungsi.</li>
                </ul>

                <h3 className="font-bold pt-4 text-foreground">Pasal 2: Akun dan Keamanan</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Untuk dapat menggunakan Layanan, Pengguna diwajibkan melakukan registrasi dan login menggunakan Akun Google yang aktif.</li>
                    <li>Pengguna bertanggung jawab penuh atas segala aktivitas yang dilakukan menggunakan akunnya.</li>
                    <li>Pengguna wajib menjaga kerahasiaan informasi login (kata sandi Akun Google) dan tidak membagikannya kepada pihak lain yang tidak berwenang.</li>
                    <li>Pengguna wajib segera melapor kepada administrator sistem jika mengetahui atau menduga adanya akses ilegal atau penyalahgunaan akun.</li>
                    <li>Penyalahgunaan akun untuk tujuan yang melanggar hukum atau Ketentuan ini dapat dikenakan sanksi sesuai peraturan disiplin pegawai dan perundang-undangan yang berlaku.</li>
                    <li>Hak akses Pengguna terhadap Layanan bersifat melekat pada jabatan dan status kepegawaian yang sah. Hak akses akan dicabut atau dihentikan oleh administrator sistem apabila Pengguna tidak lagi bertugas di Subdirektorat Standardisasi DKPPU karena mutasi, pensiun, berhenti, atau sebab lain yang mengakibatkan berakhirnya hubungan kerja.</li>
                </ul>

                <h3 className="font-bold pt-4 text-foreground">Pasal 3: Pengelolaan dan Pelindungan Data</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Dasar Pemrosesan Data:</strong> Pemrosesan data Pengguna dilakukan dalam rangka pelaksanaan kewajiban pelayanan publik dan tugas kedinasan sesuai amanat peraturan perundang-undangan.</li>
                    <li><strong>Data Pribadi:</strong> Dengan menggunakan otentikasi Akun Google, Pengguna memberikan persetujuan kepada Penyelenggara untuk mengakses data dasar yang melekat pada akun tersebut (nama, alamat email, foto profil) untuk keperluan identifikasi, manajemen akses, dan personalisasi Layanan.</li>
                    <li><strong>Data Elektronik Kedinasan:</strong> Seluruh data kedinasan yang diunggah dan diolah dalam Layanan bersifat internal dan hanya dapat diakses oleh Pengguna yang memiliki otorisasi. Penyelenggara menjamin kerahasiaan data tersebut dari pihak eksternal yang tidak berwenang.</li>
                    <li><strong>Kepatuhan:</strong> Penyelenggara berkomitmen untuk mengelola seluruh data sesuai dengan prinsip-prinsip dalam Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi dan peraturan terkait Penyelenggaraan Sistem dan Transaksi Elektronik (PSTE) di lingkungan instansi pemerintah.</li>
                    <li><strong>Kepemilikan Data:</strong> Seluruh Data Elektronik Kedinasan yang diunggah, dibuat, atau dikelola di dalam Layanan merupakan aset informasi milik Direktorat Kelaikudaraan dan Pengoperasian Pesawat Udara dan tunduk pada peraturan perundang-undangan mengenai Keterbukaan Informasi Publik serta klasifikasi keamanan informasi yang berlaku.</li>
                    <li>Data Pengguna tidak akan dibagikan, disewakan, atau dijual kepada pihak ketiga untuk tujuan komersial maupun non-komersial tanpa dasar hukum yang sah.</li>
                </ul>
                
                <h3 className="font-bold pt-4 text-foreground">Pasal 4: Kewajiban Pengguna</h3>
                 <ul className="list-disc pl-5 space-y-2">
                    <li>Menggunakan Layanan dengan itikad baik dan hanya untuk tujuan pelaksanaan tugas dan fungsi kedinasan.</li>
                    <li>Dilarang keras menggunakan sumber daya Layanan, termasuk kapasitas penyimpanan dan fitur komunikasi, untuk tujuan di luar kedinasan atau untuk kepentingan pribadi.</li>
                    <li>Dilarang menggunakan Layanan untuk menyebarkan informasi yang mengandung SARA, ujaran kebencian, hoaks, atau melanggar peraturan perundang-undangan lainnya.</li>
                    <li>Dilarang mengunggah, menyimpan, atau mengirimkan dokumen atau informasi dengan klasifikasi RAHASIA atau SANGAT RAHASIA ke dalam Layanan, kecuali jika Layanan telah disertifikasi secara resmi untuk tingkat keamanan tersebut.</li>
                    <li>Dilarang melakukan upaya peretasan, rekayasa balik (reverse engineering), atau tindakan lain yang dapat mengganggu integritas dan ketersediaan sistem Layanan.</li>
                </ul>

                <h3 className="font-bold pt-4 text-foreground">Pasal 5: Pencatatan Aktivitas (Audit Log)</h3>
                <p>Untuk tujuan keamanan, pemeliharaan sistem, dan penegakan kepatuhan, Penyelenggara mencatat (log) seluruh aktivitas yang dilakukan oleh Pengguna di dalam Layanan. Catatan aktivitas ini dapat diperiksa jika terdapat dugaan pelanggaran keamanan atau penyalahgunaan sistem sesuai dengan prosedur yang berlaku.</p>

                <h3 className="font-bold pt-4 text-foreground">Pasal 6: Hak Kekayaan Intelektual</h3>
                <p>Layanan, termasuk namun tidak terbatas pada nama, logo, kode sumber, dan desain, merupakan aset milik Negara Republik Indonesia yang dikelola oleh Direktorat Kelaikudaraan dan Pengoperasian Pesawat Udara dan dilindungi oleh undang-undang hak cipta yang berlaku.</p>

                <h3 className="font-bold pt-4 text-foreground">Pasal 7: Batasan Tanggung Jawab</h3>
                 <ul className="list-disc pl-5 space-y-2">
                    <li>Penyelenggara berupaya menjaga Layanan agar dapat beroperasi dengan baik dan aman. Namun, Penyelenggara tidak bertanggung jawab atas kerugian yang timbul akibat kelalaian Pengguna atau faktor eksternal di luar kendali Penyelenggara (force majeure).</li>
                    <li>Penyelenggara tidak bertanggung jawab atas keakuratan dan validitas konten atau data yang diunggah oleh Pengguna.</li>
                </ul>

                <h3 className="font-bold pt-4 text-foreground">Pasal 8: Perubahan Ketentuan</h3>
                <p>Penyelenggara berhak untuk mengubah Ketentuan ini dari waktu ke waktu. Setiap perubahan akan diinformasikan kepada Pengguna melalui saluran komunikasi resmi. Dengan terus menggunakan Layanan setelah perubahan diumumkan, Pengguna dianggap menyetujui Ketentuan yang baru.</p>

                <h3 className="font-bold pt-4 text-foreground">Pasal 9: Hukum yang Berlaku</h3>
                <p>Syarat dan Ketentuan ini diatur dan ditafsirkan sesuai dengan hukum yang berlaku di Negara Kesatuan Republik Indonesia.</p>

                <h3 className="font-bold pt-4 text-foreground">Pasal 10: Kontak dan Laporan</h3>
                <p>Jika Pengguna memiliki pertanyaan mengenai Ketentuan ini atau ingin melaporkan dugaan pelanggaran, silakan hubungi administrator sistem melalui email: riskregisterdkppu@gmail.com.</p>
                
                <h2 className="font-bold text-lg pt-6 text-foreground">Kebijakan Privasi</h2>
                <p>Aplikasi AirTrack ("Layanan") ini adalah sistem internal yang dikelola oleh Direktorat Kelaikudaraan dan Pengoperasian Pesawat Udara ("DKPPU"). Kami berkomitmen untuk melindungi privasi dan keamanan data Anda.</p>

                <h3 className="font-bold pt-4 text-foreground">1. Data yang Kami Kumpulkan</h3>
                <p>Saat Anda melakukan registrasi dan login menggunakan Akun Google, kami hanya mengakses dan menyimpan informasi dasar yang diperlukan untuk fungsionalitas akun, yaitu:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Nama Lengkap:</strong> Digunakan untuk identifikasi Anda di dalam sistem.</li>
                  <li><strong>Alamat Email:</strong> Digunakan sebagai nama pengguna unik dan untuk komunikasi terkait akun.</li>
                  <li><strong>Foto Profil:</strong> Digunakan untuk personalisasi antarmuka pengguna.</li>
                </ul>
                <p>Kami <strong>tidak</strong> mengumpulkan atau menyimpan kata sandi Akun Google Anda.</p>

                <h3 className="font-bold pt-4 text-foreground">2. Penggunaan Data</h3>
                <p>Data yang kami kumpulkan digunakan secara eksklusif untuk tujuan berikut:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Manajemen otentikasi dan otorisasi akses ke dalam Layanan.</li>
                  <li>Identifikasi kontribusi dan aktivitas Anda dalam konteks pekerjaan (misalnya, siapa yang membuat atau memperbarui tugas).</li>
                  <li>Personalisasi pengalaman pengguna di dalam aplikasi.</li>
                </ul>

                <h3 className="font-bold pt-4 text-foreground">3. Keamanan dan Penyimpanan Data</h3>
                <p>Seluruh data pengguna dan data pekerjaan disimpan dalam infrastruktur Google Firebase yang aman. Data ini bersifat internal dan rahasia, serta tidak akan dibagikan, dijual, atau diungkapkan kepada pihak ketiga mana pun di luar DKPPU tanpa dasar hukum yang sah.</p>
                
                <h2 className="font-bold text-lg pt-6 text-foreground">Kebijakan Cookie</h2>
                
                <h3 className="font-bold pt-4 text-foreground">1. Apa itu Cookie?</h3>
                <p>Cookie adalah file teks kecil yang disimpan di perangkat Anda (komputer atau ponsel) saat Anda mengunjungi sebuah situs web. Cookie membantu situs web mengenali perangkat Anda dan mengingat informasi tertentu tentang preferensi atau aktivitas Anda.</p>

                <h3 className="font-bold pt-4 text-foreground">2. Bagaimana Kami Menggunakan Cookie</h3>
                <p>Layanan kami menggunakan cookie untuk tujuan fungsional yang esensial, seperti:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Manajemen Sesi:</strong> Untuk menjaga Anda tetap login selama menggunakan aplikasi.</li>
                    <li><strong>Preferensi Pengguna:</strong> Untuk mengingat preferensi tampilan Anda, seperti tema terang (light) atau gelap (dark).</li>
                </ul>
                <p>Kami <strong>tidak</strong> menggunakan cookie untuk tujuan pelacakan (tracking), analisis perilaku di luar aplikasi kami, atau untuk tujuan periklanan.</p>

                <h3 className="font-bold pt-4 text-foreground">3. Mengelola Cookie</h3>
                <p>Anda dapat mengatur atau menghapus cookie melalui pengaturan peramban (browser) Anda. Namun, perlu diketahui bahwa menonaktifkan cookie dapat menyebabkan beberapa fitur Layanan tidak berfungsi secara optimal.</p>

            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
