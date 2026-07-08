import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Home as HomeIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const AdminUniversalNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!location.pathname.startsWith("/admin")) return null;
  if (/^\/admin\/(login|register)/.test(location.pathname)) return null;

  const segments = location.pathname
    .replace(/^\/admin\/?/, "")
    .split("/")
    .filter(Boolean);

  return (
    <div className="sticky top-0 z-[60] w-full border-b border-slate-700/60 bg-slate-950/85 backdrop-blur-md">
      <div className="flex items-center gap-2 px-3 py-2 flex-wrap">
        <Button
          aria-label="Go back"
          variant="outline"
          size="sm"
          onClick={() =>
            window.history.length > 1 ? navigate(-1) : navigate("/admin/dashboard")
          }
          className="h-8 border-slate-600 text-slate-200 hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button
          aria-label="Go to admin dashboard"
          variant="outline"
          size="sm"
          onClick={() => navigate("/admin/dashboard")}
          className="h-8 border-slate-600 text-slate-200 hover:bg-slate-800"
        >
          <HomeIcon className="h-4 w-4 mr-1" /> Dashboard
        </Button>
        <nav aria-label="Breadcrumb" className="ml-1 flex items-center text-xs text-slate-400 overflow-hidden">
          <button onClick={() => navigate("/admin/dashboard")} className="hover:text-white truncate">
            Admin
          </button>
          {segments.map((seg, i) => {
            const to = "/admin/" + segments.slice(0, i + 1).join("/");
            const label = seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            const last = i === segments.length - 1;
            return (
              <span key={to} className="flex items-center">
                <ChevronRight className="h-3 w-3 mx-1 opacity-60" />
                <button
                  onClick={() => navigate(to)}
                  className={cn("hover:text-white truncate", last && "text-white font-medium")}
                >
                  {label}
                </button>
              </span>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AdminUniversalNav;
