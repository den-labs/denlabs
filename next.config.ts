import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const reactSpinnersAliasTurbo = "./src/shims/react-spinners.tsx";
const reactSpinnersAliasWebpack = path.resolve(
  __dirname,
  "src/shims/react-spinners.tsx",
);
const lottieReactAliasTurbo = "./src/shims/lottie-react.tsx";
const lottieReactAliasWebpack = path.resolve(
  __dirname,
  "src/shims/lottie-react.tsx",
);

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },

          // Prevent MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },

          // Safer referrer behavior
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Reduce exposure to powerful APIs (baseline; adjust if you later need them)
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },

          // CSP Report-Only: monitor violations without blocking
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://verify.walletconnect.com https://verify.walletconnect.org https://*.reown.com https://*.walletconnect.com https://*.self.xyz",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://verify.walletconnect.com https://verify.walletconnect.org https://*.reown.com https://*.walletconnect.com wss://*.walletconnect.com https://*.self.xyz https://rpc.walletconnect.com wss://relay.walletconnect.com https://*.celo-testnet.org https://*.celo.org",
              "frame-src 'self' https://*.self.xyz https://*.walletconnect.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.postimg.cc",
      },
    ],
  },
  experimental: {
    turbo: {
      resolveAlias: {
        "react-spinners": reactSpinnersAliasTurbo,
        "lottie-react": lottieReactAliasTurbo,
      },
    },
  },
  webpack(config) {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = config.resolve.alias ?? {};
    config.resolve.alias["react-spinners"] = reactSpinnersAliasWebpack;
    config.resolve.alias["lottie-react"] = lottieReactAliasWebpack;
    return config;
  },
};

type TurboMigratableConfig = NextConfig & {
  experimental?: {
    turbo?: Record<string, unknown>;
  };
  turbopack?: Record<string, unknown>;
};

const config = withNextIntl(nextConfig) as TurboMigratableConfig;

if (config.experimental?.turbo) {
  config.turbopack = {
    ...config.experimental.turbo,
    ...config.turbopack,
  };
  delete config.experimental.turbo;

  if (Object.keys(config.experimental).length === 0) {
    delete config.experimental;
  }
}

export default config;
