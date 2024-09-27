console.log("Hello from custom_admin.js");

document.addEventListener("DOMContentLoaded", function () {
  console.log("Hello from custom_admin.js");
  if (typeof Alpine !== "undefined") {
    Alpine.store("layout", {
      sidebarDesktopOpen: false,
      sidebarMobileOpen: false,
    });
  }
});
