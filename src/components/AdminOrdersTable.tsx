
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Eye, RefreshCw } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders"> & {
  children: Tables<"children">;
  profiles: Tables<"profiles">;
};

export const AdminOrdersTable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch all orders (admin/cashier view)
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          children:child_id (
            id,
            name,
            class_name,
            student_id
          ),
          profiles:parent_id (
            id,
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({
        title: "Status berhasil diperbarui",
        description: "Status pesanan telah berhasil diubah.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      confirmed: "default",
      preparing: "outline",
      ready: "default",
      delivered: "default",
      cancelled: "destructive"
    } as const;

    const labels = {
      pending: "Menunggu",
      confirmed: "Dikonfirmasi",
      preparing: "Diproses",
      ready: "Siap",
      delivered: "Dikirim",
      cancelled: "Dibatalkan"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: string | null) => {
    if (!paymentStatus) return null;
    
    const variants = {
      pending: "secondary",
      paid: "default",
      failed: "destructive"
    } as const;

    const labels = {
      pending: "Menunggu Pembayaran",
      paid: "Lunas",
      failed: "Gagal"
    };

    return (
      <Badge variant={variants[paymentStatus as keyof typeof variants] || "secondary"}>
        {labels[paymentStatus as keyof typeof labels] || paymentStatus}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Kelola Pesanan</CardTitle>
            <CardDescription>
              Lihat dan kelola semua pesanan dari orang tua
            </CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
              <SelectItem value="preparing">Diproses</SelectItem>
              <SelectItem value="ready">Siap</SelectItem>
              <SelectItem value="delivered">Dikirim</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders && orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">ID Pesanan</p>
                    <p className="font-medium text-sm">{order.id.slice(0, 8)}...</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tanggal Pesanan</p>
                    <p className="font-medium">{format(new Date(order.order_date), 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tanggal Kirim</p>
                    <p className="font-medium">{format(new Date(order.delivery_date), 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="font-bold text-orange-600">
                      Rp {order.total_amount.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Orang Tua</p>
                    <p className="font-medium">{order.profiles?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Anak</p>
                    <p className="font-medium">
                      {order.children?.name} - Kelas {order.children?.class_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pembayaran</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {order.payment_method === 'cash' ? 'Tunai' : 'Digital'}
                      </Badge>
                      {getPaymentStatusBadge(order.payment_status)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    {getStatusBadge(order.status)}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Select
                      value={order.status}
                      onValueChange={(newStatus) => 
                        updateOrderStatusMutation.mutate({ 
                          orderId: order.id, 
                          status: newStatus 
                        })
                      }
                      disabled={updateOrderStatusMutation.isPending}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Menunggu</SelectItem>
                        <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                        <SelectItem value="preparing">Diproses</SelectItem>
                        <SelectItem value="ready">Siap</SelectItem>
                        <SelectItem value="delivered">Dikirim</SelectItem>
                        <SelectItem value="cancelled">Dibatalkan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {order.notes && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Catatan:</p>
                    <p className="text-sm">{order.notes}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Tidak ada pesanan ditemukan.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
