import type { BusinessType } from '@/types/database';

// Audit row 2f433df1 — single source of truth for business_type display
// labels and schema.org @type mapping. Previously hard-coded in app/salon
// and app/admin (in slightly different ways). The values in the DB are
// the enum members `hair_salon` / `barber` / `unisex` — never render those
// raw to users.

export const TYPE_LABEL: Record<BusinessType, string> = {
  hair_salon: 'Hair Salon',
  barber: 'Barber Shop',
  unisex: 'Unisex Salon',
};

export function formatBusinessType(t: BusinessType | string | null | undefined): string {
  if (!t) return 'Salon';
  return TYPE_LABEL[t as BusinessType] ?? String(t).replace(/_/g, ' ');
}

/** schema.org @type for a given business_type. unisex maps to HairSalon as
 *  schema.org has no specific Unisex type; BarberShop is the only sibling. */
export function schemaTypeFor(t: BusinessType | string | null | undefined): 'HairSalon' | 'BarberShop' {
  return t === 'barber' ? 'BarberShop' : 'HairSalon';
}
