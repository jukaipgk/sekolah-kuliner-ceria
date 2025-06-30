
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, Users, CalendarCheck, ShoppingCart, LogOut } from "lucide-react";

const Dashboard = () => {
  const { user, signOut } = useAuth();

  const features = [
    {
      icon: Users,
      title: "Kelola Anak",
      description: "Tambah dan kelola data anak-anak Anda",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: UtensilsCrossed,
      title: "Menu Makanan",
      description: "Lihat menu makanan harian yang tersedia",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: CalendarCheck,
      title: "Buat Pesanan",
      description: "Pesan makanan untuk anak-anak Anda",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: ShoppingCart,
      title: "Riwayat Pesanan",
      description: "Lihat riwayat pesanan yang telah dibuat",
      color: "bg-purple-100 text-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <UtensilsCrossed className="h-8 w-8 text-orange-500" />
              <span className="text-xl font-bold text-gray-900">Sekolah Kuliner Ceria</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Selamat datang, {user?.user_metadata?.full_name || user?.email}
              </span>
              <Button
                onClick={signOut}
                variant="outline"
                size="sm"
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Kelola pesanan makanan anak dengan mudah dan praktis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${feature.color} mb-4`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Selamat Datang di Sistem Pemesanan Makanan Sekolah</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Sistem ini memudahkan Anda untuk memesan makanan bergizi untuk anak-anak di sekolah. 
                Berikut langkah-langkah yang dapat Anda lakukan:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">1. Kelola Data Anak</h3>
                  <p className="text-blue-700 text-sm">
                    Tambahkan data anak-anak Anda termasuk nama, kelas, dan informasi alergi makanan.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">2. Lihat Menu Harian</h3>
                  <p className="text-green-700 text-sm">
                    Cek menu makanan yang tersedia setiap hari dengan harga yang transparan.
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h3 className="font-semibold text-orange-900 mb-2">3. Buat Pesanan</h3>
                  <p className="text-orange-700 text-sm">
                    Pesan makanan untuk anak-anak Anda sesuai dengan jadwal dan kebutuhan.
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">4. Pantau Riwayat</h3>
                  <p className="text-purple-700 text-sm">
                    Lihat riwayat pesanan dan status pengiriman makanan secara real-time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
