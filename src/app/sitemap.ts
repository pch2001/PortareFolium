import type { MetadataRoute } from "next";
import { serverClient } from "@/lib/supabase";

// 동적 sitemap 생성 (정적 페이지 + blog + portfolio)
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://localhost:3000");

    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1.0,
        },
        {
            url: `${baseUrl}/resume`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/portfolio`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
        },
    ];

    let blogPages: MetadataRoute.Sitemap = [];
    if (serverClient) {
        const { data: posts } = await serverClient
            .from("posts")
            .select("slug, updated_at")
            .eq("published", true);
        if (posts) {
            blogPages = posts.map((post) => ({
                url: `${baseUrl}/blog/${post.slug}`,
                lastModified: new Date(post.updated_at),
                changeFrequency: "weekly" as const,
                priority: 0.6,
            }));
        }
    }

    let portfolioPages: MetadataRoute.Sitemap = [];
    if (serverClient) {
        const { data: items } = await serverClient
            .from("portfolio_items")
            .select("slug, updated_at")
            .eq("published", true);
        if (items) {
            portfolioPages = items.map((item) => ({
                url: `${baseUrl}/portfolio/${item.slug}`,
                lastModified: new Date(item.updated_at),
                changeFrequency: "monthly" as const,
                priority: 0.6,
            }));
        }
    }

    return [...staticPages, ...blogPages, ...portfolioPages];
}
