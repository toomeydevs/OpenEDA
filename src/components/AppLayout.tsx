import { Link, useLocation } from "react-router-dom";
import { Upload, BarChart3, Eye, FileText, Database, Menu, X, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useData } from "@/context/DataContext";
import { useState } from "react";
import { useTheme } from "next-themes";
import { AISettingsDialog } from "./AISettingsDialog";

const navItems = [
  { path: "/", label: "Upload", icon: Upload },
  { path: "/overview", label: "Overview", icon: Eye },
  { path: "/visualize", label: "Visualize", icon: BarChart3 },
  { path: "/report", label: "Report", icon: FileText },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { dataset, fileName } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const renderNavItem = (item: typeof navItems[0], onClick?: () => void) => {
    const isActive = location.pathname === item.path;
    const isDisabled = item.path !== "/" && !dataset;
    const Icon = item.icon;

    if (isDisabled) {
      return (
        <span
          key={item.path}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground/50 cursor-not-allowed"
        >
          <Icon className="h-4 w-4" />
          {item.label}
        </span>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={onClick}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
      >
        <Icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen gradient-surface">
      <header className="sticky top-0 z-50 glass">
        <div className="container flex h-14 sm:h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg gradient-hero">
              <Database className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <span className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
              Open<span className="text-primary">EDA</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => renderNavItem(item))}
          </nav>

          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 hidden dark:block" />
              <Moon className="h-4 w-4 block dark:hidden" />
            </button>

            {/* AI Settings */}
            <AISettingsDialog />

            {/* Mobile menu button */}
            <button
              className="sm:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-border bg-card/95 backdrop-blur-md px-4 py-2 space-y-1">
            {navItems.map((item) => renderNavItem(item, () => setMobileMenuOpen(false)))}
          </div>
        )}
      </header>

      {dataset && fileName && (
        <div className="border-b border-border bg-card/50">
          <div className="container flex h-9 sm:h-10 items-center gap-2 text-xs sm:text-sm text-muted-foreground overflow-x-auto">
            <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
            <span className="font-mono text-xs truncate">{fileName}</span>
            <span className="text-muted-foreground/50">•</span>
            <span className="whitespace-nowrap">{dataset.rows.toLocaleString()} rows × {dataset.columns} columns</span>
          </div>
        </div>
      )}

      <main className="container py-4 sm:py-8 px-3 sm:px-4">{children}</main>
    </div>
  );
}
