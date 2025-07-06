
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UtensilsCrossed, LogOut, ArrowLeft, CreditCard, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Child = Tables<"children">;

const Order = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { cart, getTotalPrice, clearCart } = useCart();
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");

  // Fetch children data
  const { data: children, isLoading: childrenLoading } = useQuery({
    queryKey: ['children'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: {
      childId: string;
      deliveryDate: string;
      notes: string;
      totalAmount: number;
      paymentMethod: string;
      items: Array<{ menuItemId: string; quantity: number; price: number }>;
    }) => {
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          parent_id: user!.id,
          child_id: orderData.childId,
          delivery_date: orderData.deliveryDate,
          order_date: new Date().toISOString().split('T')[0],
          total_amount: orderData.totalAmount,
          notes: orderData.notes,
          status: 'pending',
          payment_method: orderData.paymentMethod,
          payment_status: orderData.paymentMethod === 'cash' ? 'pending' : 'pending'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // If payment method is digital, create Midtrans payment
      if (orderData.paymentMethod === 'digital') {
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-midtrans-payment', {
          body: {
            orderId: order.id,
            amount: orderData.totalAmount,
            customerDetails: {
              first_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Customer',
              email: user?.email
            }
          }
        });

        if (paymentError) {
          console.error('Payment creation error:', paymentError);
          throw new Error('Gagal membuat link pembayaran');
        }

        // Update order with payment URL
        await supabase
          .from('orders')
          .update({
            midtrans_payment_url: paymentData.payment_url,
            midtrans_transaction_id: paymentData.transaction_id
          })
          .eq('id', order.id);

        return { ...order, payment_url: paymentData.payment_url };
      }

      return order;
    },
    onSuccess: (order) => {
      toast({
        title: "Pesanan berhasil dibuat!",
        description: paymentMethod === 'digital' 
          ? "Silakan lanjutkan dengan pembayaran digital." 
          : "Pesanan Anda telah diterima dan sedang diproses.",
      });
      
      // Clear cart
      clearCart();
      
      // If digital payment, redirect to payment URL
      if (paymentMethod === 'digital' && order.payment_url) {
        window.open(order.payment_url, '_blank');
        setTimeout(() => {
          window.location.href = '/order-history';
        }, 2000);
      } else {
        // Redirect to dashboard for cash payment
        window.location.href = '/dashboard';
      }
    },
    onError: (error: any) => {
      toast({
        title: "Gagal membuat pesanan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      toast({
        title: "Keranjang kosong",
        description: "Silakan pilih menu terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = getTotalPrice();
    const items = cart.map((item) => ({
      menuItemId: item.menu_item.id,
      quantity: item.quantity,
      price: item.menu_item.price
    }));

    createOrderMutation.mutate({
      childId: selectedChild,
      deliveryDate,
      notes,
      totalAmount,
      paymentMethod,
      items
    });
  };

  // Get tomorrow's date as minimum delivery date
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (childrenLoading) {
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
                onClick={() => window.location.href = '/menu'}
                variant="ghost"
                size="sm"
                className="text-orange-600 hover:bg-orange-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Menu
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Buat Pesanan</h1>
          <p className="text-gray-600">Lengkapi informasi pesanan untuk anak Anda</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Pesanan</CardTitle>
              <CardDescription>Item yang akan dipesan</CardDescription>
            </CardHeader>
            <CardContent>
              {cart.length > 0 ? (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.menu_item.id} className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{item.menu_item.name}</h4>
                        <p className="text-sm text-gray-600">
                          {item.quantity} x Rp {item.menu_item.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="font-medium">
                        Rp {(item.menu_item.price * item.quantity).toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total:</span>
                      <span>Rp {getTotalPrice().toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Keranjang belanja kosong</p>
                  <Button
                    onClick={() => window.location.href = '/menu'}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Pilih Menu
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Form */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Pesanan</CardTitle>
              <CardDescription>
                Pastikan semua informasi sudah benar sebelum mengirim pesanan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="child">Pilih Anak</Label>
                  <Select value={selectedChild} onValueChange={setSelectedChild} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih anak yang akan menerima pesanan" />
                    </SelectTrigger>
                    <SelectContent>
                      {children?.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.name} - Kelas {child.class_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">Tanggal Pengiriman</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={getTomorrowDate()}
                    required
                  />
                  <p className="text-sm text-gray-500">
                    Pesanan akan dikirim ke sekolah pada tanggal yang dipilih
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Metode Pembayaran</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="flex items-center cursor-pointer">
                        <Banknote className="h-4 w-4 mr-2" />
                        Bayar Tunai di Sekolah
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="digital" id="digital" />
                      <Label htmlFor="digital" className="flex items-center cursor-pointer">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pembayaran Digital (Transfer Bank, E-Wallet, dll)
                      </Label>
                    </div>
                  </RadioGroup>
                  {paymentMethod === 'digital' && (
                    <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                      Anda akan diarahkan ke halaman pembayaran setelah pesanan dibuat
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Tidak pedas, tanpa bawang, dll."
                    rows={3}
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={createOrderMutation.isPending || cart.length === 0}
                  >
                    {createOrderMutation.isPending ? "Membuat Pesanan..." : "Buat Pesanan"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.href = '/menu'}
                    disabled={createOrderMutation.isPending}
                  >
                    Kembali ke Menu
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Order;
