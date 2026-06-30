import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Leaf, Drumstick, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import menuData from "@/data/menu.json";
import { site, type MenuCategory } from "@/data/content";
import { CtaBand } from "@/components/site/ui";
import { breadcrumbLd } from "@/lib/seo";

const categories = menuData as MenuCategory[];

const NONVEG = /chicken|mutton|fish|prawn|egg|lamb|keema|kheema|murg|tangri|lollipop|kalami|drumstick|seekh|tikka chicken|chick /i;
function isNonVeg(name: string, cat: string) {
  if (/non-?veg/i.test(cat)) return true;
  if (/^(veg|tandoori veg|chinese veg)/i.test(cat)) return NONVEG.test(name);
  return NONVEG.test(name);
}

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Our Menu — Nice Hotel And Restaurant, Mansa" },
      { name: "description", content: "Explore 300+ dishes across 19 categories at Nice Hotel And Restaurant, Mansa — beverages, soups, tandoori, main course, breads, desserts and more." },
      { property: "og:title", content: "Our Restaurant Menu" },
      { property: "og:url", content: "/menu" },
      { property: "og:image", content: site.images.dining },
      { name: "twitter:image", content: site.images.dining },
    ],
    links: [{ rel: "canonical", href: "/menu" }],
    scripts: [
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "Menu", path: "/menu" }]),
      {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org", "@type": "Menu", name: "Nice Hotel And Restaurant Menu",
        hasMenuSection: categories.map((c) => ({
          "@type": "MenuSection", name: c.category,
          hasMenuItem: c.items.map((i) => ({ "@type": "MenuItem", name: i.name, offers: { "@type": "Offer", price: i.price.replace(/[^\d|]/g, ""), priceCurrency: "INR" } })),
        })),
      }),
      },
    ],
  }),
  component: Menu,
});

