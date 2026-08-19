/** harf-uti → UTI */
export function labelFromAdGroup(cn: string): string {
  const stripped = cn.replace(/^harf-/i, "");
  return stripped.replace(/_/g, " ").toUpperCase();
}
