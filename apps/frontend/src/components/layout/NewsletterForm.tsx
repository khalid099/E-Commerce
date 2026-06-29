'use client';

/** Footer newsletter capture. Presentational — no backend endpoint yet. */
export function NewsletterForm() {
  return (
    <form
      className="flex items-center border-b border-[#4A4339] pb-2"
      onSubmit={(e) => e.preventDefault()}
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        placeholder="Enter your email"
        className="flex-1 bg-transparent text-[13.5px] text-maison-cream outline-none placeholder:text-maison-subtle"
      />
      <button type="submit" aria-label="Subscribe" className="text-lg text-maison-clay">
        &rarr;
      </button>
    </form>
  );
}
