import Image from 'next/image';
import { getWhatsAppLink } from '@/lib/data';

export function Hero() {
  return (
    <section className="hero" id="top">
      <Image className="hero-image" src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=2200&q=90" alt="Sunlit beauty salon interior" fill priority sizes="100vw" />
      <div className="hero-shade" />
      <div className="hero-content">
        <p className="eyebrow hero-eyebrow">A beauty ritual, made personal</p>
        <h1>Feel like<br /><em>yourself,</em> only brighter.</h1>
        <p className="hero-copy">Thoughtful hair, skin and makeup artistry for the moments you want to remember.</p>
        <a className="button button-gold bg-gradient-gold" href={getWhatsAppLink('Hello Sundas Beauty Parlour, I would like to book a visit.')}>Book on WhatsApp <span aria-hidden="true">↗</span></a>
      </div>
      <div className="hero-note">Est. 2014 <span /> Lahore</div>
      <a className="scroll-cue" href="#about">Scroll to discover <span aria-hidden="true">↓</span></a>
    </section>
  );
}
