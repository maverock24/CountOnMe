import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

const i18n = new I18n({
  en: { welcome: 'Welcome' },
  de: { welcome: 'Willkommen' },
  
});

i18n.locale = getLocales()[0]?.languageCode || 'en';
i18n.enableFallback = true;

/**
 * Updates the i18n locale.
 * @param locale The language code to set (e.g., 'en', 'de').
 */
export const setAppLocale = (locale: string) => {
  i18n.locale = locale;
};

export default i18n;