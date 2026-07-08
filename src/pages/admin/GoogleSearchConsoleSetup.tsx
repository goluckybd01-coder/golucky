import { ExternalLink, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

const SITE_URL = "https://goluckybd.com/";
const SITEMAP_URL = "https://goluckybd.com/sitemap.xml";
const GSC_URL = `https://search.google.com/search-console?resource_id=${encodeURIComponent(SITE_URL)}`;
const GSC_ADD_PROPERTY = "https://search.google.com/search-console/welcome";

const steps = [
  {
    title: "1. Authorize Google Search Console in Lovable",
    body: (
      <>
        Open the Lovable Connectors panel, find <strong>Google Search Console</strong>, and click{" "}
        <strong>Connect</strong>. Sign in with the Google account that owns (or will own) the
        property for <code>goluckybd.com</code> and approve the requested scopes.
      </>
    ),
    action: { label: "Open Lovable Connector Settings", href: "https://lovable.dev/settings/connectors" },
  },
  {
    title: "2. Add the property in Google Search Console",
    body: (
      <>
        In Search Console, add a new <strong>URL prefix</strong> property using the exact value{" "}
        <code>{SITE_URL}</code>. The META verification tag is already embedded in the deployed
        site, so verification should succeed immediately.
      </>
    ),
    action: { label: "Open Search Console", href: GSC_ADD_PROPERTY },
  },
  {
    title: "3. Submit the sitemap",
    body: (
      <>
        Once verified, open <strong>Indexing → Sitemaps</strong> and submit:
        <code className="ml-2">{SITEMAP_URL}</code>
      </>
    ),
    action: { label: "Open Property Dashboard", href: GSC_URL },
  },
];

export default function GoogleSearchConsoleSetup() {
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="container mx-auto max-w-3xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Google Search Console Setup</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Approve the OAuth flow and finish wiring Search Console for {SITE_URL}.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authorization required</AlertTitle>
        <AlertDescription>
          The OAuth connection was previously declined. Re-run the steps below in order — step 1
          must succeed before sitemap submission will work.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {steps.map((step) => (
          <Card key={step.title}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {step.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground leading-relaxed">{step.body}</p>
              <Button asChild size="sm" variant="outline">
                <a href={step.action.href} target="_blank" rel="noopener noreferrer">
                  {step.action.label}
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[
            { label: "Site URL", value: SITE_URL },
            { label: "Sitemap URL", value: SITEMAP_URL },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-2 rounded-md border p-2">
              <div>
                <div className="text-xs text-muted-foreground">{row.label}</div>
                <code className="text-xs">{row.value}</code>
              </div>
              <Button size="sm" variant="ghost" onClick={() => copy(row.value)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
