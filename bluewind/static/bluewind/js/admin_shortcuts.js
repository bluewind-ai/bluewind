console.log("Admin Shortcuts JS Loaded!");

(function () {
  const actions = [
    { name: "Accounts - Email Addresses", url: "/admin/account/emailaddress/" },
    {
      name: "Accounts - Email Confirmations",
      url: "/admin/account/emailconfirmation/",
    },
    { name: "Administration - Log Entries", url: "/admin/admin/logentry/" },
    { name: "Api Providers - Api Keys", url: "/admin/api_providers/apikey/" },
    {
      name: "Api Providers - Api Providers",
      url: "/admin/api_providers/apiprovider/",
    },
    {
      name: "Apollo People Search",
      url: "/admin/apollo_people_search/apollopeoplesearch/",
    },
    { name: "Authentication - Groups", url: "/admin/auth/group/" },
    { name: "Authentication - Permissions", url: "/admin/auth/permission/" },
    {
      name: "Base64 Utils - Conversions",
      url: "/admin/base64_utils/base64conversion/",
    },
    { name: "Channels", url: "/admin/channels/channel/" },
    { name: "Chat Messages", url: "/admin/chat_messages/message/" },
    { name: "Content Types", url: "/admin/contenttypes/contenttype/" },
    { name: "Credentials", url: "/admin/credentials/credentials/" },
    { name: "Draft Messages", url: "/admin/draft_messages/draftmessage/" },
    { name: "Forms", url: "/admin/forms/form/" },
    { name: "Forms - Wizard Steps", url: "/admin/forms/wizardstep/" },
    { name: "Forms - Wizards", url: "/admin/forms/wizard/" },
    { name: "Gmail Events", url: "/admin/gmail_events/gmailevent/" },
    {
      name: "Gmail Subscriptions",
      url: "/admin/gmail_subscriptions/gmailsubscription/",
    },
    {
      name: "Gmail Subscriptions - Pub Sub Topics",
      url: "/admin/gmail_subscriptions/pubsubtopic/",
    },
    { name: "Migrations", url: "/admin/migrations/migration/" },
    { name: "People - Persons", url: "/admin/people/person/" },
    { name: "Sessions", url: "/admin/sessions/session/" },
    { name: "Sites", url: "/admin/sites/site/" },
    { name: "Social Accounts", url: "/admin/socialaccount/socialaccount/" },
    {
      name: "Social Accounts - Application Tokens",
      url: "/admin/socialaccount/socialtoken/",
    },
    {
      name: "Social Accounts - Applications",
      url: "/admin/socialaccount/socialapp/",
    },
    { name: "Users", url: "/admin/users/user/" },
    {
      name: "Webhook Tester - Incoming Webhooks",
      url: "/admin/webhook_tester/incomingwebhook/",
    },
    {
      name: "Workspaces - Workspace Users",
      url: "/admin/workspaces/workspaceuser/",
    },
    { name: "Workspaces", url: "/admin/workspaces/workspace/" },
  ];
  let selectedIndex = 0;
  let filteredActions = [];

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
      if (index === selectedIndex) {
        item.style.backgroundColor = "#f0f0f0";
      } else {
        item.style.backgroundColor = "";
      }
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
      console.log("Cmd/Ctrl + P: Toggle Command Palette");
      e.preventDefault();
      e.stopPropagation();
      toggleCommandPalette();
    } else if (e.key === "Escape") {
      closeCommandPalette();
    }
  }

  document.addEventListener("keydown", handleShortcut, true);
})();
