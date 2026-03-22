import { useState } from 'react';

export function usePushNotifications() {
  const [toegestaan, setToegestaan] = useState(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission === 'granted'
      : false
  );

  const vraagToestemming = async () => {
    if (!('Notification' in window)) return false;
    if (!('serviceWorker' in navigator)) return false;
    const toestemming = await Notification.requestPermission();
    setToegestaan(toestemming === 'granted');
    return toestemming === 'granted';
  };

  const stuurLokaleNotificatie = (titel: string, body: string, url: string = '/') => {
    if (Notification.permission !== 'granted') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(titel, {
          body,
          icon: '/favicon.ico',
          tag: 'herinnering',
          data: { url },
        });
      });
    }
  };

  return { toegestaan, vraagToestemming, stuurLokaleNotificatie };
}
