
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Child = Tables<"children">;

interface ChildFormProps {
  child?: Child | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ChildForm = ({ child, onSuccess, onCancel }: ChildFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: child?.name || "",
    student_id: child?.student_id || "",
    class_name: child?.class_name || "",
    allergies: child?.allergies || "",
  });

  // Create/Update child mutation
  const saveChildMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (child) {
        // Update existing child
        const { error } = await supabase
          .from('children')
          .update({
            name: data.name,
            student_id: data.student_id,
            class_name: data.class_name,
            allergies: data.allergies || null,
          })
          .eq('id', child.id);
        
        if (error) throw error;
      } else {
        // Create new child
        const { error } = await supabase
          .from('children')
          .insert([{
            parent_id: user!.id,
            name: data.name,
            student_id: data.student_id,
            class_name: data.class_name,
            allergies: data.allergies || null,
          }]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      toast({
        title: "Berhasil!",
        description: child ? "Data anak berhasil diperbarui." : "Anak baru berhasil ditambahkan.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: child ? "Gagal memperbarui" : "Gagal menambahkan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveChildMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Lengkap</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Masukkan nama lengkap anak"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="student_id">NIS/ID Siswa</Label>
          <Input
            id="student_id"
            type="text"
            value={formData.student_id}
            onChange={(e) => handleInputChange('student_id', e.target.value)}
            placeholder="Masukkan NIS atau ID siswa"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="class_name">Kelas</Label>
        <Input
          id="class_name"
          type="text"
          value={formData.class_name}
          onChange={(e) => handleInputChange('class_name', e.target.value)}
          placeholder="Contoh: 5A, 6B, dll."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="allergies">Alergi (Opsional)</Label>
        <Textarea
          id="allergies"
          value={formData.allergies}
          onChange={(e) => handleInputChange('allergies', e.target.value)}
          placeholder="Sebutkan alergi makanan jika ada, contoh: kacang, seafood, dll."
          rows={3}
        />
      </div>

      <div className="flex space-x-4 pt-4">
        <Button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 text-white"
          disabled={saveChildMutation.isPending}
        >
          {saveChildMutation.isPending 
            ? (child ? "Memperbarui..." : "Menambahkan...") 
            : (child ? "Perbarui Data" : "Tambah Anak")
          }
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saveChildMutation.isPending}
        >
          Batal
        </Button>
      </div>
    </form>
  );
};
