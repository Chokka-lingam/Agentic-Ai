import TravelForm from "@/components/TravelForm";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          AI Travel Guide Agent
        </h1>
        <p className="mt-2 text-slate-600">
          Build an intelligent trip plan with itinerary, hotels, food, transport, budget, packing tips, and safety notes.
        </p>
        <p className="mt-1 text-sm text-slate-500">For reliability, each request supports up to 14 trip days.</p>
      </header>
      <TravelForm />
    </main>
  );
}
