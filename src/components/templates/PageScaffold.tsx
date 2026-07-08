import { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import MobileContainer from "@/components/MobileContainer";

export interface PageScaffoldProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogImage?: string;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

const SITE_URL = "https://goluckybd.com";

export default function PageScaffold({
  title,
  description,
  canonicalPath,
  ogImage,
  fullWidth = false,
  className = "",
  children,
}: PageScaffoldProps) {
  const url = canonicalPath ? `${SITE_URL}${canonicalPath}` : undefined;

  const head = (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {url && <link rel="canonical" href={url} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {url && <meta property="og:url" content={url} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Helmet>
  );

  const body = (
    <main className={`min-h-screen bg-background text-foreground ${className}`}>
      {children}
    </main>
  );

  return (
    <>
      {head}
      {fullWidth ? body : <MobileContainer>{body}</MobileContainer>}
    </>
  );
}
