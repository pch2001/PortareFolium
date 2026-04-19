// 기존 blog/portfolio 이미지 sidecar backfill
// 실행: pnpm backfill:lightbox-sidecars

import { config } from "dotenv";
config({ path: ".env.local" });
import sharp from "sharp";
import {
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "../src/lib/r2";

const PREFIXES = ["blog/", "portfolio/"];

// 지원 확장자 판별
function isSupportedImageKey(key: string): boolean {
    return /\.(gif|png|jpe?g|webp|avif|svg)$/i.test(key);
}

// sidecar 대상 key 판별
function isSidecarKey(key: string): boolean {
    return /\.(thumb|poster)\.webp$/i.test(key);
}

// sidecar key 생성
function getSidecarKey(key: string, suffix: "poster" | "thumb"): string {
    return key.replace(/\.[^./]+$/, `.${suffix}.webp`);
}

// object body를 buffer로 변환
async function toBuffer(body: unknown): Promise<Buffer> {
    if (!body || typeof body !== "object") {
        throw new Error("Body 없음");
    }

    const stream = body as {
        transformToByteArray?: () => Promise<Uint8Array>;
    };

    if (typeof stream.transformToByteArray === "function") {
        const bytes = await stream.transformToByteArray();
        return Buffer.from(bytes);
    }

    throw new Error("지원하지 않는 Body 형식");
}

// sidecar 존재 여부 확인
async function exists(key: string): Promise<boolean> {
    try {
        await r2Client.send(
            new HeadObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
            })
        );
        return true;
    } catch {
        return false;
    }
}

// thumb blob 생성
async function createThumb(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer, { animated: true })
        .resize({
            width: 256,
            height: 256,
            fit: "inside",
            withoutEnlargement: true,
        })
        .webp({ quality: 75 })
        .toBuffer();
}

// poster blob 생성
async function createPoster(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer, { animated: true, pages: 1 })
        .resize({
            width: 1280,
            height: 1280,
            fit: "inside",
            withoutEnlargement: true,
        })
        .webp({ quality: 82 })
        .toBuffer();
}

// sidecar 업로드
async function uploadSidecar(key: string, buffer: Buffer): Promise<void> {
    await r2Client.send(
        new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: "image/webp",
        })
    );
}

// prefix 아래 key 순회
async function listKeys(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let token: string | undefined;

    do {
        const result = await r2Client.send(
            new ListObjectsV2Command({
                Bucket: R2_BUCKET,
                Prefix: prefix,
                ContinuationToken: token,
            })
        );

        (result.Contents ?? []).forEach((item) => {
            if (item.Key) keys.push(item.Key);
        });

        token = result.IsTruncated ? result.NextContinuationToken : undefined;
    } while (token);

    return keys;
}

async function backfillKey(key: string): Promise<void> {
    if (!isSupportedImageKey(key) || isSidecarKey(key)) return;

    const thumbKey = getSidecarKey(key, "thumb");
    const posterKey = getSidecarKey(key, "poster");
    const isGif = /\.gif$/i.test(key);

    const thumbExists = await exists(thumbKey);
    const posterExists = isGif ? await exists(posterKey) : true;
    if (thumbExists && posterExists) return;

    const object = await r2Client.send(
        new GetObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
        })
    );
    const buffer = await toBuffer(object.Body);

    if (!thumbExists) {
        const thumbBuffer = await createThumb(buffer);
        await uploadSidecar(thumbKey, thumbBuffer);
        console.log(`[thumb] ${thumbKey}`);
    }

    if (isGif && !posterExists) {
        const posterBuffer = await createPoster(buffer);
        await uploadSidecar(posterKey, posterBuffer);
        console.log(`[poster] ${posterKey}`);
    }
}

async function main() {
    for (const prefix of PREFIXES) {
        console.log(`[scan] ${prefix}`);
        const keys = await listKeys(prefix);
        for (const key of keys) {
            await backfillKey(key);
        }
    }

    console.log("lightbox sidecar backfill 완료");
}

main().catch((error) => {
    console.error("[backfill-lightbox-sidecars] 실패", error);
    process.exit(1);
});
