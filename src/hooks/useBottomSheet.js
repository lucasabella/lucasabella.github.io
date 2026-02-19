import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';

/**
 * useBottomSheet — iOS-style bottom sheet with finger-following drag.
 *
 * Snap positions (translateY from top of the panel element):
 *   collapsed — only drag handle visible (~80px from bottom)
 *   half      — 65% of panel height visible
 *   full      — entire panel visible
 *
 * All transform manipulation is done imperatively on the DOM.
 * The component should NOT set any inline `style.transform` on the panel.
 */

const COLLAPSED_PX = 80;
const VELOCITY_THRESHOLD = 0.4;   // px/ms
const SNAP_TRANSITION = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)';

function getTranslateY(state, panelHeight) {
    switch (state) {
        case 'full': return 0;
        case 'half': return panelHeight * 0.35;
        case 'collapsed': return panelHeight - COLLAPSED_PX;
        default: return panelHeight * 0.35;
    }
}

function isMobile() {
    return window.innerWidth <= 768;
}

function readCurrentTranslateY(el) {
    const style = window.getComputedStyle(el);
    if (!style.transform || style.transform === 'none') return 0;
    const matrix = new DOMMatrix(style.transform);
    return matrix.m42;
}

export function useBottomSheet(navHeight = 52) {
    const [snapState, setSnapState] = useState('half');

    const panelEl = useRef(null);
    const dragHandleEl = useRef(null);
    const snapStateRef = useRef(snapState);
    snapStateRef.current = snapState;
    const justSnappedRef = useRef(false);

    const drag = useRef({
        active: false,
        startY: 0,
        startTime: 0,
        startTranslateY: 0,
        panelHeight: 0,
    });

    // ── Touch handlers (stable refs — no closures over state) ──────────────
    const onTouchStart = useCallback((e) => {
        if (!panelEl.current || !isMobile()) return;

        const touch = e.touches[0];
        const panelHeight = window.innerHeight - navHeight;
        const startTranslateY = readCurrentTranslateY(panelEl.current);

        drag.current = {
            active: true,
            startY: touch.clientY,
            startTime: Date.now(),
            startTranslateY,
            panelHeight,
        };

        panelEl.current.style.transition = 'none';
        if (dragHandleEl.current) {
            dragHandleEl.current.classList.add('panel__drag-handle--active');
        }
    }, [navHeight]);

    const onTouchMove = useCallback((e) => {
        if (!drag.current.active || !panelEl.current) return;

        const touch = e.touches[0];
        const dy = touch.clientY - drag.current.startY;
        let newTY = drag.current.startTranslateY + dy;
        const maxTY = drag.current.panelHeight - COLLAPSED_PX;
        newTY = Math.max(0, Math.min(maxTY, newTY));

        panelEl.current.style.transform = `translateY(${newTY}px)`;
    }, []);

    const onTouchEnd = useCallback((e) => {
        if (!drag.current.active) return;
        drag.current.active = false;

        const endY = e.changedTouches?.[0]?.clientY ?? drag.current.startY;
        const dy = endY - drag.current.startY;
        const dt = Date.now() - drag.current.startTime;
        const velocity = dy / Math.max(dt, 1);
        const { panelHeight, startTranslateY } = drag.current;

        let newTY = startTranslateY + dy;
        const maxTY = panelHeight - COLLAPSED_PX;
        newTY = Math.max(0, Math.min(maxTY, newTY));

        const snaps = [
            { state: 'full', ty: 0 },
            { state: 'half', ty: panelHeight * 0.35 },
            { state: 'collapsed', ty: panelHeight - COLLAPSED_PX },
        ];

        let targetSnap;
        if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
            const idx = snaps.findIndex(s => s.state === snapStateRef.current);
            if (velocity > 0) {
                targetSnap = snaps[Math.min(idx + 1, snaps.length - 1)];
            } else {
                targetSnap = snaps[Math.max(idx - 1, 0)];
            }
        } else {
            let minDist = Infinity;
            for (const snap of snaps) {
                const dist = Math.abs(newTY - snap.ty);
                if (dist < minDist) {
                    minDist = dist;
                    targetSnap = snap;
                }
            }
        }

        justSnappedRef.current = true;
        if (panelEl.current) {
            panelEl.current.style.transition = SNAP_TRANSITION;
            panelEl.current.style.transform = `translateY(${targetSnap.ty}px)`;
        }
        if (dragHandleEl.current) {
            dragHandleEl.current.classList.remove('panel__drag-handle--active');
        }
        setSnapState(targetSnap.state);
    }, []);

    // ── Callback ref for the panel ─────────────────────────────────────────
    const panelRef = useCallback((node) => {
        panelEl.current = node;
        if (!node || !isMobile()) return;
        const panelHeight = window.innerHeight - navHeight;
        const ty = getTranslateY('half', panelHeight);
        node.style.transition = 'none';
        node.style.transform = `translateY(${ty}px)`;
    }, [navHeight]);

    // ── Callback ref for the drag handle ───────────────────────────────────
    // Attaches touchstart listener here so it fires even if the element
    // mounts after a loading state. Also cleans up if the ref detaches.
    const prevHandleRef = useRef(null);
    const dragHandleRef = useCallback((node) => {
        // Clean up old listener
        if (prevHandleRef.current) {
            prevHandleRef.current.removeEventListener('touchstart', onTouchStart);
        }
        dragHandleEl.current = node;
        prevHandleRef.current = node;
        if (node) {
            node.addEventListener('touchstart', onTouchStart, { passive: true });
        }
    }, [onTouchStart]);

    // ── Window-level touchmove + touchend (attached once on mount) ─────────
    useEffect(() => {
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onTouchEnd);
        window.addEventListener('touchcancel', onTouchEnd);

        return () => {
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
            window.removeEventListener('touchcancel', onTouchEnd);
        };
    }, [onTouchMove, onTouchEnd]);

    // ── Sync transform when snapState changes externally ───────────────────
    useLayoutEffect(() => {
        if (!panelEl.current || !isMobile()) return;
        if (justSnappedRef.current) {
            justSnappedRef.current = false;
            return;
        }
        const panelHeight = window.innerHeight - navHeight;
        const ty = getTranslateY(snapState, panelHeight);
        panelEl.current.style.transition = SNAP_TRANSITION;
        panelEl.current.style.transform = `translateY(${ty}px)`;
    }, [snapState, navHeight]);

    // ── Cleanup touchstart on unmount ──────────────────────────────────────
    useEffect(() => {
        return () => {
            if (prevHandleRef.current) {
                prevHandleRef.current.removeEventListener('touchstart', onTouchStart);
            }
        };
    }, [onTouchStart]);

    return {
        panelRef,
        dragHandleRef,
        snapState,
        setSnapState,
    };
}
