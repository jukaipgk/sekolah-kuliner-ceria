
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, User, AlertTriangle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Child = Tables<"children">;

interface ChildCardProps {
  child: Child;
  onEdit: (child: Child) => void;
  onDelete: (childId: string) => void;
}

export const ChildCard = ({ child, onEdit, onDelete }: ChildCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <User className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{child.name}</CardTitle>
              <p className="text-sm text-gray-600">Kelas {child.class_name}</p>
            </div>
          </div>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(child)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(child.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">NIS:</span>
            <Badge variant="outline">{child.student_id}</Badge>
          </div>
          
          {child.allergies && (
            <div className="flex items-start space-x-2 p-2 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Alergi:</p>
                <p className="text-sm text-yellow-700">{child.allergies}</p>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 pt-2">
            Ditambahkan: {new Date(child.created_at).toLocaleDateString('id-ID')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
