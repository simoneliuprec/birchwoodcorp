import Link from 'next/link';
import Image from 'next/image';

export type PropertyCardProps = {
  href: string;
  imageUrl: string | null;
  title: string;
  subtitle?: string;
  price: string;
  meta?: string[];
  badge?: string | null;
};

export default function PropertyCard({
  href,
  imageUrl,
  title,
  subtitle,
  price,
  meta,
  badge,
}: PropertyCardProps) {
  const safeSrc = imageUrl || '/placeholder.jpg';
  const metaItems = Array.isArray(meta) ? meta : [];

  return (
    <article className="rounded-2xl shadow bg-gray-light overflow-hidden hover:shadow-lg transition">
      <Link href={href} className="block group" prefetch={false}>
        {/* Intrinsic image, sized via CSS only (no fill) */}
        <div className="overflow-hidden">
          <Image
            src={safeSrc}
            alt={title}
            width={1600}
            height={900}
            className="block w-full h-[180px] sm:h-[190px] md:h-[200px] lg:h-[210px] object-cover"
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
          />
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-1 text-rich-black group-hover:text-birchwood-green">{title}</h3>
            {badge && (
              <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-birchwood-green font-medium">
                {badge}
              </span>
            )}
          </div>

          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
          {metaItems.length > 0 && (
          <p className="text-gray-600 text-sm mt-1">{metaItems.join(' • ')}</p>)}
          <p className="mt-1 font-bold">{price}</p>
        </div>
      </Link>
    </article>
  );
}
