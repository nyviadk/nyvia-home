import * as ImagePicker from 'expo-image-picker';

/**
 * Lader brugeren vælge ét eller flere billeder fra kamerarullen/filer. Returnerer
 * lokale URI'er (tomt array hvis annulleret/afvist). Upload sker bagefter via Storage.
 */
export async function pickImages(): Promise<string[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.7,
  });
  if (result.canceled) return [];
  return result.assets.map((a) => a.uri);
}
