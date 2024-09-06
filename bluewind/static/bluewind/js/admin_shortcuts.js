console.log("Admin Shortcuts JS Loaded!");

console.log("Admin Shortcuts JS Loaded!");

(function () {
  function handleShortcut(e) {
    // Shortcut: Command + Shift + P
    if (e.metaKey && e.shiftKey && e.key.toLowerCase() === "p") {
      console.log("Cmd + Shift + P: Open Project Dashboard");
      e.preventDefault();
      e.stopPropagation();
    }
  }

  document.addEventListener("keydown", handleShortcut, true);
})();
