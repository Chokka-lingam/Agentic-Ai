import Navbar from "@/components/NavBar";

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full text-white">
      <Navbar />

      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/BGCoverPic.png')",
        }}
      />

      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col justify-center px-10 md:px-24 lg:w-1/2">
        <p className="mb-6 text-lg font-light tracking-wide">AGENTIC AI</p>

        <h1 className="mb-6 text-5xl font-light md:text-7xl tracking-wide">
          COMING SOON...
        </h1>

        <p className="mb-10 max-w-lg text-lg">Page under construction</p>

        <p className="mt-12 text-sm text-gray-300">
          ©AgenticAI. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
