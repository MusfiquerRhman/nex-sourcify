/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // BullMQ's optional Valkey GLIDE adapter loads native .node binaries.
  serverExternalPackages: ["bullmq", "@valkey/valkey-glide"],
  
    webpack: (config, { dev }) => {
        config.resolve.alias.canvas = false;

        if (dev) {
            const ignored = config.watchOptions?.ignored;
            const photoUploads = /[\\/]public[\\/](?:sample_checklist|pp_meeting)(?:[\\/]|$)/;
            config.watchOptions = {
                ...config.watchOptions,
                ignored: ignored instanceof RegExp
                    ? new RegExp(`${ignored.source}|${photoUploads.source}`, ignored.flags)
                    : [...(Array.isArray(ignored) ? ignored : ignored ? [ignored] : []), "**/public/sample_checklist/**", "**/public/pp_meeting/**"],
            };
        }

        return config;
    },

  output: "standalone",

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Isolation
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },

          // Hardening
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default config;
