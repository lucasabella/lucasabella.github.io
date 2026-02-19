import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';

/**
 * useBottomSheet — iOS-style bottom sheet with three snap positions.
 *
 * Performance: transform during drag is applied directly to the DOM via panelRef,
 * completely bypassing React state updates. React is only notified once on finger-lift
 * to record the final snap position.
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

export function useBottomSheet(navHeight = 52) {
    const [snapState, setSnapState] = useState('half');

    // DOM refs — imperative updates during drag, no React state involved
    const panelRef      = useRef(null);
    const dragHandleRef = useRef(null);

    // Drag state in a ref — never triggers re-renders
    const drag = useRef({
        active:           false,
        startY:           0,
        startTime:        0,
        startTranslateY:  0,
        currentY:         0,
        panelHeight:      0,
    });

    // Keep snapState readable inside effects without stale closures
    const snapStateRef    = useRef(snapState);
    snapStateRef.current  = snapState;

    // Prevents useLayoutEffect from overriding the transform that onEnd already set
    const justSnappedRef = useRef(false);

    // ── Apply transform when snapState changes from outside (initial mount, external snap) ──
    useLayoutEffect(() => {
        if (!panelRef.current) return;
        if (justSnappedRef.current) {
            // onEnd already animated to the correct position — skip
            justSnappedRef.current = false;
            return;
        }
        const panelHeight = window.innerHeight - navHeight;
        const ty = getTranslateYForState(snapState, panelHeight);
        panelRef.current.style.transition = SNAP_TRANSITION;
        panelRef.current.style.transform  = `translateY(${ty}px)`;
    }, [snapState, navHeight]);

    // ── Touchstart on drag handle ──
    useEffect(() => {
        const handle = dragHandleRef.current;
        if (!handle) return;

        const onStart = (e) => {
            const touch       = e.touches[0];
            const panelHeight = window.innerHeight - navHeight;

            drag.current = {
                active:          true,
                startY:          touch.clientY,
                startTime:       Date.now(),
                startTranslateY: getTranslateYForState(snapStateRef.current, panelHeight),
                currentY:        touch.clientY,
                panelHeight,
            };

            // Kill transition so the sheet follows the finger instantly
            if (panelRef.current) {
                panelRef.current.style.transition = 'none';
            }

            handle.classList.add('panel__drag-handle--active');
        };

        handle.addEventListener('touchstart', onStart, { passive: true });
        return () => handle.removeEventListener('touchstart', onStart);
    }, [navHeight]);

    // ── Window-level move / end — empty deps, all state via refs ──
    useEffect(() => {
        const onMove = (e) => {
            if (!drag.current.active || !panelRef.current) return;

            const touch = e.touches[0];
            drag.current.currentY = touch.clientY;

            const dy    = touch.clientY - drag.current.startY;
            let   newTY = drag.current.startTranslateY + dy;
            const maxTY = drag.current.panelHeight - COLLAPSED_PX;
            newTY = Math.max(0, Math.min(maxTY, newTY));

            // Direct DOM write — zero React overhead
            panelRef.current.style.transform = `translateY(${newTY}px)`;
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
                // Flick — advance one snap in the direction of travel
                const idx = snaps.findIndex(s => s.state === snapStateRef.current);
                targetSnap = velocity > 0
                    ? snaps[Math.min(idx + 1, snaps.length - 1)]
                    : snaps[Math.max(idx - 1, 0)];
            } else {
                // Slow drag — snap to nearest position
                let minDist = Infinity;
                for (const snap of snaps) {
                    const dist = Math.abs(newTY - snap.ty);
                    if (dist < minDist) { minDist = dist; targetSnap = snap; }
                }
            }

            // Apply animated snap directly — mark so useLayoutEffect skips the override
            justSnappedRef.current = true;
            if (panelRef.current) {
                panelRef.current.style.transition = SNAP_TRANSITION;
                panelRef.current.style.transform  = `translateY(${targetSnap.ty}px)`;
            }
            if (dragHandleRef.current) {
                dragHandleRef.current.classList.remove('panel__drag-handle--active');
            }

            // One React state update — just to record the final position
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

    // Non-transform styles only — transform/transition are managed imperatively above
    const sheetStyle = {
        willChange: 'transform',
        height:     `calc(100dvh - ${navHeight}px)`,
    };

    return {
        panelRef,
        dragHandleRef,
        sheetStyle,
        snapState,
        setSnapState,
    };
}
