import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Skip all paths that should not be internationalized
    '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
  ]
};
