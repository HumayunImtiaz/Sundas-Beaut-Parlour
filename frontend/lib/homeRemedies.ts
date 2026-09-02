export type HomeRemedy = {
  name: string;
  slug: string;
  price: string;
  description: string;
  fullDescription: string;
  image: string;
  isNew?: boolean;
  availability: string;
};

export const homeRemedies: HomeRemedy[] = [
  {
    name: 'Herbal Hair Oil',
    slug: 'herbal-hair-oil',
    price: 'PKR 1,200',
    description: 'A nourishing blend for softer, healthier-looking hair.',
    fullDescription: 'Our Herbal Hair Oil brings together a considered blend of botanical ingredients to nourish the scalp and lengths. Massage it in as part of a relaxing weekly ritual for softer, shinier, healthier-looking hair.',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=85',
    availability: 'In stock',
    isNew: true
  },
  {
    name: 'Face Whitening Cream',
    slug: 'face-whitening-cream',
    price: 'PKR 1,500',
    description: 'A lightweight daily cream for a fresh, even-looking glow.',
    fullDescription: 'A lightweight cream made for a simple, consistent skincare ritual. It helps skin feel soft and replenished while supporting a fresh, even-looking glow. Patch test before use and follow with sunscreen during the day.',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=85',
    availability: 'In stock'
  },
  {
    name: 'Fairness Pack',
    slug: 'fairness-pack',
    price: 'PKR 1,800',
    description: 'A gentle at-home mask ritual for a brighter-looking complexion.',
    fullDescription: 'Our Fairness Pack is a gentle at-home mask ritual for moments when your skin needs a little reset. Apply as directed for a clean, refreshed feel and a naturally brighter-looking complexion.',
    image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=900&q=85',
    availability: 'In stock'
  },
  {
    name: 'Herbal Face Wash',
    slug: 'herbal-face-wash',
    price: 'PKR 950',
    description: 'A refreshing botanical cleanse for everyday skin care.',
    fullDescription: 'A refreshing daily cleanser that lifts away the day without leaving skin feeling stripped. Its botanical-inspired formula makes a simple first step for a calm, clean skincare routine.',
    image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85',
    availability: 'In stock'
  },
  {
    name: 'Ubtan',
    slug: 'ubtan',
    price: 'PKR 1,100',
    description: 'A traditional-inspired powder blend for a softly polished glow.',
    fullDescription: 'Inspired by a much-loved beauty tradition, our Ubtan is a powdered blend for a softly polished, refreshed feel. Mix a small amount with your preferred base and make it part of an unhurried self-care ritual.',
    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=900&q=85',
    availability: 'In stock'
  },
  {
    name: 'Hair Growth Serum',
    slug: 'hair-growth-serum',
    price: 'PKR 1,600',
    description: 'A focused scalp-care step for a stronger-looking hair routine.',
    fullDescription: 'This lightweight serum is designed to make scalp care an easy, consistent part of your routine. Apply as directed and massage gently into the scalp for a cared-for, healthier-looking finish over time.',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85',
    availability: 'In stock'
  }
];
