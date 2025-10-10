import {
  Children,
  cloneElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { FocusEvent, PointerEvent, ReactElement, Ref } from "react";

type TooltipPlacement = "top" | "bottom";

type TooltipProps = {
  label: string;
  placement?: TooltipPlacement;
  children: ReactElement;
};

type Coords = {
  top: number;
  left: number;
};

function assignRef<T>(ref: Ref<T>, value: T) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref && typeof ref === "object") {
    (ref as { current: T | null }).current = value;
  }
}

export function Tooltip({
  label,
  placement = "bottom",
  children,
}: TooltipProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipId = useId();
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [resolvedPlacement, setResolvedPlacement] =
    useState<TooltipPlacement>(placement);

  const child = Children.only(children) as ReactElement;

  const show = () => setIsVisible(true);
  const hide = () => setIsVisible(false);

  useEffect(() => {
    if (!isVisible) {
      setResolvedPlacement(placement);
    }
  }, [placement, isVisible]);

  useLayoutEffect(() => {
    if (!isVisible || !triggerRef.current) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const baseLeft = rect.left + window.scrollX + rect.width / 2;
      const offset = 8;
      setCoords({
        top:
          resolvedPlacement === "bottom"
            ? rect.bottom + window.scrollY + offset
            : rect.top + window.scrollY - offset,
        left: baseLeft,
      });
    };

    updatePosition();

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible, resolvedPlacement]);

  useLayoutEffect(() => {
    if (!isVisible || !coords || !tooltipRef.current) return;

    const tooltipHeight = tooltipRef.current.offsetHeight;
    const viewportTop = window.scrollY;
    const viewportBottom = window.scrollY + window.innerHeight;

    if (
      resolvedPlacement === "top" &&
      coords.top - tooltipHeight < viewportTop + 4
    ) {
      setResolvedPlacement("bottom");
    }

    if (
      resolvedPlacement === "bottom" &&
      coords.top + tooltipHeight > viewportBottom - 4
    ) {
      setResolvedPlacement("top");
    }
  }, [coords, isVisible, resolvedPlacement]);

  useEffect(() => {
    if (!isVisible) {
      setCoords(null);
    }
  }, [isVisible]);

  if (typeof document === "undefined") return children;

  const childProps = child.props as {
    onPointerEnter?: (event: PointerEvent<HTMLElement>) => void;
    onPointerLeave?: (event: PointerEvent<HTMLElement>) => void;
    onFocus?: (event: FocusEvent<HTMLElement>) => void;
    onBlur?: (event: FocusEvent<HTMLElement>) => void;
    ["aria-describedby"]?: string;
  };

  const handlePointerEnter = (event: PointerEvent<HTMLElement>) => {
    childProps.onPointerEnter?.(event);
    if (!event.isPropagationStopped()) {
      show();
    }
  };

  const handlePointerLeave = (event: PointerEvent<HTMLElement>) => {
    childProps.onPointerLeave?.(event);
    if (!event.isPropagationStopped()) {
      hide();
    }
  };

  const handleFocus = (event: FocusEvent<HTMLElement>) => {
    childProps.onFocus?.(event);
    if (!event.isPropagationStopped()) {
      show();
    }
  };

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    childProps.onBlur?.(event);
    if (!event.isPropagationStopped()) {
      hide();
    }
  };

  const describedBy = [childProps["aria-describedby"], tooltipId]
    .filter(Boolean)
    .join(" ");

  const clonedChild = cloneElement(child, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const existingRef = (
        child as unknown as { ref?: Ref<HTMLElement | null> }
      ).ref;
      if (existingRef) {
        assignRef(existingRef, node);
      }
    },
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    "aria-describedby": describedBy,
  } as any);

  return (
    <>
      {clonedChild}
      {isVisible && coords
        ? createPortal(
            <div
              role="tooltip"
              id={tooltipId}
              className="pointer-events-none fixed z-50"
              style={{
                top: coords.top,
                left: coords.left,
                transform:
                  resolvedPlacement === "bottom"
                    ? "translate(-50%, 0)"
                    : "translate(-50%, -100%)",
              }}
              ref={(node) => {
                tooltipRef.current = node;
              }}
            >
              <div className="rounded-md bg-black px-2 py-1 text-xs font-medium text-white shadow-lg">
                {label}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
