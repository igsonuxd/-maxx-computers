"use client";

import { MapPin, Phone, Mail, Clock, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const enquirySchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  type: z.enum(["GENERAL ENQUIRY", "WHOLESALE ENQUIRY", "BUY LAPTOP"]),
  message: z.string().min(10, "Please provide more details"),
});

type EnquiryForm = z.infer<typeof enquirySchema>;

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EnquiryForm>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { type: "GENERAL ENQUIRY" }
  });

  const onSubmit = async (data: EnquiryForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to send enquiry");

      toast.success("Enquiry sent successfully. We'll contact you soon.");
      reset();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-black mb-6">Contact Us</h1>
          <p className="text-zinc-500 text-lg">
            Whether you're looking for a single laptop, bulk orders for your office, or need expert repairs, we're here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Info */}
          <div>
            <div className="bg-zinc-50 border border-zinc-100 p-8 md:p-12 h-full">
              <h2 className="text-2xl font-bold text-black mb-8">Get in Touch</h2>
              
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-zinc-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-black mb-1">Store Address</h3>
                    <p className="text-zinc-600 leading-relaxed">
                      Maxx Computers<br/>
                      #248, 1st Floor, 2nd Cross,<br/>
                      Behind Agarwal Bhavan,<br/>
                      T. Dasarahalli, Bengaluru 560057
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Phone className="w-6 h-6 text-zinc-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-black mb-1">Phone Numbers</h3>
                    <p className="text-zinc-600">+91 831 739 9090<br/>080 8818 9878</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Clock className="w-6 h-6 text-zinc-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-black mb-1">Business Hours</h3>
                    <p className="text-zinc-600">Monday - Saturday: 10:00 AM - 8:30 PM<br/>Sunday: Closed</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-zinc-200">
                <a href="https://wa.me/918317399090" target="_blank" rel="noopener noreferrer" className="w-full bg-green-600 text-white px-6 py-4 text-sm font-bold tracking-wide hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>CHAT ON WHATSAPP</span>
                </a>
              </div>
            </div>
          </div>

          {/* Form */}
          <div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Enquiry Type *</label>
                <select {...register("type")} className="w-full bg-white border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black">
                  <option value="GENERAL ENQUIRY">General Enquiry</option>
                  <option value="WHOLESALE ENQUIRY">Wholesale / Bulk Order Enquiry</option>
                  <option value="BUY LAPTOP">Looking to Buy a Laptop</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Name *</label>
                  <input {...register("name")} className="w-full bg-white border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Phone *</label>
                  <input {...register("phone")} className="w-full bg-white border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Email (Optional)</label>
                <input type="email" {...register("email")} className="w-full bg-white border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black" />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Message *</label>
                <textarea {...register("message")} rows={5} className="w-full bg-white border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black" placeholder="How can we help you?"></textarea>
                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white px-6 py-4 text-sm font-bold tracking-wide hover:bg-zinc-800 transition-colors disabled:bg-zinc-400"
              >
                {isSubmitting ? "SENDING..." : "SEND MESSAGE"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
