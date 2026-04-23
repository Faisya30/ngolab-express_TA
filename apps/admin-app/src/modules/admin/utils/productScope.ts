export type ProductType = 'kiosk' | 'cv';

export function getProductTypeFromRole(role?: string): ProductType | null {
  const normalizedRole = String(role || '').toLowerCase();

  if (normalizedRole === 'kiosk_admin') return 'kiosk';
  if (normalizedRole === 'cv_admin') return 'cv';
  if (normalizedRole === 'super admin' || normalizedRole === 'super_admin' || normalizedRole === 'admin') return null;

  return null;
}
