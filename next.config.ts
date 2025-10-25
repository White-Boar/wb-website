import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: './src/messages/en.json'
  }
});

const nextConfig: NextConfig = {
  typescript: {
    // TypeScript strict checking enabled after Option A implementation
    ignoreBuildErrors: false,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  serverExternalPackages: ['@react-email/render', 'prettier'],
  async headers() {
    // CSP configuration - only applied in production to avoid breaking Next.js dev mode
    const isDev = process.env.NODE_ENV === 'development';

    const cspHeader = isDev
      ? ''
      : `
        default-src 'self';
        script-src 'self' https://*.js.stripe.com https://js.stripe.com https://m.stripe.network 'sha256-7PZaH7TzFg4JdT5xJguN7Och6VcMcP1LW4N3fQ936Fs=' 'sha256-MqH8JJslY2fF2bGYY1rZlpCNrRCnWKRzrrDefixUJTI=' 'sha256-ZswfTY7H35rbv8WC7NXBoiC7WNu86vSzCDChNWwZZDM=';
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' blob: data: https://*.stripe.com;
        font-src 'self' data: https://fonts.gstatic.com;
        connect-src 'self' https://api.stripe.com https://m.stripe.network;
        frame-src 'self' https://*.js.stripe.com https://js.stripe.com https://hooks.stripe.com;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
      `.replace(/\s{2,}/g, ' ').trim();

    const headers = [
      {
        source: '/api/stripe/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'payment=(self), geolocation=(), microphone=(), camera=()',
          },
        ],
      },
      {
        source: '/api/onboarding/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];

    // Add CSP header for all routes in production only
    if (!isDev && cspHeader) {
      headers.unshift({
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
        ],
      });
    }

    return headers;
  },
};

export default withNextIntl(nextConfig);