document.addEventListener("DOMContentLoaded", function () {
  var toggleButton = document.querySelector(".toggle-details");
  if (toggleButton) {
    toggleButton.addEventListener("click", function () {
      var detailsSection = document.querySelector(".details-section");
      if (detailsSection) {
        if (detailsSection.style.display === "none") {
          detailsSection.style.display = "block";
        } else {
          detailsSection.style.display = "none";
        }
      }
    });
  }
});
