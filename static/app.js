// Global State
let allTools = [];
let activeEventSource = null;
let currentTaskPrompt = "";

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
    fetchSystemStatus();

    // Bind Enter key on textarea
    const textarea = document.getElementById("prompt-textarea");
    textarea.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            executeTask();
        }
    });

    // Tool search input listener
    const searchInput = document.getElementById("tool-search-input");
    searchInput.addEventListener("input", (e) => {
        filterTools(e.target.value);
    });

    // Textarea auto-resize
    textarea.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = (this.scrollHeight - 4) + "px";
    });
});

// Fetch system details
async function fetchSystemStatus() {
    const usernameEl = document.getElementById("github-username");
    const avatarInitialsEl = document.getElementById("user-avatar-initials");
    const toolsListEl = document.getElementById("tools-list-container");
    const statusServer = document.getElementById("status-server");
    const statusMcp = document.getElementById("status-mcp");
    const statusGemini = document.getElementById("status-gemini");

    try {
        const res = await fetch("/api/status");
        if (!res.ok) throw new Error("Backend server error");
        const data = await res.json();

        // Update User info
        usernameEl.textContent = data.username || "iam-pavanpachuru";
        if (data.username) {
            avatarInitialsEl.textContent = data.username.slice(0, 2).toUpperCase();
        }

        // Save and Render Tools
        allTools = data.tools || [];
        renderTools(allTools);

        // Update status indicators
        setIndicatorState(statusServer, "green");
        setIndicatorState(statusMcp, "green");
        setIndicatorState(statusGemini, "green");

    } catch (err) {
        console.error("Failed to load status details:", err);
        usernameEl.textContent = "Offline Mode";
        toolsListEl.innerHTML = `
            <div class="log-entry error" style="margin: 0; font-size: 11px;">
                ❌ Could not connect to backend server. Verify the service is running.
            </div>
        `;
        setIndicatorState(statusServer, "red");
        setIndicatorState(statusMcp, "red");
        setIndicatorState(statusGemini, "red");
    }
}

// Update indicator lights
function setIndicatorState(element, state) {
    const pulseEl = element.querySelector(".pulse");
    if (state === "green") {
        pulseEl.className = "pulse green";
    } else {
        pulseEl.className = "pulse";
        pulseEl.style.backgroundColor = "var(--color-red)";
        pulseEl.style.boxShadow = "0 0 8px var(--color-red)";
    }
}

// Render Tools as carousel cards in the control center
function renderTools(tools) {
    const container = document.getElementById("tools-list-container");
    const toolsCountEl = document.getElementById("tools-count");

    toolsCountEl.textContent = tools.length;
    container.innerHTML = "";

    if (tools.length === 0) {
        container.innerHTML = `<div class="suggestion-card" style="opacity:0.5;cursor:default;"><span class="card-icon">🔍</span><h4>No tools found</h4><p>Try a different search query.</p></div>`;
        return;
    }

    // Featured tool metadata for richer card display
    const featured = {
        "search_repositories": { icon: "📂", label: "List Repositories", desc: "Search and display all repos under your owner username.", warning: false },
        "create_repository": { icon: "📦", label: "Create Repository", desc: "Instantiate a new private GitHub repo with a default README.md.", warning: false },
        "create_issue": { icon: "🐛", label: "Create Issue", desc: "File an issue report directly within a target repository.", warning: false },
        "delete_repository": { icon: "🗑️", label: "Delete Repository", desc: "Destructive action. Triggers active safety confirmation flow.", warning: true },
        "create_branch": { icon: "🌿", label: "Create Branch", desc: "Spin up a new branch in any repository.", warning: false },
        "create_pull_request": { icon: "🔀", label: "Pull Request", desc: "Open a PR from any branch to another.", warning: false },
        "list_issues": { icon: "📋", label: "List Issues", desc: "View all open issues in a repository.", warning: false },
        "push_files": { icon: "📤", label: "Push Files", desc: "Push one or more files to a branch.", warning: false },
        "get_file_contents": { icon: "📄", label: "Get File", desc: "Read the contents of any file in a repo.", warning: false },
        "create_or_update_file": { icon: "✏️", label: "Write File", desc: "Create or update a file in a repository.", warning: false },
        "list_commits": { icon: "🕓", label: "List Commits", desc: "Browse commit history on any branch.", warning: false },
        "fork_repository": { icon: "🍴", label: "Fork Repo", desc: "Fork a repository to your account.", warning: false },
        "add_issue_comment": { icon: "💬", label: "Comment on Issue", desc: "Post a comment on an existing issue.", warning: false },
        "update_issue": { icon: "🔧", label: "Update Issue", desc: "Edit the title, body, or state of an issue.", warning: false },
        "search_code": { icon: "🔍", label: "Search Code", desc: "Full-text code search across your repositories.", warning: false },
        "search_users": { icon: "👥", label: "Search Users", desc: "Find GitHub users by keyword.", warning: false },
    };

    tools.forEach(tool => {
        const meta = featured[tool.name];
        const icon = meta ? meta.icon : "⚙️";
        const label = meta ? meta.label : tool.name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        const desc = meta ? meta.desc : (tool.description || "No description provided.");
        const isWarning = meta ? meta.warning : false;

        const card = document.createElement("div");
        card.className = "suggestion-card";
        if (isWarning) card.classList.add("suggestion-card--danger");
        card.title = `Click to use: ${tool.name}`;

        card.innerHTML = `
            <span class="card-icon">${icon}</span>
            <h4>${label}</h4>
            <p class="${isWarning ? 'warning-text' : ''}">${desc}</p>
            <span class="card-tool-name">${tool.name}</span>
        `;

        card.addEventListener("click", () => {
            const prompt = generateToolPrompt(tool.name);
            autofillPrompt(prompt);
            container.querySelectorAll(".suggestion-card").forEach(el => el.classList.remove("card-active"));
            card.classList.add("card-active");
        });

        container.appendChild(card);
    });
}

