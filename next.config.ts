import type { NextConfig } from "next";

const r2Hostname = process.env.R2_PUBLIC_URL
    ? new URL(process.env.R2_PUBLIC_URL).hostname
    : null;

const nextConfig: NextConfig = {
    reactStrictMode: true,
    reactCompiler: true,
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "img.youtube.com" },
            { protocol: "https", hostname: "i.ytimg.com" },
            // Cloudflare R2 pub-*.r2.dev 전 리전 허용 (CI에서 R2_PUBLIC_URL 미주입 시 fallback)
            { protocol: "https", hostname: "**.r2.dev" },
            ...(r2Hostname
                ? [{ protocol: "https" as const, hostname: r2Hostname }]
                : []),
        ],
    },
};

export default nextConfig;
