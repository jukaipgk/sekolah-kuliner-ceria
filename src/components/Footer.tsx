
import { UtensilsCrossed } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <UtensilsCrossed className="h-8 w-8 text-orange-500" />
              <span className="text-xl font-bold">Sekolah Kuliner Ceria</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Menyediakan solusi pemesanan makanan sekolah yang mudah, aman, dan terpercaya 
              untuk memenuhi kebutuhan gizi anak-anak Indonesia.
            </p>
            <p className="text-gray-400">
              © 2024 Sekolah Kuliner Ceria. Semua hak cipta dilindungi.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Menu Utama</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-orange-500 transition-colors">Beranda</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors">Menu Harian</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors">Cara Pesan</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors">Tentang Kami</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Dukungan</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-orange-500 transition-colors">Bantuan</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors">Kontak</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors">Kebijakan Privasi</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>Dibuat dengan ❤️ untuk mendukung gizi anak Indonesia</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
