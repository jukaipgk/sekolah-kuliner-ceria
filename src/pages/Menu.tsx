
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, ShoppingCart, LogOut, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type MenuItem = Tables<"menu_items"> & {
  menu_categories: { name: string };
};

type CartItem = {
  menu_item: MenuItem;
  quantity: number;
};

const Menu = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);

  // Fetch menu items with categories
  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          menu_categories!inner (
            name
          )
        `)
        .eq('is_available', true)
        .order('name');
      
      if (error) throw error;
      return data as MenuItem[];
    },
  });

  // Group menu items by category
  const menuByCategory = menuItems?.reduce((acc, item) => {
    const categoryName = item.menu_categories.name;
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>) || {};

  const addToCart = (menuItem: MenuItem) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.menu_item.id === menuItem.id);
      if (existingItem) {
        return prev.map(item =>
          item.menu_item.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menu_item: menuItem, quantity: 1 }];
    });
    
    toast({
      title: "Ditambahkan ke keranjang",
      description: `${menuItem.name} berhasil ditambahkan`,
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.menu_item.id === menuItemId);
      if (existingItem && existingItem.quantity > 1) {
        return prev.map(item =>
          item.menu_item.id === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.menu_item.id !== menuItemId);
    });
  };

  const getCartItemQuantity = (menuItemId: string) => {
    return cart.find(item => item.menu_item.id === menuItemId)?.quantity || 0;
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.menu_item.price * item.quantity), 0);
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
                Dashboard
              </Button>
              <Button
                onClick={() => window.location.href = '/children'}
                variant="ghost"
                size="sm"
                className="text-orange-600 hover:bg-orange-50"
              >
                Kelola Anak
              </Button>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Keranjang ({getTotalItems()})
                </Button>
              </div>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Makanan</h1>
            <p className="text-gray-600">Pilih makanan favorit untuk anak Anda</p>
          </div>
          {getTotalItems() > 0 && (
            <Card className="w-80">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Keranjang Belanja</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 mb-4">
                  {cart.map((item) => (
                    <div key={item.menu_item.id} className="flex justify-between items-center text-sm">
                      <span>{item.menu_item.name}</span>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromCart(item.menu_item.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToCart(item.menu_item)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>Rp {getTotalPrice().toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <Button 
                  className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => window.location.href = '/order'}
                >
                  Buat Pesanan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          {Object.entries(menuByCategory).map(([categoryName, items]) => (
            <div key={categoryName}>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{categoryName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          {item.description && (
                            <CardDescription className="mt-1">{item.description}</CardDescription>
                          )}
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          Rp {item.price.toLocaleString('id-ID')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex justify-between items-center">
                        {getCartItemQuantity(item.id) > 0 ? (
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {getCartItemQuantity(item.id)}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addToCart(item)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => addToCart(item)}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Menu;
