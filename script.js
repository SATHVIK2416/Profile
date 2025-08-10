// Apple-style smooth scrolling and animations
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu functionality
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.getAttribute('data-delay') || 0;
                setTimeout(() => {
                    entry.target.classList.add('animate');
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with data-animate
    document.querySelectorAll('[data-animate]').forEach(el => {
        observer.observe(el);
    });

    // Parallax effect for profile image + navbar updates (optimized)
    const parallaxElements = document.querySelectorAll('.parallax-element'); // cache once
    let ticking = false;
    const navbar = document.getElementById('navbar');
    let lastNavbarScrolled = null; // remember last state to avoid redundant style writes

    function updateParallax() {
        const scrolled = window.pageYOffset || window.scrollY || 0;

        // Parallax
        if (parallaxElements.length) {
            const speed = 0.5;
            const yPos = -(scrolled * speed);
            parallaxElements.forEach(element => {
                element.style.transform = `translate3d(0, ${yPos}px, 0)`; // GPU-accelerated
            });
        }

        // Navbar background on scroll (merged here to avoid extra scroll handler)
        if (navbar) {
            const isScrolled = scrolled > 50;
            if (isScrolled !== lastNavbarScrolled) {
                if (isScrolled) {
                    navbar.style.background = 'rgba(0, 0, 0, 0.95)';
                    navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
                } else {
                    navbar.style.background = 'rgba(0, 0, 0, 0.8)';
                    navbar.style.boxShadow = 'none';
                }
                lastNavbarScrolled = isScrolled;
            }
        }
        
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }

    // Use passive listener for better scroll perf
    window.addEventListener('scroll', requestTick, { passive: true });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Apple-style button interactions
    document.querySelectorAll('.cta-button, .skill-pill').forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.02)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add stagger animation to skills
    const skillPills = document.querySelectorAll('.skill-pill');
    skillPills.forEach((pill, index) => {
        pill.setAttribute('data-delay', index * 100);
    });

    // Lightweight custom canvas background (Vanta-like) for hero
    function createCanvasBackground(el, { lowPower = false } = {}) {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.inset = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        canvas.style.opacity = '0';
        el.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let rafId = null;
        let running = true;
        let width = 0, height = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

        function resize() {
            const rect = el.getBoundingClientRect();
            width = Math.max(200, Math.floor(rect.width));
            height = Math.max(200, Math.floor(rect.height));
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
        resize();

        // Branch field parameters
        let branchCount = lowPower ? 12 : 22;
        let targetFPS = lowPower ? 30 : 60;
        const branches = [];

        function rand(min, max) { return Math.random() * (max - min) + min; }
        function initBranches() {
            branches.length = 0;
            for (let i = 0; i < branchCount; i++) {
                const x = rand(width * 0.15, width * 0.85);
                const y = rand(height * 0.55, height * 0.98);
                const speed = rand(0.15, 0.5) * (lowPower ? 0.7 : 1);
                const angle = rand(-Math.PI * 0.05, Math.PI * 0.05);
                branches.push({ x, y, baseX: x, baseY: y, t: rand(0, 1000), speed, angle, len: rand(80, 160) });
            }
        }
    initBranches();

        // Simple pseudo noise using sine combinations
        function noise(n) { return Math.sin(n * 0.013) + Math.sin(n * 0.021) * 0.5 + Math.sin(n * 0.037) * 0.25; }

        let lastTime = performance.now();
        let acc = 0;
        const frameInterval = 1000 / targetFPS;

        function draw(now) {
            if (!running) return;
            rafId = requestAnimationFrame(draw);
            const dt = Math.min(100, now - lastTime);
            lastTime = now;
            acc += dt;
            if (acc < frameInterval) return; // frame skip to target fps
            acc -= frameInterval;

            // Fade the canvas slightly for trails
            ctx.fillStyle = 'rgba(0,0,0,0.06)';
            ctx.fillRect(0, 0, width, height);

            // Draw branches upward with gentle sway
            for (let i = 0; i < branches.length; i++) {
                const b = branches[i];
                b.t += b.speed * (lowPower ? 0.7 : 1);
                const sway = noise(b.t) * 24;
                const thickness = lowPower ? 0.6 : 0.9;
                ctx.strokeStyle = 'rgba(255,255,255,0.35)';
                ctx.lineWidth = thickness;
                ctx.beginPath();
                const segs = 24;
                for (let s = 0; s <= segs; s++) {
                    const p = s / segs;
                    const nx = b.baseX + Math.sin(p * Math.PI) * sway;
                    const ny = b.baseY - p * b.len;
                    if (s === 0) ctx.moveTo(nx, ny);
                    else ctx.lineTo(nx, ny);
                }
                ctx.stroke();

                // Slight drift at base to create life
                b.baseX += Math.sin(b.t * 0.003 + i) * 0.08;
                b.baseY += Math.cos(b.t * 0.002 + i) * 0.05;

                // Reset branch if out of bounds
                if (b.baseY - b.len < -20) {
                    b.baseX = rand(width * 0.15, width * 0.85);
                    b.baseY = height + rand(0, 40);
                    b.len = rand(80, 160);
                    b.t = rand(0, 1000);
                }
            }
        }

        function onResize() {
            resize();
            // Re-init branches to adapt density/sizes
            initBranches();
        }

        window.addEventListener('resize', onResize, { passive: true });
        rafId = requestAnimationFrame(draw);

        return {
            setLowPower(v) {
                lowPower = !!v;
                branchCount = lowPower ? 12 : 22;
                targetFPS = lowPower ? 30 : 60;
                initBranches();
            },
            destroy() {
                running = false;
                if (rafId) cancelAnimationFrame(rafId);
                window.removeEventListener('resize', onResize);
                if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
            },
            canvas
        };
    }

    // Smooth Vanta canvas fade helpers and low-power tuning
    function getTargetVantaOpacity() {
        return document.documentElement.classList.contains('perf') ? 0.3 : 0.45;
    }
    function fadeInVantaCanvas() {
        const canvas = document.querySelector('#vanta-bg canvas');
        if (!canvas) return;
        canvas.style.setProperty('opacity', '0', 'important');
        requestAnimationFrame(() => requestAnimationFrame(() => {
            canvas.style.setProperty('opacity', String(getTargetVantaOpacity()), 'important');
        }));
    }
    function fadeOutVantaCanvas(onDone) {
        const canvas = document.querySelector('#vanta-bg canvas');
        if (!canvas) { if (onDone) onDone(); return; }
        canvas.style.setProperty('opacity', '0', 'important');
        setTimeout(() => { if (onDone) onDone(); }, 320);
    }

    // Initialize custom background on hero after load, with idle scheduling
    function scheduleVantaInit() {
        const init = () => {
            const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const host = document.getElementById('vanta-bg');
            if (!host) return;
            if (prefersReduced) return; // respect reduced motion
            if (!window.bgEffect) {
                const low = !!window.__LOW_PERF__;
                window.bgEffect = createCanvasBackground(host, { lowPower: low });
                setTimeout(fadeInVantaCanvas, 0);
            }
        };
        if ('requestIdleCallback' in window) requestIdleCallback(init, { timeout: 1200 });
        else setTimeout(init, 150);
    }

    // Initialize/destroy Vanta strictly based on hero visibility
    const homeSection = document.getElementById('home');
    if ('IntersectionObserver' in window && homeSection) {
        // Legacy canvas background observer disabled; p5 rings now controls background visibility.
    }
});

