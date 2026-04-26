import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin-auth";

// Auth.js session을 server-side 권한 source로 사용한다.
export async function getEffectiveAdminSession() {
    return auth();
}

// server action / route 관리자 인증 확인
export async function requireAdminSession() {
    const session = await getEffectiveAdminSession();
    if (!isAdminSession(session)) {
        throw new Error("관리자 인증 필요");
    }
    return session;
}
