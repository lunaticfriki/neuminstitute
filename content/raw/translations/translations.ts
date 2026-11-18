import type { LocaleCode } from '../value-objects/Locale.valueObject'
import type { TranslationKey } from './TranslationKey'
import { caTranslations } from './ca.translations'
import { esTranslations } from './es.translations'
import { enTranslations } from './en.translations'

export const translations: Record<LocaleCode, Record<TranslationKey, string>> = {
	ca: caTranslations,
	es: esTranslations,
	en: enTranslations,
}
