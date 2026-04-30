import { Fragment } from "@tiptap/pm/model";
import { getHTMLFromFragment, mergeAttributes } from "@tiptap/core";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";

const cellAttributes = {
    tailwindColor: {
        default: null,
        parseHTML: (element: HTMLElement) =>
            element.getAttribute("data-tw-color") || null,
        renderHTML: (attributes: Record<string, unknown>) => {
            if (!attributes.tailwindColor) return {};
            return { "data-tw-color": attributes.tailwindColor };
        },
    },
    textAlign: {
        default: null,
        parseHTML: (element: HTMLElement) =>
            element.getAttribute("data-text-align") || null,
        renderHTML: (attributes: Record<string, unknown>) => {
            if (!attributes.textAlign) return {};
            return { "data-text-align": attributes.textAlign };
        },
    },
};

const KTableCell = TableCell.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            ...cellAttributes,
        };
    },
});

const KTableHeader = TableHeader.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            ...cellAttributes,
        };
    },
});

function formatTableBlock(html: string): string {
    return html
        .trim()
        .replace(/^(<table\b[^>]*>)([\s\S]*)(<\/table>)$/i, "$1\n$2\n$3");
}

export const KTableExtension = Table.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: "100%",
                parseHTML: (element: HTMLElement) =>
                    element.getAttribute("data-table-width") ||
                    element.getAttribute("width") ||
                    "100%",
                renderHTML: (attributes: Record<string, unknown>) => ({
                    "data-table-width": attributes.width || "100%",
                }),
            },
            bordered: {
                default: true,
                parseHTML: (element: HTMLElement) =>
                    element.getAttribute("data-table-bordered") !== "false",
                renderHTML: (attributes: Record<string, unknown>) => ({
                    "data-table-bordered":
                        attributes.bordered === false ? "false" : "true",
                }),
            },
        };
    },

    renderHTML({ HTMLAttributes }) {
        const bordered = HTMLAttributes["data-table-bordered"] !== "false";
        return [
            "table",
            mergeAttributes(HTMLAttributes, {
                "data-ktable": "true",
                class: bordered ? "ktable" : "ktable ktable-borderless",
            }),
            0,
        ];
    },

    addStorage() {
        return {
            markdown: {
                serialize(
                    this: {
                        editor: {
                            schema: unknown;
                            storage: {
                                markdown?: { options?: { html?: boolean } };
                            };
                        };
                    },
                    state: {
                        write: (value: string) => void;
                        closeBlock: (node: unknown) => void;
                    },
                    node: { type: { schema: unknown }; isBlock: boolean }
                ) {
                    if (!this.editor.storage.markdown?.options?.html) {
                        state.write("[table]");
                        state.closeBlock(node);
                        return;
                    }

                    const html = getHTMLFromFragment(
                        Fragment.from(node as never),
                        this.editor.schema as never
                    );
                    state.write(formatTableBlock(html));
                    state.closeBlock(node);
                },
                parse: {},
            },
        };
    },

    addExtensions() {
        return [TableRow, KTableHeader, KTableCell];
    },
});
