import Image from 'next/image';

export function About() {
  return (
    <section className="about section-shell" id="about">
      <div className="about-image-wrap reveal">
        <Image className="about-image" src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=85" alt="Beauty professional working with a client" fill sizes="(max-width: 800px) 100vw, 48vw" />
        <p className="image-caption">The art of feeling at home in your own skin.</p>
      </div>
      <div className="about-copy reveal">
        <p className="eyebrow">Our philosophy</p>
        <h2>Beauty should feel<br /><em>like coming home.</em></h2>
        <p>At Sundas, every appointment begins with a conversation. We listen closely, work gently and create looks that feel unmistakably yours.</p>
        <p>From a quiet facial to the full bridal experience, our artists bring years of craft and a soft, observant eye to every detail.</p>
        <div className="stats"><div><strong>10+</strong><span>Years of craft</span></div><div><strong>4.9</strong><span>Client rating</span></div><div><strong>1:1</strong><span>Care, always</span></div></div>
      </div>
    </section>
  );
}
