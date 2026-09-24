import {
  Wifi, Waves, UtensilsCrossed, Car, ConciergeBell, Snowflake, Dumbbell, Flower2,
  Wine, Plane, Shirt, Zap, PawPrint, Briefcase, Baby, Flame, Trees, Tv,
  Coffee, BedDouble, ShieldCheck, Sparkles, Mountain, Sun, Bath, Cigarette,
} from 'lucide-react';

/** Icons an amenity can use. The key is stored on the amenity record. */
export const ICONS = {
  Wifi, Waves, UtensilsCrossed, Car, ConciergeBell, Snowflake, Dumbbell, Flower2,
  Wine, Plane, Shirt, Zap, PawPrint, Briefcase, Baby, Flame, Trees, Tv,
  Coffee, BedDouble, ShieldCheck, Sparkles, Mountain, Sun, Bath, Cigarette,
};

export const ICON_NAMES = Object.keys(ICONS);
export const iconFor = (name) => ICONS[name] || ConciergeBell;
