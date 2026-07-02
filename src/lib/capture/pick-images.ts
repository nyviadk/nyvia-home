import * as ImagePicker from 'expo-image-picker';
import { DateTime } from 'luxon';

/** Et valgt billede: lokal URI + evt. optaget-tidspunkt (ISO) fra EXIF. */
export type PickedImage = { uri: string; takenAt?: string };

/** EXIF-dato → ISO. Understøtter flad (Android) og nested {Exif} (iOS) + flere felter. */
function fromExif(exif: Record<string, unknown> | null | undefined): string | undefined {
  if (!exif) return undefined;
  const nested = exif['{Exif}'] as Record<string, unknown> | undefined;
  const raw =
    exif['DateTimeOriginal'] ??
    exif['DateTimeDigitized'] ??
    exif['DateTime'] ??
    nested?.['DateTimeOriginal'] ??
    nested?.['DateTimeDigitized'];
  if (typeof raw !== 'string') return undefined;
  const m = raw.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}` : undefined;
}

/** Web: image-picker giver ikke EXIF → parse originalfilen med exifr (blob). */
async function fromFileWeb(uri: string): Promise<string | undefined> {
  try {
    const exifr = (await import('exifr')).default;
    const blob = await (await fetch(uri)).blob();
    const d = await exifr.parse(blob, ['DateTimeOriginal', 'CreateDate', 'DateTimeDigitized', 'DateTime']);
    const date = d?.DateTimeOriginal ?? d?.CreateDate ?? d?.DateTimeDigitized ?? d?.DateTime;
    return date instanceof Date && !Number.isNaN(date.getTime())
      ? (DateTime.fromJSDate(date).toISO() ?? undefined)
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Lader brugeren vælge ét eller flere billeder fra kamerarullen/filer. Returnerer lokale
 * URI'er + evt. optaget-dato: native læses fra image-pickers EXIF, web parses originalfilen
 * med exifr (image-picker giver ikke EXIF på web). Tomt array hvis annulleret/afvist.
 */
export async function pickImages(): Promise<PickedImage[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.7,
    exif: true,
  });
  if (result.canceled) return [];
  return await Promise.all(
    result.assets.map(async (a) => {
      const takenAt =
        fromExif(a.exif) ?? (process.env.EXPO_OS === 'web' ? await fromFileWeb(a.uri) : undefined);
      return { uri: a.uri, takenAt };
    })
  );
}
