/** Bekræftelses-dialog på web (window.confirm). */
export function confirmAction(
  title: string,
  message: string,
  _confirmLabel = 'OK'
): Promise<boolean> {
  const ok = typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : false;
  return Promise.resolve(ok);
}
