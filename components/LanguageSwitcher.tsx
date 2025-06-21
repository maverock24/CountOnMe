import React from 'react';
import ModalPicker from './ModalPicker';
import i18n from '../i18n';
import { useData } from './data.provider';

const LanguageSwitcher: React.FC = () => {
  const { language } = useData();

  // ModalPicker will call this when a language is selected
  const handleLanguageChange = async (langLabel: string) => {
    const lang = language.find((l) => l.label === langLabel)?.value;
    if (lang) {
      await i18n.changeLanguage(lang);
    }
  };

  return (
    <ModalPicker
      label="Selected Language"
      dataKey="language"
      onValueChange={handleLanguageChange}
    />
  );
};

export default LanguageSwitcher;
