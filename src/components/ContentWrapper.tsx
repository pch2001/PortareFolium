import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// 프론트엔드 콘텐츠 영역 max-width 통합 관리
const contentVariants = cva("mx-auto", {
    variants: {
        width: {
            default: "max-w-4xl desktop:max-w-6xl",
            narrow: "max-w-3xl desktop:max-w-4xl",
            wide: "max-w-5xl desktop:max-w-7xl",
            full: "max-w-full",
        },
    },
    defaultVariants: {
        width: "default",
    },
});

interface ContentWrapperProps
    extends
        React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof contentVariants> {
    as?: React.ElementType;
}

export default function ContentWrapper({
    className,
    width,
    as: Component = "div",
    children,
    ...props
}: ContentWrapperProps) {
    return (
        <Component
            className={cn(contentVariants({ width }), className)}
            {...props}
        >
            {children}
        </Component>
    );
}

export { contentVariants };
