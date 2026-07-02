import { File, Paths } from 'expo-file-system';

/**
 * Henter et remote-billede (fx fra Firebase Storage) og returnerer det som base64 data-URI,
 * så det ALTID indlejres i PDF'en. Native-sti: download til cache + læs base64 via den nye
 * expo-file-system File-API. (Web-teknikken `fetch → blob → FileReader.readAsDataURL` HÆNGER
 * på Android — derfor denne platform-split.) Falder tilbage til URL'en ved fejl.
 */
export async function imageToDataUri(url: string): Promise<string> {
  try {
    const file = await File.downloadFileAsync(url, Paths.cache);
    const base64 = await file.base64();
    try {
      file.delete();
    } catch {
      // best-effort oprydning af cache-filen
    }
    const mime = base64.startsWith('iVBOR') ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${base64}`;
  } catch {
    return url;
  }
}
