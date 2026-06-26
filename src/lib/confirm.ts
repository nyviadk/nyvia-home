import { Alert } from 'react-native';

/** Bekræftelses-dialog (native via Alert; web-varianten ligger i confirm.web.ts). */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel = 'OK'
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Annullér', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
