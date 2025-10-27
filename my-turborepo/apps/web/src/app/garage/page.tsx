export default function Garage() {
  return (
    <section className="relative py-12 bg-black min-h-screen">
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
      >
        <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
        <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
      </div>

      <div className="relative container px-4 md:px-6 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Garage</h1>
          <p className="text-xl text-gray-300">Here's your garage</p>
        </div>
      </div>
    </section>
  );
}
