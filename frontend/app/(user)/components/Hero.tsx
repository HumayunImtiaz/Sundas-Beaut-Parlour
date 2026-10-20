import { getWhatsAppLink } from '@/lib/site';

export function Hero() {
  return (
    <section className="hero" id="top">
      <video className="hero-image" autoPlay muted loop playsInline aria-hidden="true">
        <source src="/stylist-applying-makeup.mp4" type="video/mp4" />
      </video>
      <div className="hero-shade" />
      <div className="hero-content">
        <p className="eyebrow hero-eyebrow">A beauty ritual, made personal</p>
        <h1>Feel like<br /><em>yourself,</em> only brighter.</h1>
        <p className="hero-copy">Thoughtful hair, skins and makeup artistry for the moments.</p>
        <a className="button button-gold bg-gradient-gold" href={getWhatsAppLink('Hello Sundas Beauty Parlour, I would like to book a visit.')}>Book on WhatsApp <span aria-hidden="true">↗</span></a>
      </div>
      <div className="hero-note">Est. 2014 <span /> Lahore</div>
      <a className="scroll-cue" href="#about">Scroll to discover <span aria-hidden="true">↓</span></a>
    </section>
  );
}
