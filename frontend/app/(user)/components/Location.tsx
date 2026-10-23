const mapUrl =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d353.4183838330021!2d70.30512852945697!3d28.410623680199492!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39375d0050133333%3A0x9cfee07d51c03bfe!2sSundas%20parlor!5e0!3m2!1sen!2s!4v1792760065122!5m2!1sen!2s';
const directionsUrl =
  'https://www.google.com/maps/dir/?api=1&destination=28.410623680199492%2C70.30512852945697';

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
