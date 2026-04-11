import Link from 'next/link';
import SearchBar from '@/components/SearchBar';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-rose-50 via-white to-white">
        <div className="mx-auto max-w-5xl px-6 pt-24 pb-20 text-center sm:pt-32">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-rose-600">
            Australia&rsquo;s hair &amp; barber directory
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Find your next haircut.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
            Hand-verified hair salons and barber shops — nothing else. No nails, no
            lashes, no spa. Just hair.
          </p>

          <div className="mx-auto mt-10 max-w-2xl">
            <SearchBar />
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2 text-sm">
            {['Ballarat', 'Geelong', 'Melbourne', 'Hobart', 'Adelaide'].map((city) => (
              <Link
                key={city}
                href={`/search?q=${encodeURIComponent(city)}`}
                className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-neutral-700 transition hover:border-rose-300 hover:text-rose-600"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          <ValueProp
            title="Hair & barber only"
            body="We exclude beauty, nails, lashes, and spas. Every listing is dedicated to hair."
          />
          <ValueProp
            title="One listing per shop"
            body="No duplicate chair renters. One building, one listing — always."
          />
          <ValueProp
            title="Owners keep it accurate"
            body="Salon owners can claim their listing and update hours, photos, and booking links."
          />
        </div>
      </section>

      <section className="bg-neutral-900 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-16 text-center sm:flex-row sm:text-left">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold sm:text-3xl">Own a salon or barber shop?</h2>
            <p className="mt-2 text-neutral-300">
              Claim your free listing and add photos, opening hours, and a booking link.
            </p>
          </div>
          <Link
            href="/claim"
            className="inline-flex items-center justify-center rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-400"
          >
            Claim your listing
          </Link>
        </div>
      </section>

      <footer className="border-t border-neutral-100 py-10 text-center text-xs text-neutral-500">
        <p>&copy; {new Date().getFullYear()} findme.hair — an Australian hair directory.</p>
      </footer>
    </main>
  );
}

function ValueProp({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">{body}</p>
    </div>
  );
}
