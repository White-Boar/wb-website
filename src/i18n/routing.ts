import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'it'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Use "as-needed" strategy: en at /, it at /it
  localePrefix: 'always'
});
