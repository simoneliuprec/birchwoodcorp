import { useTranslation } from 'next-i18next';

const listings = [
  {
    id: 1,
    image: "/assets/image/listing-1.jpg",
    titleKey: "listing1Title",
    priceKey: "listing1Price",
    descKey: "listing1Desc"
  },
  {
    id: 2,
    image: "/assets/image/listing-2.jpg",
    titleKey: "listing2Title",
    priceKey: "listing2Price",
    descKey: "listing2Desc"
  },
  {
    id: 3,
    image: "/assets/image/listing-3.jpg",
    titleKey: "listing3Title",
    priceKey: "listing3Price",
    descKey: "listing3Desc"
  }
];

export default function FeaturedListings() {
  const { t } = useTranslation('common');
  return (
    <section id="listings" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-10 text-center">
          {t('featuredListings')}
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {listings.map(listing => (
            <div key={listing.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition">
              <img
                src={listing.image}
                alt={t(listing.titleKey)}
                className="w-full h-56 object-cover object-center"
              />
              <div className="p-6 flex flex-col h-full">
                <h3 className="font-semibold text-xl mb-2">{t(listing.titleKey)}</h3>
                <div className="text-birchwood-green font-bold text-lg mb-3">{t(listing.priceKey)}</div>
                <p className="text-gray-700 flex-1">{t(listing.descKey)}</p>
                <a
                  href="#"
                  className="mt-6 inline-block px-6 py-2 bg-birchwood-gold text-birchwood-green font-bold rounded hover:bg-yellow-400 transition"
                >
                  {t('viewDetails')}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}