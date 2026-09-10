import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Wrench,
  Package,
  Laptop,
} from "lucide-react";
import Laptop3DWrapper from "@/components/Laptop3DWrapper";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* HERO */}
      <section className="relative overflow-hidden bg-black text-white pt-10 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div className="z-10">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight mb-6">
                PREMIUM COMPUTING.
                <br />
                <span className="text-zinc-400">
                  SMARTER VALUE.
                </span>
              </h1>

              <p className="text-lg md:text-xl text-zinc-400 mb-8 max-w-lg leading-relaxed">
                Professionally refurbished laptops, business-grade machines
                and reliable computer services from Maxx Computers.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">

                <Link
                  href="/laptops"
                  className="bg-white text-black px-8 py-4 text-sm font-semibold tracking-wide hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                >
                  <span>SHOP LAPTOPS</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/services"
                  className="border border-zinc-800 text-white px-8 py-4 text-sm font-semibold tracking-wide hover:bg-zinc-900 transition-colors flex items-center justify-center"
                >
                  BOOK A SERVICE
                </Link>

              </div>
            </div>

            <div className="relative h-full min-h-[400px]">
              <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent z-10 pointer-events-none" />

              <Laptop3DWrapper />
            </div>

          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="bg-white py-16 border-b border-zinc-100">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">

            <div>
              <div className="text-3xl md:text-4xl font-bold text-black mb-2">
                4.8/5
              </div>

              <div className="text-sm text-zinc-500 font-medium">
                Google Rating
              </div>
            </div>

            <div>
              <div className="text-3xl md:text-4xl font-bold text-black mb-2">
                25+
              </div>

              <div className="text-sm text-zinc-500 font-medium">
                Customer Reviews
              </div>
            </div>

            <div>
              <div className="text-3xl md:text-4xl font-bold text-black mb-2 flex justify-center">
                <ShieldCheck className="w-10 h-10" />
              </div>

              <div className="text-sm text-zinc-500 font-medium">
                Warranty Available
              </div>
            </div>

            <div>
              <div className="text-3xl md:text-4xl font-bold text-black mb-2 flex justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="text-sm text-zinc-500 font-medium">
                Professionally Checked
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SHOP BY BRAND */}
      <section className="py-24 bg-zinc-50">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-16">

            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-black">
              Shop By Brand
            </h2>

            <p className="text-zinc-500">
              Business-grade machines from the world&apos;s leading manufacturers.
            </p>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            <Link
              href="/laptops?brand=DELL"
              className="group relative bg-white p-12 border border-zinc-100 flex flex-col items-center justify-center overflow-hidden hover:shadow-2xl transition-all duration-500"
            >

              <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />

              <h3 className="text-4xl font-black text-black group-hover:text-white relative z-10 transition-colors duration-500">
                DELL
              </h3>

              <p className="mt-4 text-sm text-zinc-500 group-hover:text-zinc-400 relative z-10 transition-colors duration-500">
                Latitude Series
              </p>

            </Link>

            <Link
              href="/laptops?brand=LENOVO"
              className="group relative bg-white p-12 border border-zinc-100 flex flex-col items-center justify-center overflow-hidden hover:shadow-2xl transition-all duration-500"
            >

              <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />

              <h3 className="text-4xl font-black text-black group-hover:text-white relative z-10 transition-colors duration-500">
                LENOVO
              </h3>

              <p className="mt-4 text-sm text-zinc-500 group-hover:text-zinc-400 relative z-10 transition-colors duration-500">
                ThinkPad Series
              </p>

            </Link>

          </div>

        </div>
      </section>

      {/* SERVICES */}
      <section className="py-24 bg-white border-b border-zinc-100">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col md:flex-row justify-between items-end mb-16">

            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-black">
                Professional Services
              </h2>

              <p className="text-zinc-500 max-w-lg">
                Expert repairs and upgrades to keep your devices running at
                peak performance.
              </p>
            </div>

            <Link
              href="/services"
              className="mt-6 md:mt-0 text-sm font-semibold hover:text-zinc-600 transition-colors flex items-center gap-2 border-b border-black pb-1"
            >
              <span>VIEW ALL SERVICES</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {[
              {
                title: "Laptop Repair",
                icon: <Wrench className="w-6 h-6 mb-4" />,
                desc: "Motherboard, screen, keyboard, and hinge repairs.",
              },
              {
                title: "Hardware Upgrades",
                icon: <Package className="w-6 h-6 mb-4" />,
                desc: "SSD and RAM upgrades for faster performance.",
              },
              {
                title: "Software Installation",
                icon: <Laptop className="w-6 h-6 mb-4" />,
                desc: "Windows, MS Office, and drivers installation.",
              },
            ].map((service, idx) => (

              <div
                key={idx}
                className="p-8 border border-zinc-100 bg-zinc-50 hover:bg-white hover:shadow-lg transition-all"
              >

                {service.icon}

                <h3 className="text-xl font-bold mb-3">
                  {service.title}
                </h3>

                <p className="text-zinc-600 text-sm">
                  {service.desc}
                </p>

              </div>

            ))}

          </div>
        </div>
      </section>

      {/* LOCATION */}
      <section className="py-24 bg-black text-white">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

            {/* ADDRESS */}
            <div>

              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">
                Visit Our Store
              </h2>

              <div className="space-y-6 text-zinc-400">

                <p className="text-lg">

                  <strong className="text-white block mb-2">
                    Maxx Computers
                  </strong>

                  #248, 1st Floor, 2nd Cross,
                  <br />
                  Behind Agarwal Bhavan,
                  <br />
                  T. Dasarahalli, Bengaluru,
                  <br />
                  Karnataka 560057

                </p>

                <div>

                  <strong className="text-white block mb-2">
                    Contact
                  </strong>

                  +91 831 739 9090
                  <br />
                  080 8818 9878

                </div>

                <div className="pt-8 flex flex-wrap gap-4">

                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Maxx+Computers+T.+Dasarahalli+Bengaluru"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-zinc-200 transition-colors"
                  >
                    GET DIRECTIONS
                  </a>

                  <a
                    href="https://wa.me/918317399090"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-zinc-700 text-white px-6 py-3 text-sm font-semibold hover:bg-zinc-900 transition-colors"
                  >
                    WHATSAPP US
                  </a>

                </div>

              </div>

            </div>

            {/* GOOGLE MAP */}
            <div className="h-[400px] bg-zinc-900 overflow-hidden relative">

              <iframe
                title="Maxx Computers Location"
                src="https://www.google.com/maps?q=Maxx%20Computers%20T.%20Dasarahalli%20Bengaluru%20Karnataka%20560057&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
              />

            </div>

          </div>

        </div>
      </section>

    </div>
  );
}