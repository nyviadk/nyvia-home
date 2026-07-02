/**
 * Henter et remote-billede og returnerer det som base64 data-URI (web via fetch + FileReader).
 * Virker fint i browseren (modsat på Android, som bruger den native File-API i søster-filen).
 * Falder tilbage til URL'en ved fejl.
 */
export async function imageToDataUri(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read failed'));
      reader.onloadend = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}
