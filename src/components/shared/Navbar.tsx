"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Sun, Moon, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useApp, Theme } from "@/context/AppContext";
import Logo from "@/components/shared/Logo";

const links = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

const THEMES: { value: Theme; icon: typeof Sun }[] = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "contrast", icon: Eye },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { config, setTheme } = useApp();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
        scrolled ? "bg-background/90 backdrop-blur-md shadow-sm border-b border-border" : "bg-transparent"
      }`}>
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={32} />
          <span className="text-xl font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>CATS</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-deep/70 hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-0.5 bg-muted rounded-full p-1 border border-border">
            {THEMES.map(({ value, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                aria-label={value}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  config.theme === value ? "bg-primary text-white shadow-sm" : "text-foreground/50 hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
          <Button variant="ghost" className="text-deep font-medium" asChild>
            <Link href="/auth">Login</Link>
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6" asChild>
            <Link href="/onboarding">Get Started</Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-background">
            <div className="flex flex-col gap-6 pt-8">
              {links.map((l) => (
                <Link key={l.label} href={l.href} className="text-lg font-medium text-deep hover:text-primary">
                  {l.label}
                </Link>
              ))}
              <Button className="bg-primary text-white rounded-full mt-4" asChild>
                <Link href="/onboarding">Get Started</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
