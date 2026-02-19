import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';

/**
 * useBottomSheet — iOS-style bottom sheet with three snap positions.
 *
 * Performance: transform during drag is applied directly to the DOM,
 * completely bypassing React state updates. React is only notified once
 * on finger-lift to record the final snap position.
 *
 * Snap positions (translateY from bottom of nav):
 *   collapsed — only drag handle visible (~80px)
 *   half      — 65% of viewport height
 *   full      — full height (minus nav)
 */

const COLLAPSED_PX = 80;
const VELOCITY_THRESHOLD = 0.4; // px/ms
const SNAP_TRANSITION = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)';

function getTranslateYForState(state, panelHeight) {
    switch (state) {
        case 'full':      return 0;
        case 'half':      return panelHeight * 0.35;
        case 'collapsed': return panelHeight - COLLAPSED_PX;
        default:          return panelHeight * 0.35;
    }
}

/** Read the element's actual current translateY (works mid-animation). */
function readCurrentTranslateY(el) {
    const computed = window.getComputedStyle(el).transform;
    if (!computed || computed === 'none') return 0;
    const matrix = new DOMMatrix(computed);
    return matrix.m42; // Y translation in px
}

export function useBottomSheet(navHeight = 52) {
    const [snapState, setSnapState] = useState('half');

    // Internal DOM reference — updated via callback ref so it's set
    // even when the panel mounts late (after a loading state).
    const panelEl      = useRef(null);
    const dragHandleRef = useRef(null);

    // All drag state lives here — mutations never trigger re-renders.
    const drag = useRef({
        active:          false,
        startY:          0,
        startTime:       0,
        startTranslateY: 0,
        currentY:        0,
        panelHeight:     0,
    });

    // Readable in effects/callbacks without stale closures.
    const snapStateRef   = useRef(snapState);
    snapStateRef.current = snapState;

    // Prevents useLayoutEffect from overriding the transform that onEnd already set.
    const justSnappedRef = useRef(false);

    // ── Callback ref ────────────────────────────────────────────────────────────
    // Using a callback ref (instead of useRef + conditional prop) ensures the
    // initial transform is applied the moment the element enters the DOM,
    // even if that happens after a loading state change.
    const panelRef = useCallback((node) => {
        panelEl.current = node;
        if (!node || window.innerWidth > 768) return;
        // Apply initial position immediately, before first paint.
        const panelHeight = window.innerHeight - navHeight;
        const ty = getTranslateYForState(snapStateRef.current, panelHeight);
        node.style.transition = 'none';
        node.style.transform  = `translateY(${ty}px)`;
    }, [navHeight]); // navHeight=52 is constant in practice → created once

    // ── Snap-state changes (external or post-drag) ───────────────────────────
    useLayoutEffect(() => {
        if (!panelEl.current || window.innerWidth > 768) return;
        if (justSnappedRef.current) {
            // onEnd already animated to the correct position — skip override.
            justSnappedRef.current = false;
            return;
        }
        const panelHeight = window.innerHeight - navHeight;
        const ty = getTranslateYForState(snapState, panelHeight);
        panelEl.current.style.transition = SNAP_TRANSITION;
        panelEl.current.style.transform  = `translateY(${ty}px)`;
    }, [snapState, navHeight]);

    // ── Touchstart on drag handle ────────────────────────────────────────────
    useEffect(() => {
        const handle = dragHandleRef.current;
        if (!handle) return;

        const onStart = (e) => {
            const touch       = e.touches[0];
            const panelHeight = window.innerHeight - navHeight;

            // Read the actual visual position (works correctly mid-animation).
            const startTranslateY = panelEl.current
                ? readCurrentTranslateY(panelEl.current)
                : getTranslateYForState(snapStateRef.current, panelHeight);

            drag.current = {
                active:          true,
                startY:          touch.clientY,
                startTime:       Date.now(),
                startTranslateY,
                currentY:        touch.clientY,
                panelHeight,
            };

            // Remove transition so the sheet follows the finger instantly.
            if (panelEl.current) {
                panelEl.current.style.transition = 'none';
            }
            handle.classList.add('panel__drag-handle--active');
        };

        handle.addEventListener('touchstart', onStart, { passive: true });
        return () => handle.removeEventListener('touchstart', onStart);
    }, [navHeight]);

    // ── Window-level touchmove + touchend ────────────────────────────────────
    // Empty deps: runs once on mount. All mutable state accessed via refs.
    useEffect(() => {
        const onMove = (e) => {
            if (!drag.current.active || !panelEl.current) return;

            const touch = e.touches[0];
            drag.current.currentY = touch.clientY;

            const dy    = touch.clientY - drag.current.startY;
            let   newTY = drag.current.startTranslateY + dy;
            const maxTY = drag.current.panelHeight - COLLAPSED_PX;
            newTY = Math.max(0, Math.min(maxTY, newTY));

            // Direct DOM write — zero React overhead, runs at native 60fps.
            panelEl.current.style.transform = `translateY(${newTY}px)`;
        };

        const onEnd = () => {
            if (!drag.current.active) return;
            drag.current.active = false;

            const { startY, startTime, startTranslateY, currentY, panelHeight } = drag.current;

            const dy       = currentY - startY;
            const dt       = Date.now() - startTime;
            const velocity = dy / Math.max(dt, 1); // px/ms

            let   newTY = startTranslateY + dy;
            const maxTY = panelHeight - COLLAPSED_PX;
            newTY = Math.max(0, Math.min(maxTY, newTY));

            const snaps = [
                { state: 'full',      ty: 0 },
                { state: 'half',      ty: panelHeight * 0.35 },
                { state: 'collapsed', ty: panelHeight - COLLAPSED_PX },
            ];

            let targetSnap;
            if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
                // Flick: advance one snap in the direction of travel.
                const idx = snaps.findIndex(s => s.state === snapStateRef.current);
                targetSnap = velocity > 0
                    ? snaps[Math.min(idx + 1, snaps.length - 1)]
                    : snaps[Math.max(idx - 1, 0)];
            } else {
                // Slow drag: snap to nearest position.
                let minDist = Infinity;
                for (const snap of snaps) {
                    const dist = Math.abs(newTY - snap.ty);
                    if (dist < minDist) { minDist = dist; targetSnap = snap; }
                }
            }

            // Animate to snap position directly on the DOM.
            // Set justSnapped so useLayoutEffect skips the re-render update.
            justSnappedRef.current = true;
            if (panelEl.current) {
                panelEl.current.style.transition = SNAP_TRANSITION;
                panelEl.current.style.transform  = `translateY(${targetSnap.ty}px)`;
            }
            if (dragHandleRef.current) {
                dragHandleRef.current.classList.remove('panel__drag-handle--active');
            }

            // One React state update — just to record the final position.
            setSnapState(targetSnap.state);
        };

        window.addEventListener('touchmove',   onMove, { passive: true });
        window.addEventListener('touchend',    onEnd);
        window.addEventListener('touchcancel', onEnd);

        return () => {
            window.removeEventListener('touchmove',   onMove);
            window.removeEventListener('touchend',    onEnd);
            window.removeEventListener('touchcancel', onEnd);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Non-transform styles only — transform/transition managed imperatively above.
    const sheetStyle = {
        willChange: 'transform',
        height:     `calc(100dvh - ${navHeight}px)`,
    };

    return {
        panelRef,      // callback ref  — attach to the panel <aside>
        dragHandleRef, // ref object    — attach to the drag handle <div>
        sheetStyle,
        snapState,
        setSnapState,
    };
}
