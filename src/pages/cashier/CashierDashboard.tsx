
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, User, Calendar, Package, CreditCard, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { formatPrice, formatDate } from '@/utils/orderUtils';
import { CashPayment } from '@/components/cashier/CashPayment';
import { format } from 'date-fns';

interface Order {
  id: string;
  child_id: string | null;
  child_name: string;
  child_class: string;
  total_amount: number;
  payment_status: string;
  delivery_date: string;
  created_at: string;
  order_items: {
    quantity: number;
    price: number;
    menu_items: {
      name: string;
    } | null;
  }[];
}

export default function CashierDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    console.log('CashierDashboard: Component mounted');
    return () => {
      console.log('CashierDashboard: Component unmounted');
    };
  }, []);

  useEffect(() => {
    console.log('CashierDashboard: Search term changed:', searchTerm);
    if (searchTerm.length >= 2) {
      searchOrders();
    } else {
      setFilteredOrders([]);
    }
  }, [searchTerm]);

  const searchOrders = async () => {
    setLoading(true);
    try {
      console.log('CashierDashboard: Searching orders with term:', searchTerm);

      // First, search for children by NIK, NIS, name, or class
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('id, name, class_name, nik, nis')
        .or(`name.ilike.%${searchTerm}%,class_name.ilike.%${searchTerm}%,nik.ilike.%${searchTerm}%,nis.ilike.%${searchTerm}%`)
        .limit(50);

      if (childrenError) {
        console.error('CashierDashboard: Children search error:', childrenError);
        throw childrenError;
      }

      console.log('CashierDashboard: Found children:', childrenData?.length || 0);

      let allOrderIds: string[] = [];

      // If we found children, get their order IDs
      if (childrenData && childrenData.length > 0) {
        const childIds = childrenData.map(child => child.id);
        
        const { data: childOrderIds, error: childOrderError } = await supabase
          .from('orders')
          .select('id')
          .in('child_id', childIds)
          .not('delivery_date', 'is', null);

        if (!childOrderError && childOrderIds) {
          allOrderIds = childOrderIds.map(order => order.id);
        }
      }

      // Also search directly in orders by child_name and child_class
      const { data: directOrders, error: directOrderError } = await supabase
        .from('orders')
        .select('id')
        .or(`child_name.ilike.%${searchTerm}%,child_class.ilike.%${searchTerm}%`)
        .not('child_name', 'is', null)
        .not('delivery_date', 'is', null);

      if (!directOrderError && directOrders) {
        const directOrderIds = directOrders.map(order => order.id);
        allOrderIds = [...allOrderIds, ...directOrderIds];
      }

      // Remove duplicates
      const uniqueOrderIds = [...new Set(allOrderIds)];

      console.log('CashierDashboard: Found order IDs:', uniqueOrderIds.length);

      if (uniqueOrderIds.length === 0) {
        setOrders([]);
        setFilteredOrders([]);
        return;
      }

      // Fetch complete order details
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          child_id,
          child_name,
          child_class,
          total_amount,
          payment_status,
          delivery_date,
          created_at,
          order_items (
            quantity,
            price,
            menu_items (
              name
            )
          )
        `)
        .in('id', uniqueOrderIds)
        .order('delivery_date', { ascending: false })
        .limit(20);

      if (ordersError) {
        console.error('CashierDashboard: Orders fetch error:', ordersError);
        throw ordersError;
      }

      console.log('CashierDashboard: Final orders found:', ordersData?.length || 0);
      
      setOrders(ordersData || []);
      setFilteredOrders(ordersData || []);
    } catch (error) {
      console.error('CashierDashboard: Error searching orders:', error);
      toast({
        title: "Error",
        description: "Gagal mencari pesanan: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = () => {
    console.log('CashierDashboard: Payment completed');
    setSelectedOrder(null);
    // Refresh search results
    if (searchTerm.length >= 2) {
      searchOrders();
    }
    toast({
      title: "Pembayaran Berhasil",
      description: "Pembayaran tunai telah diproses",
    });
  };

  const toggleOrderExpansion = (orderId: string) => {
    console.log('CashierDashboard: Toggling order expansion for:', orderId);
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Lunas';
      case 'pending': return 'Belum Bayar';
      case 'failed': return 'Gagal';
      default: return status;
    }
  };

  const isOrderExpired = (deliveryDate: string): boolean => {
    if (!deliveryDate) {
      console.warn('CashierDashboard: No delivery date provided');
      return false;
    }
    try {
      const delivery = new Date(deliveryDate);
      const today = new Date();
      delivery.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      return delivery < today;
    } catch (error) {
      console.error('CashierDashboard: Error parsing delivery date:', deliveryDate, error);
      return false;
    }
  };

  const formatDeliveryDate = (dateString: string) => {
    if (!dateString) {
      console.warn('CashierDashboard: No date string provided for formatting');
      return 'Tanggal tidak tersedia';
    }
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (error) {
      console.error('CashierDashboard: Error formatting date:', dateString, error);
      return 'Format tanggal tidak valid';
    }
  };

  const formatCreatedDate = (dateString: string) => {
    if (!dateString) {
      console.warn('CashierDashboard: No created date string provided for formatting');
      return 'Tanggal tidak tersedia';
    }
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm");
    } catch (error) {
      console.error('CashierDashboard: Error formatting created date:', dateString, error);
      return 'Format tanggal tidak valid';
    }
  };

  if (selectedOrder) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Proses Pembayaran Tunai</h1>
          <Button 
            variant="outline" 
            onClick={() => setSelectedOrder(null)}
          >
            Kembali ke Pencarian
          </Button>
        </div>
        
        <CashPayment 
          order={selectedOrder} 
          onPaymentComplete={handlePaymentComplete}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Kasir</h1>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Cari Pesanan Siswa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari berdasarkan nama siswa, kelas, NIK, atau NIS (minimal 2 karakter)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {searchTerm.length > 0 && searchTerm.length < 2 && (
              <p className="text-sm text-gray-500">
                Masukkan minimal 2 karakter untuk mencari
              </p>
            )}

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Tips Pencarian:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Cari berdasarkan <strong>nama siswa</strong>: "Ahmad", "Siti"</li>
                <li>Cari berdasarkan <strong>kelas</strong>: "1A", "2B"</li>
                <li>Cari berdasarkan <strong>NIK</strong>: "1234567890123456"</li>
                <li>Cari berdasarkan <strong>NIS</strong>: "2023001"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-pulse">Mencari pesanan...</div>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hasil Pencarian ({filteredOrders.length} pesanan)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const isExpired = isOrderExpired(order.delivery_date);
                const canPay = order.payment_status === 'pending' && !isExpired;
                const isExpanded = expandedOrders.has(order.id);
                
                return (
                  <div 
                    key={order.id} 
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Student Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{order.child_name || 'Nama tidak tersedia'}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Kelas: {order.child_class || 'Kelas tidak tersedia'}
                        </div>
                      </div>

                      {/* Delivery Date */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Tanggal Katering</span>
                        </div>
                        <div className="font-medium">
                          {formatDeliveryDate(order.delivery_date)}
                        </div>
                        {isExpired && (
                          <Badge variant="destructive" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Expired
                          </Badge>
                        )}
                      </div>

                      {/* Order Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Detail Pesanan</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleOrderExpansion(order.id)}
                            className="h-6 w-6 p-0"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="space-y-1">
                          {order.order_items && order.order_items.length > 0 ? (
                            <>
                              {(isExpanded ? order.order_items : order.order_items.slice(0, 2)).map((item, index) => (
                                <div key={index} className="text-sm">
                                  {item.quantity}x {item.menu_items?.name || 'Unknown Item'}
                                  <span className="text-gray-500 ml-2">
                                    @ {formatPrice(item.price)}
                                  </span>
                                </div>
                              ))}
                              {!isExpanded && order.order_items.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{order.order_items.length - 2} item lainnya
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">Tidak ada item</div>
                          )}
                        </div>
                      </div>

                      {/* Payment Info & Action */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-500" />
                          <Badge className={getPaymentStatusColor(order.payment_status)}>
                            {getPaymentStatusText(order.payment_status)}
                          </Badge>
                        </div>
                        <div className="font-bold text-lg">
                          {formatPrice(order.total_amount)}
                        </div>
                        
                        {canPay ? (
                          <Button 
                            onClick={() => setSelectedOrder(order)}
                            className="w-full"
                            size="sm"
                          >
                            Bayar Tunai
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            disabled 
                            className="w-full"
                            size="sm"
                          >
                            {order.payment_status === 'paid' ? 'Sudah Lunas' : 
                             isExpired ? 'Expired' : 'Tidak Dapat Dibayar'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Additional Order Info */}
                    <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Dibuat: {formatCreatedDate(order.created_at)}</span>
                        <span>Total Item: {order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</span>
                      </div>
                    </div>

                    {/* Expanded Order Details */}
                    {isExpanded && order.order_items && order.order_items.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h4 className="font-medium text-sm mb-2">Detail Lengkap Pesanan:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {order.order_items.map((item, index) => (
                            <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                              <div className="flex justify-between">
                                <span>{item.menu_items?.name || 'Unknown Item'}</span>
                                <span>{item.quantity}x</span>
                              </div>
                              <div className="text-xs text-gray-600">
                                @ {formatPrice(item.price)} = {formatPrice(item.price * item.quantity)}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t">
                          <div className="flex justify-between font-medium">
                            <span>Total Pesanan:</span>
                            <span>{formatPrice(order.total_amount)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {searchTerm.length >= 2 && !loading && filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Tidak ada pesanan yang ditemukan untuk "{searchTerm}"</p>
              <p className="text-sm mt-2">Coba dengan nama siswa, kelas, NIK, atau NIS yang lain</p>
            </div>
          </CardContent>
        </Card>
      )}

      {searchTerm.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Masukkan nama siswa, kelas, NIK, atau NIS untuk mencari pesanan</p>
              <p className="text-sm mt-2">Sistem akan menampilkan pesanan yang dapat diproses pembayaran tunai</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
