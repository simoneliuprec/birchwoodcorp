export default function AboutContact() {
  return (
    <div className="min-h-screen bg-white text-birchwood-green px-4 py-10">
      <h1 className="text-4xl font-serif mb-8 text-center">About & Contact</h1>
      <div className="max-w-lg mx-auto">
        <p className="mb-6">
          Birchwood Real Estate is a boutique agency dedicated to exceptional service in residential and commercial real estate.
        </p>
        <p>Email: <a href="mailto:info@birchwoodcorp.com" className="text-birchwood-gold">info@birchwoodcorp.com</a></p>
        <p>Phone: <span className="text-birchwood-gold">Your Number Here</span></p>
      </div>
    </div>
  )
}