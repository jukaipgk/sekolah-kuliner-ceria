
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardNavigation } from "@/components/DashboardNavigation";
import { ShoppingBag, Users, DollarSign, Clock, Plus, Eye, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  // Fetch user's children
  const { data: children, isLoading: childrenLoading } = useQuery({
    queryKey: ['children'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user!.id)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch recent orders
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          children:child_id (
            name,
            class_name
          )
        `)
        .eq('parent_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('parent_id', user!.id);
      
      if (error) throw error;

      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0);
      
      return {
        totalOrders,
        pendingOrders,
        totalSpent,
        completedOrders: totalOrders - pendingOrders
      };
    },
    enabled: !!user,
  });

  if (roleLoading || childrenLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
        <DashboardNavigation />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <DashboardNavigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Selamat Datang, {user?.user_metadata?.full_name || user?.email}!
          </h1>
          <p className="text-gray-600">
            {userRole === 'admin' ? 'Dashboard Administrator' : 
             userRole === 'cashier' ? 'Dashboard Kasir' : 
             'Kelola pesanan makanan untuk anak-anak Anda'}
          </p>
        </div>

        {/* Quick Actions for Admin/Cashier */}
        {(userRole === 'admin' || userRole === 'cashier') && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Panel {userRole === 'admin' ? 'Admin' : 'Kasir'}</h2>
              <Button
                onClick={() => navigate('/admin')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Buka Panel {userRole === 'admin' ? 'Admin' : 'Kasir'}
              </Button>
            </div>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <p className="text-green-800">
                  Anda memiliki akses {userRole === 'admin' ? 'administrator' : 'kasir'}. 
                  Gunakan panel khusus untuk mengelola pesanan dan sistem.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground">
                Semua pesanan Anda
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pesanan Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats?.pendingOrders || 0}</div>
              <p className="text-xs text-muted-foreground">
                Menunggu konfirmasi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Anak</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{children?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Anak terdaftar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                Rp {(stats?.totalSpent || 0).toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-muted-foreground">
                Total yang dihabiskan
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
              <CardDescription>Tindakan yang sering dilakukan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => navigate('/menu')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Pesan Makanan
              </Button>
              <Button
                onClick={() => navigate('/children')}
                variant="outline"
                className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Data Anak
              </Button>
              <Button
                onClick={() => navigate('/order-history')}
                variant="outline"
                className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Lihat Riwayat Pesanan
              </Button>
            </CardContent>
          </Card>

          {/* Children List */}
          <Card>
            <CardHeader>
              <CardTitle>Data Anak</CardTitle>
              <CardDescription>
                {children && children.length > 0 
                  ? "Anak-anak yang terdaftar" 
                  : "Belum ada data anak"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {children && children.length > 0 ? (
                <div className="space-y-3">
                  {children.slice(0, 3).map((child) => (
                    <div key={child.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{child.name}</p>
                        <p className="text-sm text-gray-600">Kelas {child.class_name}</p>
                      </div>
                    </div>
                  ))}
                  {children.length > 3 && (
                    <Button
                      onClick={() => navigate('/children')}
                      variant="ghost"
                      size="sm"
                      className="w-full text-orange-600 hover:bg-orange-50"
                    >
                      Lihat semua ({children.length} anak)
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">Belum ada data anak</p>
                  <Button
                    onClick={() => navigate('/children')}
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Anak
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        {recentOrders && recentOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pesanan Terbaru</CardTitle>
              <CardDescription>5 pesanan terakhir Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Pesanan #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600">
                        {order.children?.name} - Kelas {order.children?.class_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">
                        Rp {order.total_amount.toLocaleString('id-ID')}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'preparing' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'ready' ? 'bg-green-100 text-green-800' :
                        order.status === 'delivered' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status === 'pending' ? 'Menunggu' :
                         order.status === 'confirmed' ? 'Dikonfirmasi' :
                         order.status === 'preparing' ? 'Diproses' :
                         order.status === 'ready' ? 'Siap' :
                         order.status === 'delivered' ? 'Dikirim' :
                         'Dibatalkan'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