function Menu() {
  // Page 0 = cover, pages 1..N = categories, last page = info/back-cover
  const totalPages = categories.length + 2;
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);

  const go = (next: number) => {
    if (next < 0 || next >= totalPages) return;
    setDir(next > page ? 1 : -1);
    setPage(next);
  };

  const cat = useMemo<MenuCategory | null>(
    () => (page >= 1 && page <= categories.length ? categories[page - 1] : null),
    [page]
  );

  const variants = {
    enter: (d: number) => ({ rotateY: d > 0 ? -75 : 75, opacity: 0, transformOrigin: d > 0 ? "left center" : "right center" }),
    center: { rotateY: 0, opacity: 1 },
    exit: (d: number) => ({ rotateY: d > 0 ? 75 : -75, opacity: 0, transformOrigin: d > 0 ? "right center" : "left center" }),
  };

  return (
    <section className="relative overflow-hidden bg-charcoal py-12 md:py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ backgroundImage: `url(${site.images.dining})`, backgroundSize: "cover", backgroundPosition: "center" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/80 via-charcoal/90 to-charcoal" aria-hidden />

      <div className="container-luxe relative">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-gold">Fine Dining</p>
          <h1 className="mt-2 font-display text-4xl text-ivory md:text-5xl">The Menu Book</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ivory/60">Flip through every page — {categories.length} chapters, 300+ dishes.</p>
        </div>

        {/* Book */}
        <div className="mx-auto max-w-4xl" style={{ perspective: "2000px" }}>
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-r-2xl rounded-l-md border border-gold/30 bg-ivory shadow-[0_40px_120px_-20px_rgba(0,0,0,0.7)] md:aspect-[4/3]">
            {/* spine */}
            <div className="absolute inset-y-0 left-0 z-20 w-3 bg-gradient-to-r from-charcoal/40 to-transparent" aria-hidden />

            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={page}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0"
                style={{ transformStyle: "preserve-3d" }}
              >
                {page === 0 ? (
                  <CoverPage />
                ) : cat ? (
                  <CategoryPage cat={cat} index={page} total={categories.length} />
                ) : (
                  <InfoPage />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => go(page - 1)}
              disabled={page === 0}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/50 text-gold transition hover:bg-gold hover:text-charcoal disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-[90px] text-center text-sm tracking-widest text-ivory/70">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => go(page + 1)}
              disabled={page === totalPages - 1}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/50 text-gold transition hover:bg-gold hover:text-charcoal disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Chapter jump */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => go(0)}
              className={`rounded-full border px-3 py-1 text-xs transition ${page === 0 ? "border-gold bg-gold text-charcoal" : "border-ivory/25 text-ivory/70 hover:border-gold"}`}
            >
              Cover
            </button>
            {categories.map((c, i) => (
              <button
                key={c.category}
                onClick={() => go(i + 1)}
                className={`rounded-full border px-3 py-1 text-xs transition ${page === i + 1 ? "border-gold bg-gold text-charcoal" : "border-ivory/25 text-ivory/70 hover:border-gold"}`}
              >
                {c.category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-16">
        <CtaBand title="Reserve Your Table" sub="Book your stay now and enjoy world-class hospitality at Nice Hotel" image={site.images.dining} />
      </div>
    </section>
  );
}

function CoverPage() {
  return (
    <div className="relative flex h-full flex-col items-center justify-center text-center">
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `url(${site.images.dining})`, backgroundSize: "cover", backgroundPosition: "center" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-charcoal/55" aria-hidden />
      <div className="relative px-8">
        <BookOpen className="mx-auto h-10 w-10 text-gold" />
        <p className="mt-4 text-xs uppercase tracking-[0.4em] text-gold">Nice Hotel &amp; Restaurant</p>
        <h2 className="mt-3 font-display text-5xl text-ivory md:text-6xl">À La Carte</h2>
        <p className="mx-auto mt-4 max-w-sm text-sm text-ivory/80">Authentic flavours crafted with passion. Turn the page to begin.</p>
        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-ivory/60">Mansa, Punjab</p>
      </div>
    </div>
  );
}

function CategoryPage({ cat, index, total }: { cat: MenuCategory; index: number; total: number }) {
  return (
    <div className="flex h-full flex-col bg-ivory px-7 py-8 md:px-12 md:py-10">
      <div className="flex items-end justify-between border-b border-gold/40 pb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Chapter {index} of {total}</p>
          <h2 className="font-display text-3xl text-charcoal md:text-4xl">{cat.category}</h2>
        </div>
        <span className="text-xs uppercase tracking-[0.2em] text-gold">{cat.items.length} dishes</span>
      </div>
      <div className="mt-5 grid flex-1 grid-cols-1 gap-x-10 gap-y-3 overflow-y-auto pr-1 md:grid-cols-2 [scrollbar-width:thin]">
        {cat.items.map((it, i) => {
          const nv = isNonVeg(it.name, cat.category);
          return (
            <div key={it.name + i} className="flex items-baseline gap-2">
              <span className={`mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border ${nv ? "border-red-700 text-red-700" : "border-green-700 text-green-700"}`} aria-label={nv ? "Non-vegetarian" : "Vegetarian"}>
                {nv ? <Drumstick className="h-2 w-2" /> : <Leaf className="h-2 w-2" />}
              </span>
              <span className="font-body text-sm text-charcoal">{it.name}</span>
              <span className="mx-1 flex-1 translate-y-[-3px] border-b border-dotted border-charcoal/30" />
              <span className="font-display text-base text-gold">{it.price}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-ivory px-8 text-center">
      <p className="text-xs uppercase tracking-[0.4em] text-gold">Bon Appétit</p>
      <h2 className="mt-3 font-display text-4xl text-charcoal">Thank You</h2>
      <div className="mt-6 max-w-sm space-y-2 text-sm text-brown">
        <p>GST Extra · Please wait 30 minutes after placing an order.</p>
        <p>Room Service: {site.roomService}</p>
        <p>Suggestions: {site.suggestions}</p>
      </div>
    </div>
  );
}
