/**
 * Glare Cards - Holographic 3D tilt effect
 * Vanilla JS version of the React GlareCard component
 */

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.glare-card');
    
    cards.forEach(card => {
        let isPointerInside = false;
        
        card.addEventListener('pointermove', (e) => {
            const rect = card.getBoundingClientRect();
            const rotateFactor = 0.4;
            
            const position = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
            
            const percentage = {
                x: (100 / rect.width) * position.x,
                y: (100 / rect.height) * position.y,
            };
            
            const delta = {
                x: percentage.x - 50,
                y: percentage.y - 50,
            };
            
            const bgX = 50 + percentage.x / 4 - 12.5;
            const bgY = 50 + percentage.y / 3 - 16.67;
            const rotateX = -(delta.x / 3.5) * rotateFactor;
            const rotateY = (delta.y / 2) * rotateFactor;
            const glareX = percentage.x;
            const glareY = percentage.y;
            
            card.style.setProperty('--m-x', `${glareX}%`);
            card.style.setProperty('--m-y', `${glareY}%`);
            card.style.setProperty('--r-x', `${rotateX}deg`);
            card.style.setProperty('--r-y', `${rotateY}deg`);
            card.style.setProperty('--bg-x', `${bgX}%`);
            card.style.setProperty('--bg-y', `${bgY}%`);
        });
        
        card.addEventListener('pointerenter', () => {
            isPointerInside = true;
            setTimeout(() => {
                if (isPointerInside) {
                    card.style.setProperty('--duration', '0s');
                }
            }, 300);
        });
        
        card.addEventListener('pointerleave', () => {
            isPointerInside = false;
            card.style.removeProperty('--duration');
            card.style.setProperty('--r-x', '0deg');
            card.style.setProperty('--r-y', '0deg');
        });
    });
});
