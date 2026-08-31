import { notFound } from "next/navigation";
import Image from "next/image";
import { Screen } from "@/components/brand/Screen";
import { Button } from "@/components/ui/Button";
import { getStationArticle, STATION_ARTICLE_SLUGS } from "@/lib/content/station-articles";
import { parseArticleBody } from "@/lib/content/article-body";
import { getStationBySlug } from "@/lib/data/stations";
import { getStationPublicMediaUrl } from "@/lib/media/public-url";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function generateStaticParams() {
  return STATION_ARTICLE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fallback = getStationArticle(slug);
  if (!fallback) return { title: "התחנה אינה זמינה" };
  const station = await getStationBySlug(slug);

  const seoTitle = station?.articleSeoTitle || fallback.seoTitle;
  const metaDescription = station?.articleMetaDescription || fallback.metaDescription;
  const keywords = station?.articleKeywords
    ? station.articleKeywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [fallback.focusKeyphrase, ...fallback.secondaryKeyphrases];
  const heroImageUrl = getStationPublicMediaUrl(station?.heroImagePath ?? null);

  return {
    title: seoTitle,
    description: metaDescription,
    keywords,
    alternates: { canonical: `/places/${slug}` },
    openGraph: {
      title: seoTitle,
      description: metaDescription,
      url: `${SITE_URL}/places/${slug}`,
      type: "article",
      ...(heroImageUrl && { images: [{ url: heroImageUrl }] }),
    },
  };
}

export default async function StationArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fallback = getStationArticle(slug);
  if (!fallback) notFound();

  const station = await getStationBySlug(slug);

  const heading = station?.articleHeading || fallback.heading;
  const duration = station?.articleDuration || fallback.duration;
  const location = station?.address || fallback.location;
  const sections = station?.articleBody ? parseArticleBody(station.articleBody) : fallback.sections;
  const heroImageUrl = getStationPublicMediaUrl(station?.heroImagePath ?? null);

  const article = { ...fallback, heading, duration, location, sections };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: article.heading,
    description: article.metaDescription,
    url: `${SITE_URL}/places/${slug}`,
    ...(station?.address && { address: station.address }),
    ...(station?.latitude != null &&
      station?.longitude != null && {
        geo: { "@type": "GeoCoordinates", latitude: station.latitude, longitude: station.longitude },
      }),
    ...(heroImageUrl && { image: heroImageUrl }),
  };

  return (
    <Screen className="gap-6" wide>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {heroImageUrl && (
        <div className="relative -mx-6 sm:mx-0 aspect-[16/9] w-[calc(100%+3rem)] sm:w-full overflow-hidden rounded-none sm:rounded-3xl">
          <Image
            src={heroImageUrl}
            alt={article.heading}
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      )}

      <header className="pt-4">
        {station && (
          <p className="text-xs font-bold tracking-wide text-gold uppercase">
            תחנה {station.orderIndex} במסלול סיורי הסליחות בירושלים
          </p>
        )}
        <h1 className="mt-2 font-heading text-2xl md:text-4xl font-bold leading-tight text-white">
          {article.heading}
        </h1>
        <div className="mt-4 flex flex-col gap-1 text-sm text-muted">
          <p>
            <span className="text-white font-semibold">מיקום:</span> {article.location}
          </p>
          <p>
            <span className="text-white font-semibold">משך ביקור מומלץ:</span> {article.duration}
          </p>
        </div>
      </header>

      <article className="flex flex-col gap-6">
        {article.sections.map((section, i) => (
          <section key={section.heading ?? i} className="flex flex-col gap-2">
            {section.heading && (
              <h2 className="font-heading text-lg md:text-xl font-bold text-white">{section.heading}</h2>
            )}
            {section.paragraphs.map((p, j) => (
              <p key={j} className="text-sm md:text-base text-muted leading-relaxed whitespace-pre-line">
                {p}
              </p>
            ))}
          </section>
        ))}
      </article>

      <div className="flex flex-col gap-3 pt-2">
        <Button href="/start" size="lg" fullWidth className="pulse-cta">
          יוצאים לסיור הסליחות
        </Button>
        <Button href="/info" variant="ghost" fullWidth>
          כל התחנות והמידע על הסיור
        </Button>
      </div>
    </Screen>
  );
}
