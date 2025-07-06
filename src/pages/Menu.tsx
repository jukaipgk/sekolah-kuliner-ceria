
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardNavigation } from "@/components/DashboardNavigation";
import { ShoppingCart, Plus, Minus, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type MenuItem = Tables<"menu_items"> & {
  menu_categories: Tables<"menu_categories">;
};

const Menu = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart, getItemQuantity, getTotalPrice, getTotalItems } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch menu categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch menu items
  const { data: menuItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['menu-items', selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('menu_items')
        .select(`
          *,
          menu_categories (
            id,
            name,
            description
          )
        `)
        .eq('is_available', true)
        .order('name');

      if (selectedCategory !== "all") {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MenuItem[];
    },
  });

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item);
    toast({
      title: "Ditambahkan ke keranjang",
      description: `${item.name} berhasil ditambahkan ke keranjang.`,
    });
  };

  const handleRemoveFromCart = (item: MenuItem) => {
    removeFromCart(item.id);
    toast({
      title: "Dihapus dari keranjang",
      description: `${item.name} dihapus dari keranjang.`,
    });
  };

  if (categoriesLoading || itemsLoading) {
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Makanan</h1>
            <p className="text-gray-600">Pilih makanan favorit untuk anak Anda</p>
          </div>
          
          {getTotalItems() > 0 && (
            <Button
              onClick={() => navigate('/order')}
              className="bg-orange-500 hover:bg-orange-600 text-white relative"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Keranjang ({getTotalItems()})
              <Badge className="ml-2 bg-orange-700">
                Rp {getTotalPrice().toLocaleString('id-ID')}
              </Badge>
            </Button>
          )}
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setSelectedCategory("all")}
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              className={selectedCategory === "all" ? "bg-orange-500 hover:bg-orange-600" : "border-orange-200 text-orange-600 hover:bg-orange-50"}
            >
              Semua Menu
            </Button>
            {categories?.map((category) => (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                className={selectedCategory === category.id ? "bg-orange-500 hover:bg-orange-600" : "border-orange-200 text-orange-600 hover:bg-orange-50"}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems && menuItems.length > 0 ? (
            menuItems.map((item) => {
              const quantity = getItemQuantity(item.id);
              return (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <CardDescription className="text-orange-600 font-medium">
                          Rp {item.price.toLocaleString('id-ID')}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {item.menu_categories.name}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {item.description && (
                      <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      {quantity > 0 ? (
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => handleRemoveFromCart(item)}
                            size="sm"
                            variant="outline"
                            className="border-orange-200 text-orange-600 hover:bg-orange-50"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-medium text-lg px-3">{quantity}</span>
                          <Button
                            onClick={() => handleAddToCart(item)}
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleAddToCart(item)}
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah ke Keranjang
                        </Button>
                      )}
                      
                      {quantity > 0 && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Subtotal</p>
                          <p className="font-bold text-orange-600">
                            Rp {(item.price * quantity).toLocaleString('id-ID')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada menu tersedia</h3>
              <p className="text-gray-600">
                {selectedCategory === "all" 
                  ? "Belum ada menu yang tersedia saat ini."
                  : "Tidak ada menu dalam kategori yang dipilih."}
              </p>
            </div>
          )}
        </div>

        {/* Cart Summary (Fixed Bottom) */}
        {getTotalItems() > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">{getTotalItems()} item dalam keranjang</p>
                <p className="font-bold text-lg text-orange-600">
                  Total: Rp {getTotalPrice().toLocaleString('id-ID')}
                </p>
              </div>
              <Button
                onClick={() => navigate('/order')}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buat Pesanan
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Menu;