// Lightweight FPS probe: enable perf mode on slower devices
function enablePerfModeIfLowFPS() {
    let frames = 0;
    let start = performance.now();
    let rafId = null;
    function loop(now) {
        frames++;
        if (now - start < 1000) {
            rafId = requestAnimationFrame(loop);
        } else {
            const fps = frames / ((now - start) / 1000);
            if (fps < 45) {
                window.__LOW_PERF__ = true;
                document.documentElement.classList.add('perf');
                if (window.bgEffect && typeof window.bgEffect.setLowPower === 'function') {
                    window.bgEffect.setLowPower(true);
                }
                // refresh fade target opacity under perf mode
                const canvas = document.querySelector('#vanta-bg canvas');
                if (canvas) canvas.style.setProperty('opacity', '0.3', 'important');
            }
            if (rafId) cancelAnimationFrame(rafId);
        }
    }
    rafId = requestAnimationFrame(loop);
}
window.addEventListener('load', enablePerfModeIfLowFPS, { once: true });

// Apple-style preloader
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'h' && !e.ctrlKey && !e.metaKey) {
        const homeSection = document.querySelector('#home');
        if (homeSection && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            homeSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    if (e.key === 'c' && !e.ctrlKey && !e.metaKey) {
        const contactSection = document.querySelector('#contact');
        if (contactSection && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            contactSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
});

// Sidebar interactions
const sidebar = document.getElementById('sidebar');
const overlay = document.querySelector('.sidebar-overlay');
const menuToggle = document.querySelector('.menu-toggle');
const sidebarClose = document.querySelector('.sidebar-close');

function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('open');
    overlay && overlay.classList.add('active');
    menuToggle && menuToggle.setAttribute('aria-expanded', 'true');
    sidebar.setAttribute('aria-hidden', 'false');
}
function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('open');
    overlay && overlay.classList.remove('active');
    menuToggle && menuToggle.setAttribute('aria-expanded', 'false');
    sidebar.setAttribute('aria-hidden', 'true');
}

