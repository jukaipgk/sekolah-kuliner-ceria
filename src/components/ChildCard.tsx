
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, User, GraduationCap, AlertTriangle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Child = Tables<"children">;

interface ChildCardProps {
  child: Child;
  onEdit?: (child: Child) => void;
  onDelete?: (childId: string) => void;
}

export const ChildCard = ({ child, onEdit, onDelete }: ChildCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <div className="bg-orange-100 p-2 rounded-full">
              <User className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{child.name}</CardTitle>
              <CardDescription className="flex items-center space-x-1">
                <GraduationCap className="h-4 w-4" />
                <span>Kelas {child.class_name}</span>
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {child.student_id}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 mb-1">ID Siswa:</p>
            <p className="font-medium">{child.student_id}</p>
          </div>
          
          {child.allergies && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Alergi:</span>
              </div>
              <p className="text-sm text-yellow-700">{child.allergies}</p>
            </div>
          )}
          
          {(onEdit || onDelete) && (
            <div className="flex space-x-2 pt-2">
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(child)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(child.id)}
                  className="flex-1 text-red-600 hover:bg-red-50 hover:border-red-200"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
