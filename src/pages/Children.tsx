
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, Plus, Edit, Trash2, User, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChildForm } from "@/components/ChildForm";
import { ChildCard } from "@/components/ChildCard";
import type { Tables } from "@/integrations/supabase/types";

type Child = Tables<"children">;

const Children = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  // Fetch children data
  const { data: children, isLoading } = useQuery({
    queryKey: ['children'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Delete child mutation
  const deleteChildMutation = useMutation({
    mutationFn: async (childId: string) => {
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      toast({
        title: "Berhasil!",
        description: "Data anak berhasil dihapus.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menghapus",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setShowForm(true);
  };

  const handleDelete = (childId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data anak ini?")) {
      deleteChildMutation.mutate(childId);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingChild(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    queryClient.invalidateQueries({ queryKey: ['children'] });
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Kelola Anak</h1>
            <p className="text-gray-600">Tambah dan kelola data anak-anak Anda</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Anak
          </Button>
        </div>

        {showForm && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingChild ? 'Edit Data Anak' : 'Tambah Anak Baru'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChildForm
                  child={editingChild}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormClose}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {children && children.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <ChildCard
                key={child.id}
                child={child}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Belum ada data anak
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Mulai dengan menambahkan data anak pertama Anda
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Anak
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Children;
