import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useBottomSheet — iOS-style bottom sheet with finger-following drag and snap points.
 *
 * Snap positions (as % of viewport height from the BOTTOM):
 *   - COLLAPSED: only the drag handle + mini header visible (~80px)
 *   - HALF:      ~65% of viewport height
 *   - FULL:      full viewport height (minus nav)
 *
 * Returns:
 *   - sheetStyle:  inline style to apply to the panel element
 *   - handleProps: spread onto the drag handle element
 *   - snapState:   'collapsed' | 'half' | 'full'
 *   - isDragging:  true while finger is down
 */

const COLLAPSED_PX = 80;          // visible pixels when collapsed
const VELOCITY_THRESHOLD = 0.4;   // px/ms — fast flick threshold

export function useBottomSheet(navHeight = 52) {
    const [snapState, setSnapState] = useState('half');
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0); // px offset from snap position during drag

    const dragData = useRef({
        startY: 0,
        startTime: 0,
        startTranslateY: 0,
        currentY: 0,
        panelHeight: 0,
        viewportHeight: 0,
    });

    // Compute the translateY for a given snap state
    const getTranslateY = useCallback((state, vh) => {
        const fullHeight = vh - navHeight;
        switch (state) {
            case 'full':
                return 0; // panel top is at nav bottom
            case 'half':
                return fullHeight * 0.35; // show 65%
            case 'collapsed':
                return fullHeight - COLLAPSED_PX;
            default:
                return fullHeight * 0.35;
        }
    }, [navHeight]);

    // Get the snap points in translateY values (sorted ascending = full, half, collapsed)
    const getSnapPoints = useCallback((vh) => {
        const fullHeight = vh - navHeight;
        return [
            { state: 'full', ty: 0 },
            { state: 'half', ty: fullHeight * 0.35 },
            { state: 'collapsed', ty: fullHeight - COLLAPSED_PX },
        ];
    }, [navHeight]);

    const handleTouchStart = useCallback((e) => {
        const touch = e.touches[0];
        const vh = window.innerHeight;
        const currentTY = getTranslateY(snapState, vh);

        dragData.current = {
            startY: touch.clientY,
            startTime: Date.now(),
            startTranslateY: currentTY,
            currentY: touch.clientY,
            panelHeight: vh - navHeight,
            viewportHeight: vh,
        };

        setIsDragging(true);
        setDragOffset(0);
    }, [snapState, getTranslateY, navHeight]);

    const handleTouchMove = useCallback((e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        dragData.current.currentY = touch.clientY;

        const dy = touch.clientY - dragData.current.startY;
        let newTY = dragData.current.startTranslateY + dy;

        // Clamp: don't go above full (0) or below collapsed
        const maxTY = dragData.current.panelHeight - COLLAPSED_PX;
        newTY = Math.max(0, Math.min(maxTY, newTY));

        // Small rubber-band effect at edges
        setDragOffset(newTY - dragData.current.startTranslateY);
    }, [isDragging]);

    const handleTouchEnd = useCallback(() => {
        if (!isDragging) return;

        const { startY, startTime, startTranslateY, currentY, viewportHeight } = dragData.current;
        const dy = currentY - startY;
        const dt = Date.now() - startTime;
        const velocity = dy / Math.max(dt, 1); // px/ms

        let newTY = startTranslateY + dy;
        const maxTY = (viewportHeight - navHeight) - COLLAPSED_PX;
        newTY = Math.max(0, Math.min(maxTY, newTY));

        const snaps = getSnapPoints(viewportHeight);

        // If velocity is high, snap in the direction of the flick
        let targetSnap;
        if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
            const currentIdx = snaps.findIndex(s => s.state === snapState);
            if (velocity > 0) {
                // Swiping down → next more-collapsed state
                targetSnap = snaps[Math.min(currentIdx + 1, snaps.length - 1)];
            } else {
                // Swiping up → next more-expanded state
                targetSnap = snaps[Math.max(currentIdx - 1, 0)];
            }
        } else {
            // Snap to nearest
            let minDist = Infinity;
            for (const snap of snaps) {
                const dist = Math.abs(newTY - snap.ty);
                if (dist < minDist) {
                    minDist = dist;
                    targetSnap = snap;
                }
            }
        }

        setSnapState(targetSnap.state);
        setIsDragging(false);
        setDragOffset(0);
    }, [isDragging, snapState, getSnapPoints, navHeight]);

    // Clean up listeners on unmount
    useEffect(() => {
        if (!isDragging) return;

        const onMove = (e) => {
            const touch = e.touches[0];
            dragData.current.currentY = touch.clientY;
            const dy = touch.clientY - dragData.current.startY;
            let newTY = dragData.current.startTranslateY + dy;
            const maxTY = dragData.current.panelHeight - COLLAPSED_PX;
            newTY = Math.max(0, Math.min(maxTY, newTY));
            setDragOffset(newTY - dragData.current.startTranslateY);
        };

        const onEnd = () => {
            handleTouchEnd();
        };

        // Use window listeners for better tracking when finger moves outside handle
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onEnd);
        window.addEventListener('touchcancel', onEnd);

        return () => {
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onEnd);
            window.removeEventListener('touchcancel', onEnd);
        };
    }, [isDragging, handleTouchEnd]);

    // Compute current translateY
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const baseTY = getTranslateY(snapState, vh);
    let currentTY = baseTY;

    if (isDragging) {
        currentTY = baseTY + dragOffset;
        const maxTY = (vh - navHeight) - COLLAPSED_PX;
        currentTY = Math.max(0, Math.min(maxTY, currentTY));
    }

    const sheetStyle = {
        transform: `translateY(${currentTY}px)`,
        transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        willChange: 'transform',
        height: `calc(100dvh - ${navHeight}px)`,
    };

    const handleProps = {
        onTouchStart: handleTouchStart,
        style: { touchAction: 'none' },
    };

    return {
        sheetStyle,
        handleProps,
        snapState,
        setSnapState,
        isDragging,
    };
}
