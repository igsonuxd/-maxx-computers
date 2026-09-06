import Link from "next/link";
import { Phone, MapPin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-16 pb-8 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
          
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="font-bold text-2xl tracking-tighter inline-block mb-4">
              MAXX<span className="text-zinc-500 font-light">COMPUTERS</span>
            </Link>
            <p className="text-zinc-400 text-sm mb-2">ಮ್ಯಾಕ್ಸ ಕಂಪ್ಯೂಟರ್ಸ್</p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Premium refurbished laptops, professional computer services, and reliable upgrades in Bengaluru.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4 text-zinc-100">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-zinc-400 hover:text-white transition-colors text-sm">Home</Link></li>
              <li><Link href="/laptops" className="text-zinc-400 hover:text-white transition-colors text-sm">Laptops</Link></li>
              <li><Link href="/services" className="text-zinc-400 hover:text-white transition-colors text-sm">Services</Link></li>
              <li><Link href="/contact" className="text-zinc-400 hover:text-white transition-colors text-sm">Contact & Wholesale</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4 text-zinc-100">Services</h4>
            <ul className="space-y-3 text-zinc-400 text-sm">
              <li>Laptop Repair</li>
              <li>SSD & RAM Upgrades</li>
              <li>Windows Installation</li>
              <li>Hardware Diagnostics</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4 text-zinc-100">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3 text-sm text-zinc-400">
                <MapPin className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" />
                <span>#248, 1st Floor, 2nd Cross,<br/>Behind Agarwal Bhavan,<br/>T. Dasarahalli, Bengaluru 560057</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-zinc-400">
                <Phone className="w-5 h-5 text-zinc-500" />
                <span>+91 831 739 9090<br/>080 8818 9878</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-zinc-400">
                <Mail className="w-5 h-5 text-zinc-500" />
                <span>info@maxxcomputers.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Maxx Computers. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="#" className="hover:text-zinc-300">Privacy Policy</Link>
            <Link href="#" className="hover:text-zinc-300">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
