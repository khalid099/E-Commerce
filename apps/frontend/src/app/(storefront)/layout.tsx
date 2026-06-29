import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Toast } from '@/components/storefront/Toast';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="maison flex min-h-screen flex-col font-sans text-maison-ink">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <Toast />
    </div>
  );
}
