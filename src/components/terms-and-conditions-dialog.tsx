
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { cn } from '@/lib/utils';

interface TermsAndConditionsDialogProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}

export function TermsAndConditionsDialog({ checked, onCheckedChange }: TermsAndConditionsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isButtonActive, setIsButtonActive] = React.useState(false);

  const handleAccept = () => {
    onCheckedChange(true);
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
      setOpen(isOpen);
      if (isOpen) {
          // Reset button state when dialog opens
          setIsButtonActive(false);
          // Set a timer to enable the button after a delay
          const timer = setTimeout(() => {
              setIsButtonActive(true);
          }, 2000); // 2-second delay
          
          return () => clearTimeout(timer);
      }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
        <div className="items-top flex space-x-3 pt-2">
            <Checkbox
                id="terms"
                checked={checked}
                onClick={(e) => {
                    if(!checked) {
                        e.preventDefault();
                        handleOpenChange(true);
                    } else {
                        onCheckedChange(false);
                    }
                }}
                aria-label="Agree to terms and conditions"
            />
             <div className="grid gap-1.5 leading-none">
                <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    I agree to the{' '}
                     <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-sm"
                        onClick={(e) => {
                           e.preventDefault();
                           handleOpenChange(true);
                        }}
                    >
                        Terms & Conditions
                    </Button>
                </label>
            </div>
        </div>

      <DialogContent className={cn(
          "sm:max-w-3xl max-h-[80vh] bg-background/80 backdrop-blur-sm",
        )}>
        <DialogHeader>
          <DialogTitle>Syarat dan Ketentuan Penggunaan</DialogTitle>
          <DialogDescription>
            Aplikasi Internal AirTrack DKPPU
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-6">
            <div className="space-y-4 text-foreground/80">
                <p>Syarat dan Ketentuan Penggunaan ("Ketentuan") ini merupakan aturan yang mengikat secara hukum antara Penyelenggara Sistem Elektronik, yaitu Direktorat Kelaikudaraan dan Pengoperasian Pesawat Udara ("Penyelenggara"), dengan Anda selaku pegawai di lingkungan Subdirektorat Standardisasi DKPPU ("Pengguna") dalam penggunaan Aplikasi AirTrack ("Layanan").</p>
                <p>Dengan melakukan registrasi dan/atau menggunakan Layanan ini, Anda menyatakan telah membaca, memahami, menyetujui, dan akan mematuhi seluruh Ketentuan yang tertulis di bawah ini.</p>

                <h3 className="font-bold pt-4">Pasal 1: Definisi</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Layanan</strong> adalah aplikasi berbasis web AirTrack yang berfungsi sebagai platform manajemen pekerjaan dan kepatuhan regulasi internal di lingkungan Subdirektorat Standardisasi DKPPU.</li>
                    <li><strong>Penyelenggara</strong> adalah Direktorat Kelaikudaraan dan Pengoperasian Pesawat Udara (DKPPU) yang bertanggung jawab atas pengelolaan dan operasional Layanan.</li>
                    <li><strong>Pengguna</strong> adalah Aparatur Sipil Negara (ASN) atau pegawai yang secara sah memiliki hak akses untuk menggunakan Layanan dalam rangka pelaksanaan tugas kedinasan.</li>
                    <li><strong>Akun Google</strong> adalah layanan autentikasi pihak ketiga yang digunakan untuk proses registrasi dan login ke dalam Layanan.</li>
                    <li><strong>Data Pribadi</strong> adalah data tentang orang perseorangan yang teridentifikasi atau dapat diidentifikasi secara tersendiri atau dikombinasi dengan informasi lainnya, sesuai dengan Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.</li>
                    <li><strong>Data Elektronik Kedinasan</strong> adalah data dan informasi terkait pekerjaan, proyek, dokumen, dan komunikasi yang dibuat atau diunggah oleh Pengguna ke dalam Layanan untuk tujuan pelaksanaan tugas dan fungsi.</li>
                </ul>

                <h3 className="font-bold pt-4">Pasal 2: Akun dan Keamanan</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Untuk dapat menggunakan Layanan, Pengguna diwajibkan melakukan registrasi dan login menggunakan Akun Google yang aktif.</li>
                    <li>Pengguna bertanggung jawab penuh atas segala aktivitas yang dilakukan menggunakan akunnya.</li>
                    <li>Pengguna wajib menjaga kerahasiaan informasi login (kata sandi Akun Google) dan tidak membagikannya kepada pihak lain yang tidak berwenang.</li>
                    <li>Pengguna wajib segera melapor kepada administrator sistem jika mengetahui atau menduga adanya akses ilegal atau penyalahgunaan akun.</li>
                    <li>Penyalahgunaan akun untuk tujuan yang melanggar hukum atau Ketentuan ini dapat dikenakan sanksi sesuai peraturan disiplin pegawai dan perundang-undangan yang berlaku.</li>
                    <li>Hak akses Pengguna terhadap Layanan bersifat melekat pada jabatan dan status kepegawaian yang sah. Hak akses akan dicabut atau dihentikan oleh administrator sistem apabila Pengguna tidak lagi bertugas di Subdirektorat Standardisasi DKPPU karena mutasi, pensiun, berhenti, atau sebab lain yang mengakibatkan berakhirnya hubungan kerja.</li>
                </ul>

                <h3 className="font-bold pt-4">Pasal 3: Pengelolaan dan Pelindungan Data</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Dasar Pemrosesan Data:</strong> Pemrosesan data Pengguna dilakukan dalam rangka pelaksanaan kewajiban pelayanan publik dan tugas kedinasan sesuai amanat peraturan perundang-undangan.</li>
                    <li><strong>Data Pribadi:</strong> Dengan menggunakan otentikasi Akun Google, Pengguna memberikan persetujuan kepada Penyelenggara untuk mengakses data dasar yang melekat pada akun tersebut (nama, alamat email, foto profil) untuk keperluan identifikasi, manajemen akses, dan personalisasi Layanan.</li>
                    <li><strong>Data Elektronik Kedinasan:</strong> Seluruh data kedinasan yang diunggah dan diolah dalam Layanan bersifat internal dan hanya dapat diakses oleh Pengguna yang memiliki otorisasi. Penyelenggara menjamin kerahasiaan data tersebut dari pihak eksternal yang tidak berwenang.</li>
                    <li><strong>Kepatuhan:</strong> Penyelenggara berkomitmen untuk mengelola seluruh data sesuai dengan prinsip-prinsip dalam Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi dan peraturan terkait Penyelenggaraan Sistem dan Transaksi Elektronik (PSTE) di lingkungan instansi pemerintah.</li>
                    <li><strong>Kepemilikan Data:</strong> Seluruh Data Elektronik Kedinasan yang diunggah, dibuat, atau dikelola di dalam Layanan merupakan aset informasi milik Direktorat Kelaikudaraan dan Pengoperasian Pesawat Udara dan tunduk pada peraturan perundang-undangan mengenai Keterbukaan Informasi Publik serta klasifikasi keamanan informasi yang berlaku.</li>
                    <li>Data Pengguna tidak akan dibagikan, disewakan, atau dijual kepada pihak ketiga untuk tujuan komersial maupun non-komersial tanpa dasar hukum yang sah.</li>
                </ul>
                
                <h3 className="font-bold pt-4">Pasal 4: Penggunaan Cookies</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Layanan ini menggunakan cookies untuk fungsionalitas teknis, seperti mempertahankan sesi login dan mengingat preferensi tampilan.</li>
                    <li>Cookies yang digunakan tidak melacak aktivitas Pengguna di luar Layanan ini.</li>
                    <li>Pengguna dapat mengatur peramban (browser) untuk menolak cookies, namun tindakan tersebut dapat menyebabkan beberapa fungsi Layanan tidak berjalan secara optimal.</li>
                </ul>

                <h3 className="font-bold pt-4">Pasal 5: Kewajiban Pengguna</h3>
                 <ul className="list-disc pl-5 space-y-2">
                    <li>Menggunakan Layanan dengan itikad baik dan hanya untuk tujuan pelaksanaan tugas dan fungsi kedinasan.</li>
                    <li>Dilarang keras menggunakan sumber daya Layanan, termasuk kapasitas penyimpanan dan fitur komunikasi, untuk tujuan di luar kedinasan atau untuk kepentingan pribadi.</li>
                    <li>Dilarang menggunakan Layanan untuk menyebarkan informasi yang mengandung SARA, ujaran kebencian, hoaks, atau melanggar peraturan perundang-undangan lainnya.</li>
                    <li>Dilarang mengunggah, menyimpan, atau mengirimkan dokumen atau informasi dengan klasifikasi RAHASIA atau SANGAT RAHASIA ke dalam Layanan, kecuali jika Layanan telah disertifikasi secara resmi untuk tingkat keamanan tersebut.</li>
                    <li>Dilarang melakukan upaya peretasan, rekayasa balik (reverse engineering), atau tindakan lain yang dapat mengganggu integritas dan ketersediaan sistem Layanan.</li>
                </ul>

                <h3 className="font-bold pt-4">Pasal 6: Pencatatan Aktivitas (Audit Log)</h3>
                <p>Untuk tujuan keamanan, pemeliharaan sistem, dan penegakan kepatuhan, Penyelenggara mencatat (log) seluruh aktivitas yang dilakukan oleh Pengguna di dalam Layanan. Catatan aktivitas ini dapat diperiksa jika terdapat dugaan pelanggaran keamanan atau penyalahgunaan sistem sesuai dengan prosedur yang berlaku.</p>

                <h3 className="font-bold pt-4">Pasal 7: Hak Kekayaan Intelektual</h3>
                <p>Layanan, termasuk namun tidak terbatas pada nama, logo, kode sumber, dan desain, merupakan aset milik Negara Republik Indonesia yang dikelola oleh Direktorat Kelaikudaraan dan Pengoperasian Pesawat Udara dan dilindungi oleh undang-undang hak cipta yang berlaku.</p>

                <h3 className="font-bold pt-4">Pasal 8: Batasan Tanggung Jawab</h3>
                 <ul className="list-disc pl-5 space-y-2">
                    <li>Penyelenggara berupaya menjaga Layanan agar dapat beroperasi dengan baik dan aman. Namun, Penyelenggara tidak bertanggung jawab atas kerugian yang timbul akibat kelalaian Pengguna atau faktor eksternal di luar kendali Penyelenggara (force majeure).</li>
                    <li>Penyelenggara tidak bertanggung jawab atas keakuratan dan validitas konten atau data yang diunggah oleh Pengguna.</li>
                </ul>

                <h3 className="font-bold pt-4">Pasal 9: Perubahan Ketentuan</h3>
                <p>Penyelenggara berhak untuk mengubah Ketentuan ini dari waktu ke waktu. Setiap perubahan akan diinformasikan kepada Pengguna melalui saluran komunikasi resmi. Dengan terus menggunakan Layanan setelah perubahan diumumkan, Pengguna dianggap menyetujui Ketentuan yang baru.</p>

                <h3 className="font-bold pt-4">Pasal 10: Hukum yang Berlaku</h3>
                <p>Syarat dan Ketentuan ini diatur dan ditafsirkan sesuai dengan hukum yang berlaku di Negara Kesatuan Republik Indonesia.</p>

                <h3 className="font-bold pt-4">Pasal 11: Kontak dan Laporan</h3>
                <p>Jika Pengguna memiliki pertanyaan mengenai Ketentuan ini atau ingin melaporkan dugaan pelanggaran, silakan hubungi administrator sistem melalui email: riskregisterdkppu@gmail.com.</p>
                
            </div>
        </ScrollArea>
        <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Decline</Button>
            <Button onClick={handleAccept} disabled={!isButtonActive}>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    