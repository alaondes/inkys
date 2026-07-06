import { useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

export function FaviconManager() {
  const { settings } = useSettings();

  useEffect(() => {
    const iconUrl = settings?.faviconUrl || settings?.logoUrl;
    if (iconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = iconUrl;
    }
  }, [settings?.faviconUrl, settings?.logoUrl]);

  return null;
}
