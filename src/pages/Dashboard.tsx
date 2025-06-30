
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, Users, ShoppingCart, ClipboardList, LogOut } from "lucide-react";

const Dashboard = () => {
  const { user, signOut } = useAuth();

  // Fetch children count
  const { data: childrenCount } = useQuery({
    queryKey: ['children-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch orders count
  const { data: ordersCount } = useQuery({
    queryKey: ['orders-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

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
                {user?.user_metadata?.full_name || user?.email}
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Selamat Datang di Sekolah Kuliner Ceria
          </h1>
          <p className="text-gray-600">
            Kelola pesanan makanan untuk anak-anak Anda dengan mudah
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Anak</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{childrenCount}</div>
              <p className="text-xs text-muted-foreground">
                Anak yang terdaftar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordersCount}</div>
              <p className="text-xs text-muted-foreground">
                Pesanan yang dibuat
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Aktif</div>
              <p className="text-xs text-muted-foreground">
                Sistem berjalan normal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={() => window.location.href = '/children'}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-orange-500" />
                <CardTitle>Kelola Anak</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Tambah, edit, atau hapus data anak-anak Anda
              </CardDescription>
              <Button 
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => window.location.href = '/children'}
              >
                Kelola Anak
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => window.location.href = '/menu'}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <UtensilsCrossed className="h-6 w-6 text-green-500" />
                <CardTitle>Lihat Menu</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Jelajahi menu makanan dan buat pesanan baru
              </CardDescription>
              <Button 
                className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white"
                onClick={() => window.location.href = '/menu'}
              >
                Lihat Menu
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <ClipboardList className="h-6 w-6 text-blue-500" />
                <CardTitle>Riwayat Pesanan</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Lihat riwayat pesanan dan status pengiriman
              </CardDescription>
              <Button 
                className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                disabled
              >
                Segera Hadir
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
