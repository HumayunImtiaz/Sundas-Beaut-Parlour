export type Service = {
  slug: string;
  name: string;
  price: string;
  description: string;
  fullDescription: string;
  image: string;
  category: string;
};

export const services: Service[] = [
  {
    slug: 'bridal-makeup',
    name: 'Bridal Makeup',
    price: 'Price on inquiry',
    description: 'A luminous, long-wearing bridal look designed around you.',
    fullDescription: 'Your wedding look should feel timeless, comfortable and entirely your own. We begin with a thoughtful consultation, then create luminous, long-wearing makeup with careful attention to your features, outfit and celebration.',
    category: 'Bridal',
    image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=900&q=85'
  },
  {
    slug: 'party-makeup',
    name: 'Party Makeup',
    price: 'PKR 8,000',
    description: 'Polished, camera-ready makeup for celebrations and evenings out.',
    fullDescription: 'From intimate dinners to joyful celebrations, our party makeup service is tailored to your personal style. Expect refined skin, considered color and a finish that photographs beautifully without feeling overdone.',
    category: 'Makeup',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=85'
  },
  {
    slug: 'signature-facial',
    name: 'Signature Facial',
    price: 'PKR 4,500',
    description: 'A restorative facial tailored to your skin’s needs and season.',
    fullDescription: 'A calm, restorative treatment shaped around what your skin needs today. We combine gentle preparation, targeted care and a soothing finish to leave your complexion refreshed, balanced and quietly radiant.',
    category: 'Skin',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=85'
  },
  {
    slug: 'hair-styling',
    name: 'Hair Styling',
    price: 'PKR 3,500',
    description: 'Smooth, glossy movement finished with a style made for you.',
    fullDescription: 'Whether you want polished waves, an elegant updo or a softly finished blowout, our styling service is designed around the occasion and your natural movement. We finish with lasting shape and touchable shine.',
    category: 'Hair',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=85'
  },
  {
    slug: 'hair-coloring',
    name: 'Hair Coloring',
    price: 'Price on inquiry',
    description: 'Expert color consultation and dimensional, healthy-looking results.',
    fullDescription: 'Every color appointment starts with a consultation to understand your goals, maintenance rhythm and hair history. Our artists build dimension and tone with a focus on healthy-looking, wearable results.',
    category: 'Hair',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=85'
  },
  {
    slug: 'manicure-pedicure',
    name: 'Manicure & Pedicure',
    price: 'PKR 3,000',
    description: 'A quiet, detailed reset for beautifully cared-for hands and feet.',
    fullDescription: 'Take a quiet pause for detailed grooming and care. This considered service includes shaping, cuticle care and a polished finish, leaving hands and feet feeling refreshed and beautifully looked after.',
    category: 'Care',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=85'
  },
  {
    slug: 'threading-waxing',
    name: 'Threading & Waxing',
    price: 'Price on inquiry',
    description: 'Precise, gentle grooming with comfort at every step.',
    fullDescription: 'Our threading and waxing service is precise, gentle and tailored to your comfort. We take a careful approach to create clean, natural definition while respecting the sensitivity of your skin.',
    category: 'Care',
    image: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=900&q=85'
  },
  {
    slug: 'keratin-hair-botox',
    name: 'Keratin & Hair Botox',
    price: 'Price on inquiry',
    description: 'Smoothing treatments for softer, shinier, more manageable hair.',
    fullDescription: 'A smoothing consultation helps us choose the right treatment for your hair goals. Keratin and hair botox services soften texture, reduce frizz and restore a healthy-looking shine without losing your individuality.',
    category: 'Treatment',
    image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=900&q=85'
  }
];

export const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';

export function getWhatsAppLink(message: string) {
  if (!whatsappNumber) return '#contact';
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
