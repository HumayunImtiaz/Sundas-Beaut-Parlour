import Image from 'next/image';
import type { Service } from '@/lib/data';
import { getWhatsAppLink } from '@/lib/data';

type ServiceCardProps = {
  service: Service;
  index?: number;
};

export function ServiceCard({ service, index = 0 }: ServiceCardProps) {
  return (
    <article className="service-card reveal" style={{ '--delay': `${index * 90}ms` } as React.CSSProperties}>
      <div className="service-image-wrap"><Image className="service-image" src={service.image} alt={service.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw" /></div>
      <div className="service-meta"><span>{service.category}</span><span>{service.price}</span></div>
      <h3>{service.name}</h3><p>{service.description}</p>
      <a href={getWhatsAppLink(`Hello Sundas Beauty Parlour, I would like to book ${service.name}.`)} className="service-link bg-gradient-gold">Book on WhatsApp <span aria-hidden="true">↗</span></a>
    </article>
  );
}
