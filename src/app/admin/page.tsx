"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      // Set a simple cookie or localStorage for demo purposes
      document.cookie = "adminAuth=true; path=/;";
      router.push("/admin/dashboard");
      toast.success("Welcome Admin");
    } else {
      toast.error("Invalid password");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 border border-zinc-200 max-w-sm w-full text-center">
        <Lock className="w-12 h-12 text-zinc-300 mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-2 text-black">Admin Access</h1>
        <p className="text-zinc-500 mb-8 text-sm">Restricted area for Maxx Computers staff.</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="Enter Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black text-center"
          />
          <button type="submit" className="w-full bg-black text-white px-6 py-3 text-sm font-bold hover:bg-zinc-800 transition-colors">
            LOGIN
          </button>
        </form>
      </div>
    </div>
  );
}
