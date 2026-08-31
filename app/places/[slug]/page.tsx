import { notFound } from "next/navigation";
import { Screen } from "@/components/brand/Screen";
import { Button } from "@/components/ui/Button";
import { getStationArticle, STATION_ARTICLE_SLUGS } from "@/lib/content/station-articles";
import { getStationBySlug } from "@/lib/data/stations";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function generateStaticParams() {
  return STATION_ARTICLE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getStationArticle(slug);
  if (!article) return { title: "התחנה אינה זמינה" };

  return {
    title: article.seoTitle,
    description: article.metaDescription,
    keywords: [article.focusKeyphrase, ...article.secondaryKeyphrases],
    alternates: { canonical: `/places/${slug}` },
    openGraph: {
      title: article.seoTitle,
      description: article.metaDescription,
      url: `${SITE_URL}/places/${slug}`,
      type: "article",
    },
  };
}

export default async function StationArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getStationArticle(slug);
  if (!article) notFound();

  const station = await getStationBySlug(slug);

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
  };

  return (
    <Screen className="gap-6" wide>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

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
