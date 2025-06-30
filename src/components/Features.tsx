
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Shield, CalendarCheck, Users, UtensilsCrossed, ShoppingCart } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Clock,
      title: "Pemesanan Fleksibel",
      description: "Pesan makanan untuk hari Senin-Jumat dengan waktu pemesanan yang fleksibel dari jam 12.00 hingga 05.00",
      color: "text-blue-500 bg-blue-100"
    },
    {
      icon: Shield,
      title: "Keamanan Terjamin",
      description: "Verifikasi email dan sistem keamanan berlapis untuk melindungi data orang tua dan anak",
      color: "text-green-500 bg-green-100"
    },
    {
      icon: CalendarCheck,
      title: "Jadwal Terorganisir",
      description: "Kelola jadwal makan anak dengan mudah, termasuk menu harian dan catatan khusus seperti alergi",
      color: "text-orange-500 bg-orange-100"
    },
    {
      icon: Users,
      title: "Multi Anak",
      description: "Satu akun untuk mengelola beberapa anak, dengan profil terpisah untuk setiap anak",
      color: "text-purple-500 bg-purple-100"
    },
    {
      icon: UtensilsCrossed,
      title: "Menu Beragam",
      description: "Pilihan menu makanan dan minuman yang beragam dengan deskripsi lengkap dan harga transparan",
      color: "text-red-500 bg-red-100"
    },
    {
      icon: ShoppingCart,
      title: "Pembayaran Mudah",
      description: "Sistem pembayaran terintegrasi dengan Midtrans untuk kemudahan transaksi online yang aman",
      color: "text-indigo-500 bg-indigo-100"
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Mengapa Memilih Sekolah Kuliner Ceria?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Kami menyediakan solusi lengkap untuk kebutuhan makan anak di sekolah dengan 
            teknologi modern dan pelayanan terbaik
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${feature.color} mb-4`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
