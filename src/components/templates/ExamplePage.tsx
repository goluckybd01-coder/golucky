import PageScaffold from "@/components/templates/PageScaffold";

/**
 * Example page built on PageScaffold.
 * Copy this file, rename, tweak metadata, then register the route in src/App.tsx:
 *
 *   import ExamplePage from "@/pages/ExamplePage";
 *   <Route path="/example" element={<ExamplePage />} />
 *
 * For auth-only routes wrap the element with <AuthGuard>.
 * For admin/desktop-full-width routes pass fullWidth to PageScaffold.
 */
export default function ExamplePage() {
  return (
    <PageScaffold
      title="Example Page | GoLucky"
      description="Short, keyword-rich description under 160 chars."
      canonicalPath="/example"
    >
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Example Page</h1>
        <p className="text-muted-foreground">Replace with real content.</p>
      </div>
    </PageScaffold>
  );
}
