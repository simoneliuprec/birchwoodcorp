export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-birchwood-green px-4">
      <div className="max-w-xl text-center">
        <h1 className="text-5xl md:text-6xl font-serif text-birchwood-gold mb-6">BW</h1>
        <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">BIRCHWOOD REAL ESTATE</h2>
        <div className="chinese text-white text-xl mb-8">云杉地产</div>
        <p className="text-lg text-birchwood-gold mb-12">
          Boutique real estate services with a personal touch.
        </p>
        <a href="/listings" className="px-6 py-3 bg-birchwood-gold text-birchwood-green rounded font-bold">View Listings</a>
      </div>
    </div>
  )
}