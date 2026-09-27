export const HOTEL_CATEGORIES = [
  '1 Star',
  '2 Star',
  '3 Star',
  '4 Star',
  '5 Star',
  'Homestay',
  'Guest House',
  'Villa',
  'Cottage',
  'Camp',
  'Tent',
  'Houseboat',
  'Tree House',
  'Farm Stay',
  'Boutique Hotel',
  'Palace Hotel',
  'Lodge',
  'Apartment',
  'Serviced Apartment',
  'Cabin',
  'Bungalow',
  'Eco Lodge / Eco Resort',
  'Jungle Lodge',
  'Beach Hut',
  'Mountain Hut',
  'Ashram / Retreat',
  'Monastery Stay',
  'Ranch / Farmhouse',
  'Caravan / Campervan',
];

/** Leading star count when the category is a star rating, else 0. */
export const starsOf = (category) => {
  const m = /^([1-5])\s*Star$/i.exec(String(category || '').trim());
  return m ? Number(m[1]) : 0;
};
