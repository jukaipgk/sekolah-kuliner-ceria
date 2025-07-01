
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, LogOut, ArrowLeft, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders"> & {
  children: { name: string; class_name: string };
  order_items: Array<{
    quantity: number;
    price: number;
    menu_items: { name: string };
  }>;
};

const OrderHistory = () => {
  const { user, signOut } = useAuth();

  // Fetch orders with children and order items
  const { data: orders, isLoading } = useQuery({
    queryKey: ['order-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          children (
            name,
            class_name
          ),
          order_items (
            quantity,
            price,
            menu_items (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
      case 'preparing':
        return <Package className="h-4 w-4" />;
      case 'ready':
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Menunggu Konfirmasi';
      case 'confirmed':
        return 'Dikonfirmasi';
      case 'preparing':
        return 'Sedang Disiapkan';
      case 'ready':
        return 'Siap Diambil';
      case 'delivered':
        return 'Sudah Diantar';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  if (isLoading) {
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
              <span className="text-xl font-bold text-gray-900">Sekolah Kuliner Ceria</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => window.location.href = '/dashboard'}
                variant="ghost"
                size="sm"
                className="text-orange-600 hover:bg-orange-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Dashboard
              </Button>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Riwayat Pesanan</h1>
          <p className="text-gray-600">Lihat semua pesanan yang pernah Anda buat</p>
        </div>

        {orders && orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Pesanan #{order.id.slice(-8).toUpperCase()}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {order.children.name} - Kelas {order.children.class_name}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(order.status)}
                        <span>{getStatusText(order.status)}</span>
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Detail Pesanan</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Tanggal Pesanan: {format(new Date(order.order_date), 'dd MMMM yyyy', { locale: id })}</p>
                        <p>Tanggal Pengiriman: {format(new Date(order.delivery_date), 'dd MMMM yyyy', { locale: id })}</p>
                        <p>Total: Rp {order.total_amount.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Item Pesanan</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {order.order_items.map((item, index) => (
                          <p key={index}>
                            {item.quantity}x {item.menu_items.name} - Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                  {order.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-1">Catatan</h4>
                      <p className="text-sm text-gray-600">{order.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Pesanan</h3>
              <p className="text-gray-600 mb-4">Anda belum pernah membuat pesanan</p>
              <Button 
                onClick={() => window.location.href = '/menu'}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Buat Pesanan Pertama
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default OrderHistory;
