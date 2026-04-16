"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import {
    deleteSnapshot,
    deleteSnapshots,
    listSnapshots,
    restoreSnapshot,
} from "@/app/admin/actions/snapshots";
import type { Snapshot } from "@/app/admin/actions/snapshots";

// 테이블 필터 옵션
const TABLE_OPTIONS = [
    { value: "", label: "전체" },
    { value: "posts", label: "posts" },
    { value: "portfolio_items", label: "portfolio_items" },
    { value: "resume_data", label: "resume_data" },
];

export default function SnapshotsPanel() {
    const { confirm } = useConfirmDialog();
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [loading, setLoading] = useState(true);
    const [tableFilter, setTableFilter] = useState("");
    const [restoring, setRestoring] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [batchDeleting, setBatchDeleting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [restoreMsg, setRestoreMsg] = useState<{
        id: string;
        ok: boolean;
        msg: string;
    } | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);
    const selectAllRef = useRef<HTMLInputElement>(null);
    const refreshButtonClassName =
        "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200";

    const load = async () => {
        setLoading(true);
        setSnapshots(await listSnapshots(tableFilter || undefined));
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, [tableFilter]);

    useEffect(() => {
        setSelectedIds((prev) => {
            const next = new Set(
                snapshots
                    .filter((snapshot) => prev.has(snapshot.id))
                    .map((snapshot) => snapshot.id)
            );
            return next;
        });
    }, [snapshots]);

    const allSelected =
        snapshots.length > 0 &&
        snapshots.every((snap) => selectedIds.has(snap.id));
    const someSelected =
        selectedIds.size > 0 &&
        snapshots.some((snap) => selectedIds.has(snap.id));

    useEffect(() => {
        if (!selectAllRef.current) return;
        selectAllRef.current.indeterminate = someSelected && !allSelected;
    }, [someSelected, allSelected]);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
            return;
        }
        setSelectedIds(new Set(snapshots.map((snap) => snap.id)));
    };

    const handleRestore = async (snapshot: Snapshot) => {
        const ok = await confirm({
            title: "스냅샷 복원으로 덮어쓰기",
            description: `현재 데이터를 이 스냅샷으로 덮어씁니다.\n기존 내용은 즉시 교체되며 되돌리기 어렵습니다.\n\n테이블: ${snapshot.source_table}\n시각: ${new Date(snapshot.created_at).toLocaleString("ko-KR")}`,
            confirmText: "덮어쓰기 복원",
            cancelText: "취소",
            variant: "destructive",
        });
        if (!ok) return;
        setRestoring(snapshot.id);
        setRestoreMsg(null);
        const res = await restoreSnapshot(snapshot.id);
        setRestoring(null);
        if ("error" in res) {
            setRestoreMsg({ id: snapshot.id, ok: false, msg: res.error });
        } else {
            setRestoreMsg({ id: snapshot.id, ok: true, msg: "복원 완료" });
        }
    };

    const handleDelete = async (snapshot: Snapshot) => {
        const ok = await confirm({
            title: "스냅샷 삭제",
            description: `이 스냅샷을 삭제하시겠습니까?\n테이블: ${snapshot.source_table}\n시각: ${new Date(snapshot.created_at).toLocaleString("ko-KR")}`,
            confirmText: "삭제",
            cancelText: "취소",
            variant: "destructive",
        });
        if (!ok) return;
        setDeleting(snapshot.id);
        setRestoreMsg(null);
        const res = await deleteSnapshot(snapshot.id);
        setDeleting(null);
        if ("error" in res) {
            setRestoreMsg({ id: snapshot.id, ok: false, msg: res.error });
            return;
        }
        setExpanded((prev) => (prev === snapshot.id ? null : prev));
        setSnapshots((prev) => prev.filter((item) => item.id !== snapshot.id));
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(snapshot.id);
            return next;
        });
    };

    const handleBatchDelete = async () => {
        const selectedSnapshots = snapshots.filter((snap) =>
            selectedIds.has(snap.id)
        );
        if (selectedSnapshots.length === 0) return;
        const ok = await confirm({
            title: "스냅샷 일괄 삭제",
            description: `선택한 ${selectedSnapshots.length}개 스냅샷을 삭제하시겠습니까?`,
            confirmText: "삭제",
            cancelText: "취소",
            variant: "destructive",
        });
        if (!ok) return;
        setBatchDeleting(true);
        setRestoreMsg(null);
        const res = await deleteSnapshots(
            selectedSnapshots.map((snap) => snap.id)
        );
        setBatchDeleting(false);
        if ("error" in res) {
            const firstId = selectedSnapshots[0]?.id;
            if (firstId) {
                setRestoreMsg({ id: firstId, ok: false, msg: res.error });
            }
            return;
        }
        const removedIds = new Set(selectedSnapshots.map((snap) => snap.id));
        setExpanded((prev) => (prev && removedIds.has(prev) ? null : prev));
        setSnapshots((prev) => prev.filter((snap) => !removedIds.has(snap.id)));
        setSelectedIds(new Set());
    };

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
            {/* 헤더 + 필터 — 스크롤 중에도 상단 고정 */}
            <div className="sticky top-0 z-10 shrink-0 space-y-4 bg-(--color-surface) pb-3">
                <div>
                    <h2 className="mb-1 text-3xl font-bold tracking-tight text-(--color-foreground)">
                        콘텐츠 스냅샷
                    </h2>
                    <div className="space-y-1 text-sm text-(--color-muted)">
                        <p>
                            MCP 에이전트가 `posts`, `portfolio_items`,
                            `resume_data`를 수정하기 직전에 현재 레코드 전체를
                            자동 백업한 스냅샷.
                        </p>
                        <p>
                            레코드당 최근 20개만 유지됩니다. `복원`은 해당
                            스냅샷의 JSON으로 같은 `id` 레코드를 그대로
                            덮어씁니다.
                        </p>
                        <p>
                            현재 코드 기준으로 admin 일반 저장 작업은 이 목록에
                            자동 기록되지 않습니다.
                        </p>
                    </div>
                </div>

                {/* 필터 + 새로고침 */}
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={tableFilter}
                        onChange={(e) => setTableFilter(e.target.value)}
                        className="rounded-lg border border-(--color-border) bg-(--color-surface-subtle) px-3 py-2 text-sm text-(--color-foreground) focus:ring-2 focus:ring-(--color-accent) focus:outline-none"
                    >
                        {TABLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <Button
                        size="sm"
                        onClick={load}
                        disabled={loading}
                        className={refreshButtonClassName}
                    >
                        <RefreshCw
                            className={`mr-2 h-4 w-4 shrink-0 ${
                                loading ? "animate-spin" : ""
                            }`}
                        />
                        {loading ? "새로고침 중..." : "새로고침"}
                    </Button>
                </div>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
                {/* 스냅샷 목록 */}
                {snapshots.length === 0 && !loading && (
                    <p className="text-sm text-(--color-muted)">
                        스냅샷이 없습니다.
                    </p>
                )}

                {snapshots.length > 0 && (
                    <div className="mb-4 flex flex-wrap items-center gap-3 px-1">
                        <label className="flex items-center gap-2 text-sm font-medium text-(--color-foreground)">
                            <input
                                ref={selectAllRef}
                                type="checkbox"
                                checked={allSelected}
                                onChange={toggleSelectAll}
                                className="h-4 w-4 accent-(--color-accent)"
                            />
                            전체 선택
                        </label>
                        <span className="text-sm text-(--color-muted)">
                            {selectedIds.size}개 선택
                        </span>
                        <Button
                            size="sm"
                            onClick={handleBatchDelete}
                            disabled={selectedIds.size === 0 || batchDeleting}
                            className="ml-auto bg-red-600 text-white hover:bg-red-500 dark:bg-red-600 dark:text-white dark:hover:bg-red-500"
                        >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                            <span className="whitespace-nowrap">
                                {batchDeleting ? "삭제 중..." : "선택 삭제"}
                            </span>
                        </Button>
                    </div>
                )}

                <div className="space-y-3">
                    {snapshots.map((snap) => {
                        const isExpanded = expanded === snap.id;
                        const msg =
                            restoreMsg?.id === snap.id ? restoreMsg : null;
                        return (
                            <div
                                key={snap.id}
                                className="space-y-2 rounded-xl border border-(--color-border) bg-(--color-surface) p-4"
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(snap.id)}
                                        onChange={() => toggleSelect(snap.id)}
                                        disabled={batchDeleting}
                                        className="h-4 w-4 accent-(--color-accent)"
                                    />
                                    <Badge variant="secondary">
                                        {snap.source_table}
                                    </Badge>
                                    <span className="font-mono text-xs text-(--color-muted)">
                                        {snap.record_id}
                                    </span>
                                    <span className="ml-auto text-xs text-(--color-muted)">
                                        {new Date(
                                            snap.created_at
                                        ).toLocaleString("ko-KR")}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() =>
                                            setExpanded(
                                                isExpanded ? null : snap.id
                                            )
                                        }
                                        className="text-xs text-(--color-accent) hover:underline"
                                    >
                                        {isExpanded
                                            ? "데이터 숨기기"
                                            : "데이터 보기"}
                                    </button>

                                    {msg && (
                                        <span
                                            className={[
                                                "text-xs font-medium",
                                                msg.ok
                                                    ? "text-green-600"
                                                    : "text-red-500",
                                            ].join(" ")}
                                        >
                                            {msg.msg}
                                        </span>
                                    )}

                                    <Button
                                        size="sm"
                                        onClick={() => handleRestore(snap)}
                                        disabled={
                                            restoring === snap.id ||
                                            deleting === snap.id ||
                                            batchDeleting
                                        }
                                        className="ml-auto bg-(--color-accent) text-(--color-on-accent) hover:opacity-90"
                                    >
                                        <RotateCcw className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                                        <span className="whitespace-nowrap">
                                            {restoring === snap.id
                                                ? "복원 중..."
                                                : "복원"}
                                        </span>
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleDelete(snap)}
                                        disabled={
                                            deleting === snap.id ||
                                            restoring === snap.id ||
                                            batchDeleting
                                        }
                                        className="bg-red-600 text-white hover:bg-red-500 dark:bg-red-600 dark:text-white dark:hover:bg-red-500"
                                    >
                                        <Trash2 className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                                        <span className="whitespace-nowrap">
                                            {deleting === snap.id
                                                ? "삭제 중..."
                                                : "삭제"}
                                        </span>
                                    </Button>
                                </div>

                                {isExpanded && (
                                    <pre className="mt-2 overflow-x-auto rounded-lg bg-(--color-surface-subtle) p-3 text-xs leading-relaxed text-(--color-foreground)">
                                        {JSON.stringify(snap.data, null, 2)}
                                    </pre>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
