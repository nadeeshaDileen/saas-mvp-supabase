import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section - Minimalist Design */}
      <section className="relative flex flex-1 items-center px-6 py-20 lg:px-12">
        <div className="container mx-auto grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Text Content */}
          <div className="flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-6xl font-bold uppercase leading-none tracking-tighter lg:text-7xl">
                NEW
                <br />
                COLLECTION
              </h1>
              <p className="text-sm uppercase tracking-wider text-muted-foreground">
                Summer 2024
              </p>
            </div>

            <Link
              href="/shop"
              className="group inline-flex w-fit items-center gap-2 border border-foreground bg-foreground px-8 py-3 text-sm font-medium uppercase tracking-wide text-background transition-all hover:bg-background hover:text-foreground"
            >
              Go To Shop
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Right: Featured Products */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="aspect-[3/4] overflow-hidden bg-muted">
                <img
                  src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=600&fit=crop"
                  alt="Featured product"
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>
            <div className="space-y-4 pt-12">
              <div className="aspect-[3/4] overflow-hidden bg-muted">
                <img
                  src="https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=600&fit=crop"
                  alt="Featured product"
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="border-t border-border bg-background px-6 py-16 lg:px-12">
        <div className="container mx-auto">
          <div className="mb-8 space-y-2">
            <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Shop by Category
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {["MEN", "WOMEN", "KIDS", "ACCESSORIES", "FOOTWEAR", "SALE"].map((cat) => (
              <Link
                key={cat}
                href={`/shop?category=${cat}`}
                className="group border border-border bg-card px-6 py-4 text-center text-sm font-medium uppercase tracking-wide transition-all hover:bg-foreground hover:text-background"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          © {new Date().getFullYear()} FALCKY. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
