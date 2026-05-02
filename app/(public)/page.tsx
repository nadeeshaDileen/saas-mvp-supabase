import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-20 text-center">
        <span className="bg-muted text-muted-foreground rounded-full px-4 py-1 text-xs font-medium uppercase tracking-widest">
          New arrivals every week
        </span>
        <h1 className="max-w-2xl text-5xl font-bold tracking-tight leading-tight">
          Clothing that fits your style
        </h1>
        <p className="text-muted-foreground max-w-md text-lg">
          Discover curated collections of quality clothing. From everyday essentials to standout pieces — all in one place.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link
            href="/shop"
            className="bg-primary text-primary-foreground rounded-lg px-7 py-3 font-medium transition-opacity hover:opacity-90"
          >
            Browse the shop
          </Link>
          <Link
            href="/auth/signup"
            className="border-border rounded-lg border px-7 py-3 font-medium transition-colors hover:bg-gray-50"
          >
            Create account
          </Link>
        </div>
      </section>

      {/* Categories strip */}
      <section className="border-t px-8 py-12">
        <div className="mx-auto max-w-4xl">
          <p className="text-muted-foreground mb-6 text-center text-sm font-medium uppercase tracking-widest">
            Shop by category
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Tops", "Bottoms", "Dresses", "Outerwear", "Accessories", "Footwear"].map((cat) => (
              <Link
                key={cat}
                href={`/shop?category=${cat.toUpperCase()}`}
                className="border-border hover:bg-accent rounded-full border px-5 py-2 text-sm font-medium transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-8 py-6 text-center">
        <p className="text-muted-foreground text-xs">© {new Date().getFullYear()} Falcky. All rights reserved.</p>
      </footer>
    </main>
  );
}
