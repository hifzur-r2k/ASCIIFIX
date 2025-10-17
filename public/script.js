// ========================================
// MOBILE MENU FUNCTIONALITY
// ========================================
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");
const submenuToggle = document.getElementById("submenuToggle");
const submenu = document.getElementById("submenu");

// Toggle mobile menu
hamburger.addEventListener("click", function (e) {
  e.stopPropagation();
  const isOpen = mobileMenu.classList.toggle("open");
  hamburger.classList.toggle("open", isOpen);
  document.body.classList.toggle("no-scroll", isOpen);
  
  if (!isOpen) {
    submenu.classList.remove("open");
    submenuToggle.classList.remove("open");
  }
});

// Toggle submenu
submenuToggle.addEventListener("click", function (e) {
  e.stopPropagation();
  submenu.classList.toggle("open");
  submenuToggle.classList.toggle("open");
});

// Close menu when clicking on links
mobileMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", function () {
    mobileMenu.classList.remove("open");
    hamburger.classList.remove("open");
    submenu.classList.remove("open");
    submenuToggle.classList.remove("open");
    document.body.classList.remove("no-scroll");
  });
});

// Close menu when clicking outside
document.addEventListener("click", function (e) {
  if (
    mobileMenu.classList.contains("open") &&
    !mobileMenu.contains(e.target) &&
    !hamburger.contains(e.target)
  ) {
    mobileMenu.classList.remove("open");
    hamburger.classList.remove("open");
    submenu.classList.remove("open");
    submenuToggle.classList.remove("open");
    document.body.classList.remove("no-scroll");
  }
});

// Prevent body scroll when mobile menu is open
mobileMenu.addEventListener("touchmove", function (e) {
  e.stopPropagation();
});

// ========================================
// SCROLL-REVEAL ANIMATIONS
// ========================================
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
    }
  });
}, observerOptions);

// Observe all elements with data-animate attribute
document.addEventListener('DOMContentLoaded', () => {
  const animatedElements = document.querySelectorAll('[data-animate]');
  animatedElements.forEach((el) => observer.observe(el));
});

// ========================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href !== '#' && href !== '') {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  });
});

// ========================================
// NAVBAR SHADOW ON SCROLL
// ========================================
let scrollTimeout;
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  if (scrollTimeout) {
    window.cancelAnimationFrame(scrollTimeout);
  }
  
  scrollTimeout = window.requestAnimationFrame(() => {
    const currentScrollY = window.scrollY;
    
    const navbar = document.querySelector('.main-navbar');
    if (navbar) {
      if (currentScrollY > 50) {
        navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      } else {
        navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)';
      }
    }
    
    lastScrollY = currentScrollY;
  });
});

// ========================================
// CONSOLE BRANDING
// ========================================
console.log('%c🚀 ASCIIFIX - Ultra-Minimal Professional Toolkit', 'font-size: 20px; font-weight: bold; color: #10b981;');
console.log('%cBuilt with modern web standards | Optimized performance', 'font-size: 12px; color: #64748b;');
