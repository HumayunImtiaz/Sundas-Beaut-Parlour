const mapUrl = process.env.NEXT_PUBLIC_MAP_EMBED_URL;

export function Location() {
  return (
    <section className="location" id="location">
      <div className="location-inner section-shell"><div className="location-copy reveal"><p className="eyebrow">Come find us</p><h2>Your chair<br /><em>is waiting.</em></h2><p>Take a little time for yourself in our calm, light-filled studio.</p><div className="address"><strong>Sundas Beauty Parlour</strong><span>Lahore, Pakistan</span><span>Mon — Sat · 10:00 — 20:00</span></div><a className="button button-outline" href={process.env.NEXT_PUBLIC_MAP_EMBED_URL?.replace('&output=embed', '') || '#location'} target="_blank" rel="noreferrer">Get directions <span aria-hidden="true">↗</span></a></div><div className="map-frame reveal">{mapUrl ? <iframe src={mapUrl} title="Map showing Sundas Beauty Parlour" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /> : <div className="map-empty">Add <code>NEXT_PUBLIC_MAP_EMBED_URL</code> to show the studio map.</div>}</div></div>
      <footer className="footer section-shell"><span>Sundas Beauty Parlour</span><span>Made for your glow · © 2026</span><a href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || '#'} target="_blank" rel="noreferrer">Instagram ↗</a></footer>
    </section>
  );
}
