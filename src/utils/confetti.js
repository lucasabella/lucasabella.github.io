import confetti from 'canvas-confetti';

export function fireVisitConfetti(event) {
    // Try to fire from the button's position if event is provided
    let origin = { x: 0.5, y: 0.5 };
    if (event && event.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect();
        origin = {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
        };
    }

    confetti({
        particleCount: 40,
        spread: 60,
        origin,
        colors: ['#2C6E49', '#4C956C', '#FEFEE3', '#FFC9B9', '#D68C45'],
        disableForReducedMotion: true,
    });
}

export function fireCompletionConfetti() {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
            ...defaults, particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['#2C6E49', '#4C956C', '#FEFEE3', '#FFC9B9', '#D68C45', '#D4522A']
        });
        confetti({
            ...defaults, particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#2C6E49', '#4C956C', '#FEFEE3', '#FFC9B9', '#D68C45', '#D4522A']
        });
    }, 250);
}
