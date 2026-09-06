"use client";

import { Wrench, HardDrive, RefreshCw, Activity, ShieldAlert, Cpu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const servicesList = [
  { id: "repair", title: "Laptop Repair", icon: <Wrench className="w-8 h-8 mb-4" />, desc: "Screen replacement, keyboard issues, hinge repair, and motherboard servicing.", price: "Starts from ₹500" },
  { id: "ssd", title: "SSD Upgrade", icon: <HardDrive className="w-8 h-8 mb-4" />, desc: "Make your old laptop 10x faster with a high-speed Solid State Drive upgrade.", price: "Starts from ₹1500" },
  { id: "ram", title: "RAM Upgrade", icon: <Cpu className="w-8 h-8 mb-4" />, desc: "Increase memory for better multitasking and smoother performance.", price: "Starts from ₹1200" },
  { id: "os", title: "OS & Software", icon: <RefreshCw className="w-8 h-8 mb-4" />, desc: "Windows 10/11 installation, drivers update, and essential software setup.", price: "Starts from ₹300" },
  { id: "cleaning", title: "Deep Cleaning", icon: <Activity className="w-8 h-8 mb-4" />, desc: "Internal dust cleaning and thermal paste replacement to prevent overheating.", price: "Starts from ₹600" },
  { id: "data", title: "Data Recovery", icon: <ShieldAlert className="w-8 h-8 mb-4" />, desc: "Secure data backup and recovery from failing hard drives.", price: "Starts from ₹1000" },
];

const bookingSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  deviceType: z.string().min(2, "Device type is required"),
  deviceModel: z.string().optional(),
  serviceType: z.string().min(2, "Service type is required"),
  problem: z.string().min(10, "Please describe the problem"),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
});

type BookingForm = z.infer<typeof bookingSchema>;

export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
  });

  const onSubmit = async (data: BookingForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to book service");

      setIsSuccess(true);
      reset();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectService = (title: string) => {
    setSelectedService(title);
    setValue("serviceType", title);
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-white min-h-screen pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-black mb-6">Expert Computer Services</h1>
          <p className="text-zinc-500 text-lg">
            Professional repair, upgrade, and maintenance services to keep your devices running at peak performance. Fast turnaround and transparent pricing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {servicesList.map((service) => (
            <div key={service.id} className="p-8 border border-zinc-100 bg-zinc-50 hover:bg-white hover:shadow-xl transition-all flex flex-col group">
              <div className="text-zinc-400 group-hover:text-black transition-colors">{service.icon}</div>
              <h3 className="text-xl font-bold mb-3 text-black">{service.title}</h3>
              <p className="text-zinc-600 text-sm flex-grow mb-6">{service.desc}</p>
              <div className="flex items-center justify-between border-t border-zinc-200 pt-6 mt-auto">
                <span className="text-sm font-semibold text-zinc-500">{service.price}</span>
                <button onClick={() => handleSelectService(service.title)} className="text-sm font-bold text-black hover:text-zinc-500 transition-colors">
                  BOOK NOW
                </button>
              </div>
            </div>
          ))}
        </div>

        <div id="booking-form" className="max-w-3xl mx-auto bg-zinc-50 border border-zinc-100 p-8 md:p-12">
          {isSuccess ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-green-600 mb-4">Booking Received!</h2>
              <p className="text-zinc-600 mb-8">Thank you. Our technician will review your request and contact you shortly to confirm the appointment.</p>
              <button onClick={() => setIsSuccess(false)} className="bg-black text-white px-8 py-3 text-sm font-bold tracking-wide hover:bg-zinc-800 transition-colors">
                BOOK ANOTHER SERVICE
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-black mb-8">Book a Service</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Name *</label>
                    <input {...register("customerName")} className="w-full bg-white border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black" />
                    {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Phone *</label>
                    <input {...register("phone")} className="w-full bg-white border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black" />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Device Type * (e.g., Laptop, Desktop)</label>
                    <input {...register("deviceType")} className="w-full bg-white border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black" />
                    {errors.deviceType && <p className="text-red-500 text-xs mt-1">{errors.deviceType.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Service Required *</label>
                    <select {...register("serviceType")} className="w-full bg-white border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black">
                      <option value="">Select Service...</option>
                      {servicesList.map(s => <option key={s.id} value={s.title}>{s.title}</option>)}
                      <option value="Other">Other</option>
                    </select>
                    {errors.serviceType && <p className="text-red-500 text-xs mt-1">{errors.serviceType.message}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Describe the Problem *</label>
                    <textarea {...register("problem")} rows={4} className="w-full bg-white border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black" placeholder="Please describe the issue you are facing..."></textarea>
                    {errors.problem && <p className="text-red-500 text-xs mt-1">{errors.problem.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Preferred Date (Optional)</label>
                    <input type="date" {...register("preferredDate")} className="w-full bg-white border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Preferred Time (Optional)</label>
                    <input type="time" {...register("preferredTime")} className="w-full bg-white border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black" />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white px-6 py-4 text-sm font-bold tracking-wide hover:bg-zinc-800 transition-colors disabled:bg-zinc-400 mt-8"
                >
                  {isSubmitting ? "SUBMITTING..." : "CONFIRM BOOKING"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
