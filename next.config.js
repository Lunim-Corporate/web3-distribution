/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },

  // ─── Security Headers ───────────────────────────────────
  async redirects() {
    if (process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCESS === 'true') return [];

    return [
      {
        source: '/web3-demo',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/web3-demo/:path*',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/supabase-test',
        destination: '/',
        permanent: false,
      },
    ];
  },

  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
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
            value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://auth.privy.io https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://images.unsplash.com https://via.placeholder.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://auth.privy.io https://*.alchemy.com https://sepolia.base.org http://127.0.0.1:8545 https://js.stripe.com",
              "frame-src https://auth.privy.io https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
