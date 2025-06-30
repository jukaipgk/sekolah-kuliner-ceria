
import { Button } from "@/components/ui/button";
import { CalendarCheck, Users, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Pesan Makanan
            <span className="block text-orange-500">Sekolah dengan Mudah</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Sistem pemesanan makanan sekolah yang memudahkan orang tua untuk memesan 
            makanan bergizi untuk anak-anak mereka. Praktis, aman, dan terpercaya.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg"
              onClick={() => navigate('/auth')}
            >
              <CalendarCheck className="mr-2 h-5 w-5" />
              Mulai Pesan Sekarang
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-orange-200 text-orange-600 hover:bg-orange-50 px-8 py-3 text-lg"
              onClick={() => navigate('/auth')}
            >
              <Users className="mr-2 h-5 w-5" />
              Daftar sebagai Orang Tua
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UtensilsCrossed className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Menu Bergizi</h3>
              <p className="text-gray-600">Menu makanan sehat dan bergizi yang disiapkan khusus untuk anak sekolah</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarCheck className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pesan Mudah</h3>
              <p className="text-gray-600">Sistem pemesanan yang mudah dengan jadwal yang fleksibel</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Terpercaya</h3>
              <p className="text-gray-600">Dipercaya oleh ribuan orang tua untuk memenuhi kebutuhan makan anak</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
