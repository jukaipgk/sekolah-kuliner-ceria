
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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
  
  const [formData, setFormData] = useState({
    name: child?.name || '',
    class_name: child?.class_name || '',
    student_id: child?.student_id || '',
    allergies: child?.allergies || '',
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (child) {
        // Update existing child
        const { error } = await supabase
          .from('children')
          .update(data)
          .eq('id', child.id);
        
        if (error) throw error;
      } else {
        // Create new child
        const { error } = await supabase
          .from('children')
          .insert([{
            ...data,
            parent_id: user!.id,
          }]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Berhasil!",
        description: child ? "Data anak berhasil diperbarui." : "Data anak berhasil ditambahkan.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menyimpan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
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
            onChange={(e) => handleChange('name', e.target.value)}
            required
            placeholder="Masukkan nama lengkap anak"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="class_name">Kelas</Label>
          <Input
            id="class_name"
            type="text"
            value={formData.class_name}
            onChange={(e) => handleChange('class_name', e.target.value)}
            required
            placeholder="Contoh: 1A, 2B, 3C"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="student_id">Nomor Induk Siswa (NIS)</Label>
        <Input
          id="student_id"
          type="text"
          value={formData.student_id}
          onChange={(e) => handleChange('student_id', e.target.value)}
          required
          placeholder="Masukkan nomor induk siswa"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="allergies">Alergi Makanan (Opsional)</Label>
        <Textarea
          id="allergies"
          value={formData.allergies}
          onChange={(e) => handleChange('allergies', e.target.value)}
          placeholder="Masukkan informasi alergi makanan jika ada"
          rows={3}
        />
      </div>
      
      <div className="flex space-x-2 pt-4">
        <Button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 text-white"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Menyimpan..." : (child ? "Perbarui" : "Simpan")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={mutation.isPending}
        >
          Batal
        </Button>
      </div>
    </form>
  );
};
