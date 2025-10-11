const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");
const submenuToggle = document.getElementById("submenuToggle");
const submenu = document.getElementById("submenu");

hamburger.addEventListener("click", function (e) {
  e.stopPropagation();
  const isOpen = mobileMenu.classList.toggle("open");
  hamburger.classList.toggle("open", isOpen);
  document.body.style.overflow = isOpen ? "hidden" : "";
  if (!isOpen) {
    submenu.classList.remove("open");
    submenuToggle.classList.remove("open");
  }
});

submenuToggle.addEventListener("click", function (e) {
  e.stopPropagation();
  submenu.classList.toggle("open");
  submenuToggle.classList.toggle("open");
});

mobileMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", function () {
    mobileMenu.classList.remove("open");
    hamburger.classList.remove("open");
    submenu.classList.remove("open");
    submenuToggle.classList.remove("open");
    document.body.style.overflow = "";
  });
});

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
    document.body.style.overflow = "";
  }
});

mobileMenu.addEventListener("touchmove", function (e) {
  e.stopPropagation();
});
