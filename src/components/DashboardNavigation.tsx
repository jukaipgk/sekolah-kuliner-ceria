
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, LogOut, Users, ShoppingBag, Settings, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";

export const DashboardNavigation = () => {
  const { user, signOut } = useAuth();
  const { data: userRole, isLoading } = useUserRole();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <header className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <UtensilsCrossed className="h-8 w-8 text-orange-500" />
              <span className="text-xl font-bold text-gray-900">Sekolah Kuliner Ceria</span>
            </div>
            <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <UtensilsCrossed className="h-8 w-8 text-orange-500" />
            <span className="text-xl font-bold text-gray-900">Sekolah Kuliner Ceria</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-4">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-orange-600 hover:bg-orange-50"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              
              <Button
                onClick={() => navigate('/children')}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-orange-600 hover:bg-orange-50"
              >
                <Users className="h-4 w-4 mr-2" />
                Data Anak
              </Button>
              
              <Button
                onClick={() => navigate('/menu')}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-orange-600 hover:bg-orange-50"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Menu
              </Button>

              {(userRole === 'admin' || userRole === 'cashier') && (
                <Button
                  onClick={() => navigate('/admin')}
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 font-medium"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {userRole === 'admin' ? 'Admin Panel' : 'Kasir Panel'}
                </Button>
              )}
            </nav>

            {/* User Info */}
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {user?.user_metadata?.full_name || user?.email}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {userRole === 'admin' ? 'Administrator' : 
                   userRole === 'cashier' ? 'Kasir' : 'Orang Tua'}
                </div>
              </div>
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
      </div>
    </header>
  );
};
