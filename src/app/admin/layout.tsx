import type { Metadata } from "next";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog";

export const metadata: Metadata = {
    title: "Admin — PortareFolium",
    icons: { icon: "/favicon-admin.svg" },
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ConfirmDialogProvider>{children}</ConfirmDialogProvider>;
}