menuToggle && menuToggle.addEventListener('click', openSidebar);
sidebarClose && sidebarClose.addEventListener('click', closeSidebar);
overlay && overlay.addEventListener('click', closeSidebar);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
});

document.querySelectorAll('.sidebar .nav-link').forEach(link => {
    link.addEventListener('click', () => {
        closeSidebar();
    });
});

// Dispose background on unload to avoid memory leaks
window.addEventListener('beforeunload', function() {
    if (window.bgEffect && typeof window.bgEffect.destroy === 'function') {
        window.bgEffect.destroy();
        window.bgEffect = null;
    }
});

// p5 Concentric Wavy Rings in hero background
(function attachP5Rings(){
    const hostId = 'vanta-bg';
    let sketchInstance = null;

    function ringsSketch(p) {
        let t = 0;
        p.setup = function() {
            const host = document.getElementById(hostId);
            const rect = host.getBoundingClientRect();
            const cnv = p.createCanvas(rect.width, rect.height);
            cnv.parent(hostId);
            p.pixelDensity(1);
            p.noFill();
            p.stroke(255); // white rings
            p.strokeWeight(1.2); // slightly thicker
        };
        p.windowResized = function() {
            const host = document.getElementById(hostId);
            if (!host) return;
            const rect = host.getBoundingClientRect();
            p.resizeCanvas(rect.width, rect.height);
        };
        p.draw = function() {
            const perf = document.documentElement.classList.contains('perf');
            p.background(0, 0, 0);
            p.translate(p.width/2, p.height/2);

            const rings = 40;
            const gap = 6.0;      // larger spacing
            const baseR = 80;     // larger inner radius
            const wobbleAmp = perf ? 4 : 6;
            const wobbleFreq = 0.9;
            const timeSpeed = perf ? 0.2 : 0.35;

            t += 0.01 * timeSpeed;

            for (let i = 0; i < rings; i++) {
                const r = baseR + i * gap;
                p.beginShape();
                for (let a = 0; a < p.TWO_PI; a += 0.02) { // fewer points for perf
                    const n = p.noise(
                        0.6 * Math.cos(a) + 100,
                        0.6 * Math.sin(a) + 200,
                        i * 0.05 + t
                    );
                    const wobble = wobbleAmp * (n - 0.5) * 2 + 2 * Math.sin(a * wobbleFreq + t * 0.8);
                    const rr = r + wobble;
                    p.vertex(rr * Math.cos(a), rr * Math.sin(a));
                }
                p.endShape(p.CLOSE);
            }
        };
    }

    function mount() {
        if (sketchInstance) return;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const host = document.getElementById(hostId);
        if (!host) return;
        sketchInstance = new p5(ringsSketch);
        // fade in canvas
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const canvas = host.querySelector('canvas');
            if (canvas) canvas.style.setProperty('opacity', '0.35', 'important');
        }));
    }
    function unmount() {
        const host = document.getElementById(hostId);
        if (host) {
            const canvas = host.querySelector('canvas');
            if (canvas) canvas.style.setProperty('opacity', '0', 'important');
        }
        setTimeout(() => {
            if (sketchInstance && typeof sketchInstance.remove === 'function') {
                sketchInstance.remove();
            }
            sketchInstance = null;
        }, 320);
    }

    // Observe hero visibility
    document.addEventListener('DOMContentLoaded', () => {
        const homeSection = document.getElementById('home');
        if (!('IntersectionObserver' in window) || !homeSection) { mount(); return; }
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) mount();
                else {
                    const rect = e.boundingClientRect;
                    const vh = window.innerHeight || document.documentElement.clientHeight;
                    const fullyOut = rect.bottom <= 0 || rect.top >= vh;
                    if (fullyOut) unmount();
                }
            });
        }, { threshold: [0, 0.01] });
        obs.observe(homeSection);
    });

    // Cleanup
    window.addEventListener('beforeunload', unmount);
})();

// Corner Cat interactions (background, top-right)
(function setupCornerCat(){
  const cat = document.querySelector('.corner-cat-bg');
  if (!cat) return;
  let timer = null;
  function sleep() {
    cat.classList.remove('wake');
    cat.classList.add('sleep');
    // after transition settle, remove helper class
    setTimeout(() => cat.classList.remove('sleep'), 300);
  }
  function wake() {
    cat.classList.add('wake');
  }
  cat.addEventListener('click', () => {
    wake();
    if (timer) clearTimeout(timer);
    timer = setTimeout(sleep, 2000);
  });
  window.addEventListener('beforeunload', () => { if (timer) clearTimeout(timer); });
})();
