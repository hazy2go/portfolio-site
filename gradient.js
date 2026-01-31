/**
 * Animated Gradient Background - Vanilla JS
 * Breathing radial gradient effect, converted from React component
 */

function createAnimatedGradient(options = {}) {
    const config = {
        startingGap: options.startingGap || 125,
        breathing: options.breathing !== undefined ? options.breathing : true,
        gradientColors: options.gradientColors || [
            "#0A0A0A",
            "#6366f1",  // Indigo (matches your accent)
            "#a855f7",  // Purple
            "#3b82f6",  // Blue
            "#0A0A0A"
        ],
        gradientStops: options.gradientStops || [20, 45, 60, 75, 100],
        animationSpeed: options.animationSpeed || 0.015,
        breathingRange: options.breathingRange || 8,
        topOffset: options.topOffset || 0,
        targetSelector: options.targetSelector || '.hero',
        fadeInDuration: options.fadeInDuration || 2000
    };

    // Create gradient container
    const container = document.createElement('div');
    container.className = 'animated-gradient-bg';
    
    const gradientDiv = document.createElement('div');
    gradientDiv.className = 'animated-gradient-inner';
    container.appendChild(gradientDiv);

    // Find target and insert
    const target = document.querySelector(config.targetSelector);
    if (!target) {
        console.warn('Gradient target not found:', config.targetSelector);
        return null;
    }
    target.insertBefore(container, target.firstChild);

    // Animation state
    let width = config.startingGap;
    let direction = 1;
    let animationFrame;
    let startTime = null;

    function buildGradientString(w) {
        const stops = config.gradientStops
            .map((stop, i) => `${config.gradientColors[i]} ${stop}%`)
            .join(', ');
        return `radial-gradient(${w}% ${w + config.topOffset}% at 50% 30%, ${stops})`;
    }

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        // Fade in effect
        if (elapsed < config.fadeInDuration) {
            const progress = elapsed / config.fadeInDuration;
            const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            container.style.opacity = eased;
            const scale = 1.3 - (0.3 * eased); // Scale from 1.3 to 1
            gradientDiv.style.transform = `scale(${scale})`;
        } else {
            container.style.opacity = 1;
            gradientDiv.style.transform = 'scale(1)';
        }

        // Breathing animation
        if (config.breathing) {
            if (width >= config.startingGap + config.breathingRange) direction = -1;
            if (width <= config.startingGap - config.breathingRange) direction = 1;
            width += direction * config.animationSpeed;
        }

        gradientDiv.style.background = buildGradientString(width);
        animationFrame = requestAnimationFrame(animate);
    }

    // Start animation
    container.style.opacity = 0;
    animationFrame = requestAnimationFrame(animate);

    // Return cleanup function
    return {
        destroy: () => {
            cancelAnimationFrame(animationFrame);
            container.remove();
        },
        setBreathing: (val) => { config.breathing = val; },
        setColors: (colors, stops) => {
            if (colors) config.gradientColors = colors;
            if (stops) config.gradientStops = stops;
        }
    };
}

// Auto-init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.heroGradient = createAnimatedGradient({
        breathing: true,
        animationSpeed: 0.02,
        breathingRange: 10,
        startingGap: 120,
        // Colors: dark center → accent colors → dark edges
        gradientColors: [
            "#0a0a0f",
            "#1a1a2e", 
            "#6366f1",  // Indigo
            "#a855f7",  // Purple  
            "#0a0a0f"
        ],
        gradientStops: [0, 30, 55, 75, 100]
    });
});
