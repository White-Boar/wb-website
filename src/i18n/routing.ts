import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'it'],
 
  // Used when no locale matches
  defaultLocale: 'en',
  
  // Configure locale prefix behavior
  localePrefix: 'always'
});