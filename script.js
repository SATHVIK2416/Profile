// Apple-style smooth scrolling and animations
document.addEventListener('DOMContentLoaded', function() {
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

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
