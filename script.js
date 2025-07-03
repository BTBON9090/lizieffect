const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const mouse = {
    x: undefined,
    y: undefined,
};

let particles = [];
let gridColumns, gridRows;

// Control inputs
const particleColorInput = document.getElementById('particle-color');
const lineColorInput = document.getElementById('line-color');
const particleAmountInput = document.getElementById('particle-amount');
const mouseRadiusInput = document.getElementById('mouse-radius');
const particleSizeInput = document.getElementById('particle-size');
const blurrinessInput = document.getElementById('blurriness');
const differenceInput = document.getElementById('difference');

// Initial values from controls
let particleColor = particleColorInput.value;
let lineColor = lineColorInput.value;
let numberOfParticles = particleAmountInput.value;
let mouseRadius = mouseRadiusInput.value;
let particleSize = particleSizeInput.value;
let blurriness = blurrinessInput.value;
let difference = differenceInput.value;

// Event listeners for controls
particleColorInput.addEventListener('change', (e) => particleColor = e.target.value);
lineColorInput.addEventListener('change', (e) => lineColor = e.target.value);
particleAmountInput.addEventListener('input', (e) => {
    numberOfParticles = e.target.value;
    init();
});
mouseRadiusInput.addEventListener('input', (e) => mouseRadius = e.target.value);
particleSizeInput.addEventListener('input', (e) => {
    particleSize = e.target.value;
    init(); // Re-initialize to apply new size logic
});
blurrinessInput.addEventListener('input', (e) => blurriness = e.target.value);
differenceInput.addEventListener('input', (e) => {
    difference = e.target.value;
    init(); // Re-initialize to apply new difference logic
});

// Mouse and window events
window.addEventListener('mousemove', (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
});

window.addEventListener('mouseout', () => {
    mouse.x = undefined;
    mouse.y = undefined;
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
});

// Helper function to convert hex to RGB
function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

class Particle {
    constructor(x, y, col, row) {
        this.originX = x;
        this.originY = y;
        this.x = x;
        this.y = y;
        this.col = col;
        this.row = row;
        this.z = Math.random() * difference; // Depth controlled by difference slider
        this.size = (1 - this.z) * particleSize + 1;
        this.opacity = (1 - this.z) * 0.8 + 0.2;
    }

    draw() {
        const rgbParticleColor = hexToRgb(particleColor);
        if (!rgbParticleColor) return;

        ctx.fillStyle = `rgba(${rgbParticleColor.r}, ${rgbParticleColor.g}, ${rgbParticleColor.b}, ${this.opacity})`;
        ctx.shadowBlur = blurriness;
        ctx.shadowColor = particleColor;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Reset shadow for other elements
        ctx.shadowBlur = 0;
    }

    update() {
        if (mouse.x !== undefined && mouse.y !== undefined) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;

            if (distance < mouseRadius) {
                const force = (mouseRadius - distance) / mouseRadius;
                this.x += forceDirectionX * force * 15;
                this.y += forceDirectionY * force * 15;
            } else {
                this.returnToOrigin();
            }
        } else {
            this.returnToOrigin();
        }
    }

    returnToOrigin() {
        if (this.x !== this.originX || this.y !== this.originY) {
            const dx_origin = this.originX - this.x;
            const dy_origin = this.originY - this.y;
            this.x += dx_origin * 0.1; // Easing back to origin
            this.y += dy_origin * 0.1;
        }
    }
}

function init() {
    particles = [];
    const density = 60 - ((numberOfParticles - 50) / 450) * 45; // Map slider (50-500) to density (60-15)
    gridColumns = Math.floor(canvas.width / density);
    gridRows = Math.floor(canvas.height / density);
    const colGap = canvas.width / gridColumns;
    const rowGap = canvas.height / gridRows;

    for (let i = 0; i < gridRows; i++) {
        for (let j = 0; j < gridColumns; j++) {
            const x = j * colGap + (colGap / 2);
            const y = i * rowGap + (rowGap / 2);
            particles.push(new Particle(x, y, j, i));
        }
    }
}

function connect() {
    const rgbLineColor = hexToRgb(lineColor);
    if (!rgbLineColor) return;

    for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        // Connect to right neighbor
        if (p1.col < gridColumns - 1) {
            const p2 = particles[i + 1];
            drawConnection(p1, p2, rgbLineColor);
        }

        // Connect to bottom neighbor
        if (p1.row < gridRows - 1) {
            const p2 = particles[i + gridColumns];
            drawConnection(p1, p2, rgbLineColor);
        }
    }
}

function drawConnection(p1, p2, color) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 150; // Maximum distance to draw a line

    if (distance < maxDist) {
        const opacity = 1 - (distance / maxDist);
        const avgOpacity = (p1.opacity + p2.opacity) / 2;
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * avgOpacity})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const particle of particles) {
        particle.update();
        particle.draw();
    }
    connect();
}

init();
animate();