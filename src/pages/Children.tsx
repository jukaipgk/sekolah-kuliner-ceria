
import { DashboardNavigation } from "@/components/DashboardNavigation";
import { ChildForm } from "@/components/ChildForm";
import { ChildCard } from "@/components/ChildCard";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

const Children = () => {
  const { user } = useAuth();

  const { data: children, isLoading } = useQuery({
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

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Anak</h1>
          <p className="text-gray-600">Kelola informasi anak-anak yang akan menerima pesanan makanan</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form untuk menambah anak */}
          <Card>
            <CardHeader>
              <CardTitle>Tambah Data Anak</CardTitle>
              <CardDescription>
                Tambahkan informasi anak untuk melakukan pemesanan makanan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChildForm />
            </CardContent>
          </Card>

          {/* Daftar anak yang sudah terdaftar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Anak yang Terdaftar ({children?.length || 0})
              </CardTitle>
              <CardDescription>
                Daftar anak-anak yang sudah terdaftar dalam sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              {children && children.length > 0 ? (
                <div className="space-y-4">
                  {children.map((child) => (
                    <ChildCard key={child.id} child={child} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada data anak</h3>
                  <p className="text-gray-600">
                    Tambahkan data anak terlebih dahulu untuk mulai melakukan pemesanan makanan.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Children;
