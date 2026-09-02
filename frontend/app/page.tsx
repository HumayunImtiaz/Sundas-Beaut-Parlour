import { About } from '@/components/About';
import { Hero } from '@/components/Hero';
import { Location } from '@/components/Location';
import { Navbar } from '@/components/Navbar';
import { NewProductToast } from '@/components/NewProductToast';
import { ProductsSection } from '@/components/ProductsSection';
import { Services } from '@/components/Services';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { services } from '@/lib/data';
import { homeRemedies } from '@/lib/homeRemedies';

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <About />
      <Services />
      <ProductsSection />
      <Location />
      <WhatsAppButton />
      <NewProductToast product={homeRemedies.find((product) => product.isNew)} />
    </main>
  );
}
