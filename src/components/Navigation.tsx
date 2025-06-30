
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Menu } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <UtensilsCrossed className="h-8 w-8 text-orange-500" />
            <span className="text-xl font-bold text-gray-900">Sekolah Kuliner Ceria</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-gray-700 hover:text-orange-500 transition-colors">Beranda</a>
            <a href="#" className="text-gray-700 hover:text-orange-500 transition-colors">Menu</a>
            <a href="#" className="text-gray-700 hover:text-orange-500 transition-colors">Tentang</a>
            <a href="#" className="text-gray-700 hover:text-orange-500 transition-colors">Kontak</a>
            <Button 
              variant="outline" 
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
              onClick={() => navigate('/auth')}
            >
              Masuk
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => navigate('/auth')}
            >
              Daftar
            </Button>
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-orange-100">
            <div className="flex flex-col space-y-3">
              <a href="#" className="text-gray-700 hover:text-orange-500 transition-colors">Beranda</a>
              <a href="#" className="text-gray-700 hover:text-orange-500 transition-colors">Menu</a>
              <a href="#" className="text-gray-700 hover:text-orange-500 transition-colors">Tentang</a>
              <a href="#" className="text-gray-700 hover:text-orange-500 transition-colors">Kontak</a>
              <div className="flex flex-col space-y-2 pt-2">
                <Button 
                  variant="outline" 
                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
                  onClick={() => navigate('/auth')}
                >
                  Masuk
                </Button>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => navigate('/auth')}
                >
                  Daftar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
