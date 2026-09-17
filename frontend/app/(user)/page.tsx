import { About } from './components/About';
import { Hero } from './components/Hero';
import { Location } from './components/Location';
import { Navbar } from './components/Navbar';
import { NewProductToast } from './components/NewProductToast';
import { ProductsSection } from './components/ProductsSection';
import { Services } from './components/Services';
import { WhatsAppButton } from './components/WhatsAppButton';
import { services } from '@/lib/content';
import { getProducts } from '@/lib/medusa';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const products = await getProducts();
  const newProduct = products.find((product) => product.isNew);
  return (
    <main>
      <Navbar />
      <Hero />
      <About />
      <Services services={services} />
      <ProductsSection products={products.slice(0, 3)} />
      <Location />
      <WhatsAppButton />
      <NewProductToast product={newProduct} />
    </main>
  );
}