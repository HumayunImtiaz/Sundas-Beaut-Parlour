const address =
  'Dastgir Colony, Street No. 1, House No. 1, Rahim Yar Khan, Punjab, Pakistan';
const mapUrl =
  process.env.NEXT_PUBLIC_MAP_EMBED_URL ||
  `https://www.google.com/maps?q=${encodeURIComponent(`Sundas Beauty Parlour, ${address}`)}&output=embed`;
const directionsUrl =
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`Sundas Beauty Parlour, ${address}`)}`;

export function Location() {
  return (
    <section className="location" id="location">
      <div className="location-inner section-shell">
        <div className="location-copy reveal">
          <p className="eyebrow">Come find us</p>
          <h2>
            Your chair
            <br />
            <em>is waiting.</em>
          </h2>
          <p>Take a little time for yourself in our calm, light-filled studio.</p>
          <div className="address">
            <strong>Sundas Beauty Parlour</strong>
            <span>Dastgir Colony</span>
            <span>Street No. 1, House No. 1</span>
            <span>Rahim Yar Khan, Punjab, Pakistan</span>
            <span>Mon — Sat · 10:00 — 20:00</span>
          </div>
          <a
            className="button button-outline"
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
          >
            Get directions <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="map-frame reveal">
          <iframe
            src={mapUrl}
            title="Map showing Sundas Beauty Parlour in Rahim Yar Khan"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
      <footer className="footer section-shell">
        <span>Sundas Beauty Parlour</span>
        <span>Made for your glow · © 2026</span>
        <a href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || '#'} target="_blank" rel="noreferrer">
          Instagram ↗
        </a>
      </footer>
    </section>
  );
}
