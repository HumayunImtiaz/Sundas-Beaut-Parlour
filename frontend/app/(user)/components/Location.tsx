const mapUrl = 'https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3507.731717100929!2d70.3145250760117!3d28.45750269200667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjjCsDI3JzI3LjAiTiA3MMKwMTknMDEuNiJF!5e0!3m2!1sen!2s!4v1788446554308!5m2!1sen!2s';

export function Location() {
  return (
    <section className="location" id="location">
      <div className="location-inner section-shell"><div className="location-copy reveal"><p className="eyebrow">Come find us</p><h2>Your chair<br /><em>is waiting.</em></h2><p>Take a little time for yourself in our calm, light-filled studio.</p><div className="address"><strong>Sundas Beauty Parlour</strong><span>Rahim Yar Khan, Punjab, Pakistan</span><span>Mon — Sat · 10:00 — 20:00</span></div><a className="button button-outline" href="https://maps.app.goo.gl/CpdGQnd6DLmvrS3L7" target="_blank" rel="noreferrer">Get directions <span aria-hidden="true">↗</span></a></div><div className="map-frame reveal"><iframe src={mapUrl} title="Map showing Sundas Beauty Parlour in Rahim Yar Khan" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /></div></div>
      <footer className="footer section-shell"><span>Sundas Beauty Parlour</span><span>Made for your glow · © 2026</span><a href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || '#'} target="_blank" rel="noreferrer">Instagram ↗</a></footer>
    </section>
  );
}
