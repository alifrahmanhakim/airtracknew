
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-8 flex items-center justify-center">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Syarat & Ketentuan, Kebijakan Privasi & Cookie</CardTitle>
          <CardDescription>
            Terakhir diperbarui: 24 Oktober 2025
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section id="privacy-policy">
            <h2 className="text-xl font-semibold mb-2">Kebijakan Privasi</h2>
            <div className="space-y-4 text-muted-foreground text-sm">
              <p>
                Aplikasi <strong>AirTrack</strong> ("Layanan") ini adalah sistem internal yang dikelola oleh Direktorat Kelaikudaraan dan Pengoperasian Pesawat Udara ("DKPPU"). Kami berkomitmen untuk melindungi privasi dan keamanan data Anda.
              </p>
              <h3 className="font-semibold text-foreground">1. Data yang Kami Kumpulkan</h3>
              <p>
                Saat Anda melakukan registrasi dan login menggunakan Akun Google, kami hanya mengakses dan menyimpan informasi dasar yang diperlukan untuk fungsionalitas akun, yaitu:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Nama Lengkap:</strong> Digunakan untuk identifikasi Anda di dalam sistem.</li>
                <li><strong>Alamat Email:</strong> Digunakan sebagai nama pengguna unik dan untuk komunikasi terkait akun.</li>
                <li><strong>Foto Profil:</strong> Digunakan untuk personalisasi antarmuka pengguna.</li>
              </ul>
              <p>
                Kami <strong>tidak</strong> mengumpulkan atau menyimpan kata sandi Akun Google Anda.
              </p>
              <h3 className="font-semibold text-foreground">2. Penggunaan Data</h3>
              <p>
                Data yang kami kumpulkan digunakan secara eksklusif untuk tujuan berikut:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Manajemen otentikasi dan otorisasi akses ke dalam Layanan.</li>
                <li>Identifikasi kontribusi dan aktivitas Anda dalam konteks pekerjaan (misalnya, siapa yang membuat atau memperbarui tugas).</li>
                <li>Personalisasi pengalaman pengguna di dalam aplikasi.</li>
              </ul>
              <h3 className="font-semibold text-foreground">3. Keamanan dan Penyimpanan Data</h3>
              <p>
                Seluruh data pengguna dan data pekerjaan disimpan dalam infrastruktur Google Firebase yang aman. Data ini bersifat internal dan rahasia, serta tidak akan dibagikan, dijual, atau diungkapkan kepada pihak ketiga mana pun di luar DKPPU tanpa dasar hukum yang sah.
              </p>
            </div>
          </section>

          <section id="cookie-policy">
            <h2 className="text-xl font-semibold mb-2">Kebijakan Cookie</h2>
            <div className="space-y-4 text-muted-foreground text-sm">
              <h3 className="font-semibold text-foreground">1. Apa itu Cookie?</h3>
              <p>
                Cookie adalah file teks kecil yang disimpan di perangkat Anda (komputer atau ponsel) saat Anda mengunjungi sebuah situs web. Cookie membantu situs web mengenali perangkat Anda dan mengingat informasi tertentu tentang preferensi atau aktivitas Anda.
              </p>
              <h3 className="font-semibold text-foreground">2. Bagaimana Kami Menggunakan Cookie</h3>
              <p>
                Layanan kami menggunakan cookie untuk tujuan fungsional yang esensial, seperti:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Manajemen Sesi:</strong> Untuk menjaga Anda tetap login selama menggunakan aplikasi.</li>
                <li><strong>Preferensi Pengguna:</strong> Untuk mengingat preferensi tampilan Anda, seperti tema terang (light) atau gelap (dark).</li>
              </ul>
              <p>
                Kami <strong>tidak</strong> menggunakan cookie untuk tujuan pelacakan (tracking), analisis perilaku di luar aplikasi kami, atau untuk tujuan periklanan.
              </p>
              <h3 className="font-semibold text-foreground">3. Mengelola Cookie</h3>
              <p>
                Anda dapat mengatur atau menghapus cookie melalui pengaturan peramban (browser) Anda. Namun, perlu diketahui bahwa menonaktifkan cookie dapat menyebabkan beberapa fitur Layanan tidak berfungsi secara optimal.
              </p>
            </div>
          </section>
          
          <div className="pt-6 flex justify-center">
            <Button asChild variant="outline">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Halaman Login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

    