// Scroll the carousel left (-1) or right (1) by one card width
function scrollCarousel(dir) {
    const wrapper = document.querySelector(".carousel-track-wrapper");
    const cardWidth = wrapper.querySelector(".suggestion-card")?.offsetWidth || 220;
    wrapper.scrollBy({ left: dir * (cardWidth + 10) * 3, behavior: "smooth" });
}

// Generate a smart prompt suggestion based on tool name
function generateToolPrompt(toolName) {
    const promptMap = {
        "create_repository": "Create a new private repository called my-new-repo with description 'Created via AI Agent'",
        "search_repositories": "List ALL repositories for my GitHub account, use perPage=100 to get all results",
        "create_or_update_file": "Create a README.md file in my-new-repo with content '# My Project'",
        "get_file_contents": "Get the contents of README.md from my-new-repo",
        "create_issue": "Create an issue in my-new-repo with title 'Setup CI/CD pipeline' and description 'We need to configure GitHub Actions'",
        "list_issues": "List all open issues in my-new-repo",
        "create_pull_request": "Create a pull request from branch feat/new-feature to main in my-new-repo with title 'Add new feature'",
        "list_commits": "List all commits from the main branch in my-new-repo",
        "create_branch": "Create a new branch called feat/new-feature in my-new-repo",
        "push_files": "Push a new file called app.py to my-new-repo on branch main",
        "fork_repository": "Fork the repository my-new-repo",
        "add_issue_comment": "Add a comment to issue #1 in my-new-repo saying 'Working on this'",
        "update_issue": "Update issue #1 in my-new-repo to change the title to 'Updated title'",
        "search_code": "Search for code containing 'import os' across my repositories",
        "search_users": "Search for GitHub users related to 'devops engineer'",
        "delete_repository": "Delete the repository `my-new-repo`",
    };

    return promptMap[toolName] || `Use the ${toolName} tool on my GitHub account`;
}

// Filter Tools search
function filterTools(query) {
    const filtered = allTools.filter(tool => {
        return tool.name.toLowerCase().includes(query.toLowerCase()) ||
            tool.description.toLowerCase().includes(query.toLowerCase());
    });
    renderTools(filtered);
}

// Autofill Prompt Card
function autofillPrompt(text) {
    const textarea = document.getElementById("prompt-textarea");
    textarea.value = text;
    textarea.focus();
    // trigger auto resize
    textarea.style.height = "auto";
    textarea.style.height = (textarea.scrollHeight - 4) + "px";
}

