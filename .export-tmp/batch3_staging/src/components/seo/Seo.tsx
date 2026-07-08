import { Helmet } from "react-helmet-async";

type SeoProps = {
  title: string;
  description: string;
  path: string; // e.g. "/about"
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

const BASE_URL = "https://goluckybd.com";
const SLOGAN = "🚀 Play. Invest. Earn.";

const withSlogan = (text: string) =>
  text.includes(SLOGAN) ? text : `${text.replace(/\s+$/, "")} — ${SLOGAN}`;

export default function Seo({ title, description, path, jsonLd }: SeoProps) {
  const url = `${BASE_URL}${path}`;
  const ogTitle = withSlogan(title);
  const ogDescription = withSlogan(description);
  const ldArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />

      {ldArray.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
}
