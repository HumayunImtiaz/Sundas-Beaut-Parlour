import { services } from '@/lib/data';
import { ServiceCard } from './ServiceCard';

export function Services() {
  return (
    <section className="services section-shell" id="services">
      <div className="section-heading reveal"><div><p className="eyebrow">The menu</p><h2>Small rituals.<br /><em>Lasting glow.</em></h2></div><p className="section-intro">Our signature services are designed around your time, your style and the way you want to feel when you leave.</p></div>
      <div className="service-grid">
        {services.map((service, index) => <ServiceCard service={service} index={index} key={service.slug} />)}
      </div>
    </section>
  );
}
