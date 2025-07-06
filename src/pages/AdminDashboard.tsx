
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminOrdersTable } from "@/components/AdminOrdersTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, LogOut, ShoppingBag, Users, DollarSign, Clock, Home } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's orders
      const { data: todayOrders, error: todayError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_date', today);
      
      if (todayError) throw todayError;

      // Get pending orders
      const { data: pendingOrders, error: pendingError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending');
      
      if (pendingError) throw pendingError;

      // Get total revenue for this month
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data: monthlyOrders, error: monthlyError } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('order_date', currentMonth + '-01')
        .lt('order_date', currentMonth + '-32');
      
      if (monthlyError) throw monthlyError;

      const totalRevenue = monthlyOrders.reduce((sum, order) => sum + order.total_amount, 0);

      return {
        todayOrdersCount: todayOrders.length,
        pendingOrdersCount: pendingOrders.length,
        monthlyRevenue: totalRevenue,
        todayRevenue: todayOrders.reduce((sum, order) => sum + order.total_amount, 0)
      };
    },
    enabled: !!user && (userRole === 'admin' || userRole === 'cashier'),
  });

  // Redirect if not admin or cashier
  if (!roleLoading && userRole !== 'admin' && userRole !== 'cashier') {
    return <Navigate to="/dashboard" />;
  }

  if (roleLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <UtensilsCrossed className="h-8 w-8 text-orange-500" />
              <span className="text-xl font-bold text-gray-900">
                {userRole === 'admin' ? 'Admin Dashboard' : 'Kasir Dashboard'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                size="sm"
                className="text-orange-600 hover:bg-orange-50"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard Utama
              </Button>
              <span className="text-sm text-gray-600">
                {userRole === 'admin' ? 'Administrator' : 'Kasir'} - {user?.user_metadata?.full_name || user?.email}
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
            Dashboard {userRole === 'admin' ? 'Admin' : 'Kasir'}
          </h1>
          <p className="text-gray-600">
            {userRole === 'admin' 
              ? 'Kelola pesanan dan monitoring sistem' 
              : 'Kelola pesanan dan pembayaran'}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pesanan Hari Ini</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.todayOrdersCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                Pendapatan: Rp {(stats?.todayRevenue || 0).toLocaleString('id-ID')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pesanan Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats?.pendingOrdersCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                Menunggu konfirmasi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendapatan Bulan Ini</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                Rp {(stats?.monthlyRevenue || 0).toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-muted-foreground">
                Total bulan ini
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Sistem</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">
                Sistem berjalan normal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Management */}
        <AdminOrdersTable />
      </main>
    </div>
  );
};

export default AdminDashboard;
