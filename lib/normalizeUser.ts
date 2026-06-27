export function normalizeUser(u: any) {
  if (!u) return null;

  return {
    ...u,
    emailVerified: Boolean(u.emailVerified ?? u.EmailVerified),
    LicenceVerified: Boolean(u.LicenceVerified ?? u.licenceVerified),
  };
}
