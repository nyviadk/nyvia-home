import type { ReactNode } from 'react';
import { Modal } from 'react-native';

import { cn } from '@/lib/cn';
import { Pressable } from '@/tw';

/**
 * Centreret dialog med mørk baggrund. Klik udenfor lukker; klik indeni gør ikke.
 *
 * Den indre `onPress={() => {}}` er ikke død kode: uden den bobler trykket op til
 * baggrunden og lukker dialogen, så snart man rører indholdet. `cursor: 'auto'` fjerner
 * hånd-markøren på web, hvor `Pressable` ellers signalerer at hele fladen er klikbar.
 *
 * Lå i tre kopier (dato-vælger, forecast-info, vault-modal) med samme rgba-værdi.
 */
export function ModalSheet({
  visible,
  onClose,
  children,
  className,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Fx `max-w-80` til dato-vælgeren. */
  className?: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ backgroundColor: 'rgba(40, 40, 38, 0.35)', cursor: 'auto' }}
        className="flex-1 items-center justify-center p-6">
        <Pressable
          onPress={() => {}}
          style={{
            boxShadow: '0 8px 24px rgba(40, 40, 38, 0.18)',
            borderCurve: 'continuous',
            cursor: 'auto',
          }}
          className={cn('w-full gap-3 rounded-2xl border border-border bg-card p-4', className)}>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
