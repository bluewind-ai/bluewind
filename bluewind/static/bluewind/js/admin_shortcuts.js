(function () {
  // We'll fetch the actions from the data provided in the template
  let actions = window.initialData ? window.initialData.flows : [];
  let selectedIndex = 0;
  let filteredActions = [];

  // Function to create the command palette
  function createCommandPalette() {
    const palette = document.createElement("div");
    palette.id = "command-palette";
    palette.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: none;
      width: 300px;
    `;

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type to search...";
    input.style.cssText = `
      width: 100%;
      padding: 10px;
      margin-bottom: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
    `;

    const resultsList = document.createElement("ul");
    resultsList.style.cssText = `
      list-style-type: none;
      padding: 0;
      margin: 0;
    `;

    palette.appendChild(input);
    palette.appendChild(resultsList);
    document.body.appendChild(palette);

    return palette;
  }

  const commandPalette = createCommandPalette();
  const input = commandPalette.querySelector("input");
  const resultsList = commandPalette.querySelector("ul");

  function toggleCommandPalette() {
    const isVisible = commandPalette.style.display === "block";
    commandPalette.style.display = isVisible ? "none" : "block";
    if (!isVisible) {
      input.value = "";
      input.focus();
      updateResults("");
    }
  }

  function closeCommandPalette() {
    commandPalette.style.display = "none";
  }

  function updateResults(query) {
    resultsList.innerHTML = "";
    filteredActions = actions.filter((action) =>
      action.name.toLowerCase().includes(query.toLowerCase())
    );

    filteredActions.slice(0, 5).forEach((action, index) => {
      const li = document.createElement("li");
      li.textContent = action.name;
      li.style.cssText = `
        padding: 10px;
        cursor: pointer;
      `;
      li.addEventListener("click", () => {
        navigateToAction(action);
      });
      li.dataset.index = index;
      resultsList.appendChild(li);
    });

    selectedIndex = filteredActions.length > 0 ? 0 : -1;
    updateSelectedItem();
  }

  function updateSelectedItem() {
    const items = resultsList.querySelectorAll("li");
    items.forEach((item, index) => {
      item.style.backgroundColor = index === selectedIndex ? "#f0f0f0" : "";
    });
  }

  function navigateToAction(action) {
    window.location.href = action.url;
  }

  input.addEventListener("input", (e) => {
    updateResults(e.target.value);
  });

  input.addEventListener("keydown", (e) => {
    const items = resultsList.querySelectorAll("li");
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        updateSelectedItem();
        break;
      case "ArrowUp":
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        updateSelectedItem();
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredActions.length) {
          navigateToAction(filteredActions[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        closeCommandPalette();
        break;
    }
  });

  function handleShortcut(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
      e.preventDefault();
      e.stopPropagation();
      toggleCommandPalette();
    } else if (e.key === "Escape") {
      closeCommandPalette();
    }
  }

  document.addEventListener("keydown", handleShortcut, true);
})();
