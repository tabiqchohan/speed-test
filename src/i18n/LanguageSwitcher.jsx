import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const toggleLang = () => {
    const newLang = i18n.language === 'en' ? 'ur' : 'en'
    i18n.changeLanguage(newLang)
    localStorage.setItem('tw_lang', newLang)
    document.documentElement.dir = newLang === 'ur' ? 'rtl' : 'ltr'
  }

  return (
    <button
      onClick={toggleLang}
      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
    >
      {i18n.language === 'en' ? 'اردو' : 'English'}
    </button>
  )
}
