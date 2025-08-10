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

    // Vanta initialization moved to window load + idle to reduce main-thread contention

    // Initialize/destroy Vanta strictly based on hero visibility
    const homeSection = document.getElementById('home');
    if ('IntersectionObserver' in window && homeSection) {
        const heroObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const ratio = entry.intersectionRatio || 0;
                if (ratio > 0) {
                    // Any visible portion => ensure Vanta is running
                    scheduleVantaInit();
                } else {
                    // Fully out of view check using bounding rect
                    const rect = entry.boundingClientRect;
                    const vh = window.innerHeight || document.documentElement.clientHeight;
                    const fullyOut = rect.bottom <= 0 || rect.top >= vh;
                    if (fullyOut) {
                        if (window.vantaEffect && typeof window.vantaEffect.destroy === 'function') {
                            fadeOutVantaCanvas(() => {
                                if (window.vantaEffect && typeof window.vantaEffect.destroy === 'function') {
                                    window.vantaEffect.destroy();
                                    window.vantaEffect = null;
                                }
                            });
                        }
                    }
                }
            });
        }, { threshold: [0, 0.01] });
        heroObserver.observe(homeSection);
    }
});

// Smooth Vanta canvas fade helpers and low-power tuning
function getTargetVantaOpacity() {
    return document.documentElement.classList.contains('perf') ? 0.3 : 0.45;
}
function fadeInVantaCanvas() {
    const canvas = document.querySelector('#vanta-bg canvas');
    if (!canvas) return;
    canvas.style.setProperty('opacity', '0', 'important');
    // Double RAF to ensure style & DOM ready before transitioning
    requestAnimationFrame(() => requestAnimationFrame(() => {
        canvas.style.setProperty('opacity', String(getTargetVantaOpacity()), 'important');
    }));
}
function fadeOutVantaCanvas(onDone) {
    const canvas = document.querySelector('#vanta-bg canvas');
    if (!canvas) { if (onDone) onDone(); return; }
    canvas.style.setProperty('opacity', '0', 'important');
    setTimeout(() => { if (onDone) onDone(); }, 320); // match CSS transition ~0.3s
}

// Initialize Vanta TRUNK background on hero after load, with idle scheduling
function scheduleVantaInit() {
    const init = () => {
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const vantaEl = document.getElementById('vanta-bg');
        if (!prefersReduced && window.VANTA && window.VANTA.TRUNK && vantaEl && !window.vantaEffect) {
            const low = !!window.__LOW_PERF__;
            window.vantaEffect = window.VANTA.TRUNK({
                el: vantaEl,
                mouseControls: false,
                touchControls: false,
                gyroControls: false,
                minHeight: 200.0,
                minWidth: 200.0,
                scale: low ? 0.8 : 1.0,
                scaleMobile: low ? 0.7 : 0.9,
                color: 0xffffff,
                backgroundColor: 0x000000
            });
            // Fade in smoothly after canvas is attached
            setTimeout(fadeInVantaCanvas, 0);
        }
    };

    if ('requestIdleCallback' in window) {
        requestIdleCallback(init, { timeout: 1200 });
    } else {
        setTimeout(init, 150);
    }
}

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
                // Reduce Vanta resolution dynamically if already running
                if (window.vantaEffect && typeof window.vantaEffect.setOptions === 'function') {
                    window.vantaEffect.setOptions({ scale: 0.8, scaleMobile: 0.7 });
                }
                // Adjust target opacity for low-power mode
                fadeInVantaCanvas();
            }
            if (rafId) cancelAnimationFrame(rafId);
        }
    }
    rafId = requestAnimationFrame(loop);
}

// Run FPS probe after load
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

// Close on ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
});

// Close sidebar when clicking a nav link
document.querySelectorAll('.sidebar .nav-link').forEach(link => {
    link.addEventListener('click', () => {
        closeSidebar();
    });
});

// Dispose Vanta on unload to avoid memory leaks
window.addEventListener('beforeunload', function() {
    if (window.vantaEffect && typeof window.vantaEffect.destroy === 'function') {
        window.vantaEffect.destroy();
        window.vantaEffect = null;
    }
});
