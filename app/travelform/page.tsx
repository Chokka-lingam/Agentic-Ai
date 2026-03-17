"use client";

import Navbar from "@/components/NavBar";
import TravelForm from "@/components/TravelForm";
import { useRouter } from "next/navigation";

export default function TravelFormPage() {
  const router = useRouter();

  async function signout() {
    await fetch("/api/signout", {
      method: "POST",
    });

    router.push("/signin");
  }

  return (
    <main>
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-end">
          <button
            onClick={signout}
            className=" mt-6 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Logout
          </button>
        </div>
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            AI Travel Guide Agent
          </h1>
          <p className="mt-2 text-slate-600">
            Build an intelligent trip plan with itinerary, hotels, food,
            transport, budget, and safety tips.
          </p>
        </header>
        <TravelForm />
      </div>
    </main>
  );
}