// Strip Markdown formatting (bold, italic, backticks) for clean terminal output
function stripMarkdown(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold** → bold
        .replace(/\*(.+?)\*/g, '$1')        // *italic* → italic
        .replace(/__(.+?)__/g, '$1')        // __bold__ → bold
        .replace(/_(.+?)_/g, '$1')          // _italic_ → italic
        .replace(/`([^`]+)`/g, '$1');       // `code` → code
}

// Log line to terminal console
function logToTerminal(type, text) {
    const consoleBody = document.getElementById("console-stream-body");
    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;

    const timestamp = document.createElement("span");
    timestamp.className = "timestamp";
    const now = new Date();
    timestamp.textContent = `[${now.toTimeString().split(' ')[0]}]`;

    entry.appendChild(timestamp);

    // Add text contents with Markdown stripped
    const textNode = document.createElement("span");
    textNode.textContent = stripMarkdown(text);
    entry.appendChild(textNode);

    consoleBody.appendChild(entry);
    consoleBody.scrollTop = consoleBody.scrollHeight;
}

// Clear Terminal logs
function clearConsole() {
    const consoleBody = document.getElementById("console-stream-body");
    consoleBody.innerHTML = `
        <div class="log-entry system">
            <span class="timestamp">[SYSTEM]</span> Console cleared.
        </div>
    `;
}

// Execute prompt task
function executeTask(confirmed = false) {
    const textarea = document.getElementById("prompt-textarea");
    const executeBtn = document.getElementById("execute-run-btn");
    const btnText = executeBtn.querySelector(".btn-text");
    const btnSpinner = executeBtn.querySelector(".btn-spinner");

    const promptText = textarea.value.trim();
    if (!promptText && !confirmed) return;

    if (!confirmed) {
        currentTaskPrompt = promptText;
        textarea.value = "";
        textarea.style.height = "auto";
    }

    // Toggle loading UI states
    textarea.disabled = true;
    executeBtn.disabled = true;
    btnText.textContent = "Running...";
    btnSpinner.classList.remove("hidden");

    logToTerminal("system", `Initiating task execution: "${currentTaskPrompt}"`);
    if (!confirmed) { updateStat("tasks"); pushHistory(currentTaskPrompt); }

    // Setup SSE URL
    const url = `/api/stream-run?task=${encodeURIComponent(currentTaskPrompt)}&confirm=${confirmed}`;

    if (activeEventSource) {
        activeEventSource.close();
    }

    activeEventSource = new EventSource(url);

    activeEventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
            case "status":
                logToTerminal("status", `⚡ ${data.message}`);
                break;
            case "thought":
                logToTerminal("thought", `🧠 Thought: ${data.message}`);
                break;
            case "tool_call":
                logToTerminal("tool_call", `🔧 Calling Tool [${data.tool}] with parameters: ${JSON.stringify(data.args)}`);
                break;
            case "tool_result":
                logToTerminal("tool_result", `📥 Tool [${data.tool}] returned result:\n${data.result}`);
                break;
            case "warning":
                logToTerminal("warning", `⚠️ Warning: ${data.message}`);
                break;
            case "success":
                logToTerminal("success", `✅ Result: ${data.message}`);
                finishExecution();
                break;
            case "error":
                logToTerminal("error", `❌ Error: ${data.message}`);
                finishExecution();
                break;
            case "confirm_required":
                activeEventSource.close();
                activeEventSource = null;
                showSafetyModal(data.repo);
                break;
        }
    };

    activeEventSource.onerror = (err) => {
        console.error("SSE stream error:", err);
        logToTerminal("error", "❌ Connection to execution stream lost unexpectedly.");
        finishExecution();
    };
}

// Reset UI after completion
function finishExecution() {
    const textarea = document.getElementById("prompt-textarea");
    const executeBtn = document.getElementById("execute-run-btn");
    const btnText = executeBtn.querySelector(".btn-text");
    const btnSpinner = executeBtn.querySelector(".btn-spinner");

    if (activeEventSource) {
        activeEventSource.close();
        activeEventSource = null;
    }

    textarea.disabled = false;
    executeBtn.disabled = false;
    btnText.textContent = "Execute";
    btnSpinner.classList.add("hidden");
    textarea.focus();
}

// Safety Confirmation Modal Actions
function showSafetyModal(repoName) {
    const modal = document.getElementById("safety-modal");
    const repoLabel = document.getElementById("delete-repo-name");
    const confirmInput = document.getElementById("confirm-repo-input");
    const confirmBtn = document.getElementById("modal-confirm-btn");
    const cancelBtn = document.getElementById("modal-cancel-btn");

    repoLabel.textContent = repoName;
    confirmInput.value = "";
    confirmBtn.disabled = true;
    confirmBtn.classList.add("disabled");

    modal.classList.remove("hidden");

    // Modal Validation
    const validateHandler = () => {
        if (confirmInput.value.trim() === repoName.trim()) {
            confirmBtn.disabled = false;
            confirmBtn.classList.remove("disabled");
        } else {
            confirmBtn.disabled = true;
            confirmBtn.classList.add("disabled");
        }
    };

    confirmInput.addEventListener("input", validateHandler);

    // Cancel deletion handler
    const cancelHandler = () => {
        modal.classList.add("hidden");
        logToTerminal("error", "❌ Deletion aborted by user.");
        finishExecution();
        cleanupListeners();
    };

    // Confirm deletion handler
    const confirmHandler = () => {
        modal.classList.add("hidden");
        logToTerminal("system", "⚠️ Deletion authorized. Triggering task execution...");
        executeTask(true);
        cleanupListeners();
    };

    cancelBtn.addEventListener("click", cancelHandler);
    confirmBtn.addEventListener("click", confirmHandler);

    function cleanupListeners() {
        confirmInput.removeEventListener("input", validateHandler);
        cancelBtn.removeEventListener("click", cancelHandler);
        confirmBtn.removeEventListener("click", confirmHandler);
    }
}

// ── Sidebar Live Widgets ──────────────────────────────────────────────

let sidebarStats = { tasks: 0, tools: 0, errors: 0 };
let commandHistory = [];

function updateStat(key) {
    sidebarStats[key]++;
    const el = document.getElementById(`stat-${key}`);
    if (el) {
        el.textContent = sidebarStats[key];
        el.classList.remove("stat-bump");
        void el.offsetWidth; // reflow to restart animation
        el.classList.add("stat-bump");
    }
}

function pushActivity(type, text) {
    const feed = document.getElementById("activity-feed");
    if (!feed) return;
    // Remove empty placeholder
    const empty = feed.querySelector(".activity-empty");
    if (empty) empty.remove();

    const icons = { tool_call: "🔧", success: "✅", error: "❌", status: "⚡", thought: "🧠", warning: "⚠️", tool_result: "📥" };
    const icon = icons[type] || "•";

    const item = document.createElement("div");
    item.className = "activity-item activity-item--" + type;
    const now = new Date();
    const time = now.toTimeString().split(" ")[0].slice(0, 5);
    item.innerHTML = `<span class="activity-icon">${icon}</span><span class="activity-text">${text}</span><span class="activity-time">${time}</span>`;
    feed.prepend(item);

    // Keep max 8 items
    const items = feed.querySelectorAll(".activity-item");
    if (items.length > 8) items[items.length - 1].remove();
}

function pushHistory(prompt) {
    const list = document.getElementById("history-list");
    if (!list) return;
    const empty = list.querySelector(".activity-empty");
    if (empty) empty.remove();

    commandHistory.unshift(prompt);
    if (commandHistory.length > 6) commandHistory.pop();

    const item = document.createElement("div");
    item.className = "history-item";
    item.title = prompt;
    item.textContent = prompt.length > 52 ? prompt.slice(0, 52) + "…" : prompt;
    item.addEventListener("click", () => autofillPrompt(prompt));
    list.prepend(item);

    // Keep max 6
    const items = list.querySelectorAll(".history-item");
    if (items.length > 6) items[items.length - 1].remove();
}

function clearHistory() {
    const list = document.getElementById("history-list");
    if (list) list.innerHTML = `<div class="activity-empty">Commands you run will appear here.</div>`;
    commandHistory = [];
}

// Patch executeTask to track history & stats
const _origExecuteTask = executeTask;
// We intercept by wrapping logToTerminal instead (since executeTask calls it)
const _origLogToTerminal = logToTerminal;
window.logToTerminal = function (type, text) {
    _origLogToTerminal(type, text);
    if (type === "tool_call") { updateStat("tools"); pushActivity("tool_call", text.replace(/^🔧 Calling Tool \[/, "").split("]")[0]); }
    if (type === "success") { pushActivity("success", text.slice(0, 60)); }
    if (type === "error") { updateStat("errors"); pushActivity("error", text.slice(0, 60)); }
};