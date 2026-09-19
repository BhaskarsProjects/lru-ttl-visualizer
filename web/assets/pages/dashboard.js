export default function Dashboard() {
    return `
        <main class="cache-app">

            <header class="page-header">

                <div>
                    <div class="eyebrow">CACHE LAB</div>

                    <h1>LRU / TTL Cache</h1>

                    <p>
                        Manage entries and observe eviction,
                        expiration, and access order.
                    </p>
                </div>

                <div class="engine-status">
                    <span class="status-dot"></span>
                    <span>Connected</span>
                </div>

            </header>


            <!-- OPERATIONS -->

            <section class="operations">

                <!-- SET -->

                <form id="set-cache-form" class="operation">

                    <div class="operation-header">
                        <div>
                            <span class="operation-label">SET</span>
                            <h2>Store entry</h2>
                        </div>
                    </div>

                    <div class="fields">

                        <div class="field">
                            <label for="cache-key">Key</label>

                            <input
                                id="cache-key"
                                type="text"
                                placeholder="user:1001"
                                autocomplete="off"
                                required
                            >
                        </div>

                        <div class="field">
                            <label for="cache-value">Value</label>

                            <input
                                id="cache-value"
                                type="text"
                                placeholder="Bhaskar"
                                autocomplete="off"
                                required
                            >
                        </div>

                        <div class="field">
                            <label for="cache-ttl">Expiration</label>

                            <div class="ttl-input">

                                <input
                                    id="cache-ttl"
                                    type="number"
                                    min="1"
                                    value="60"
                                    required
                                >

                                <select id="ttl-unit">
                                    <option value="1000000000">
                                        seconds
                                    </option>

                                    <option value="60000000000">
                                        minutes
                                    </option>

                                    <option value="3600000000000">
                                        hours
                                    </option>
                                </select>

                            </div>
                        </div>

                    </div>

                    <button
                        class="button button-primary"
                        type="submit"
                    >
                        Store entry
                    </button>

                </form>


                <!-- GET -->

                <form id="get-cache-form" class="operation">

                    <div class="operation-header">
                        <div>
                            <span class="operation-label">GET</span>
                            <h2>Read entry</h2>
                        </div>
                    </div>

                    <div class="fields">

                        <div class="field">
                            <label for="get-key">Key</label>

                            <input
                                id="get-key"
                                type="text"
                                placeholder="user:1001"
                                autocomplete="off"
                                required
                            >
                        </div>

                    </div>

                    <button
                        class="button button-secondary"
                        type="submit"
                    >
                        Read entry
                    </button>

                    <div
                        id="get-result"
                        class="operation-result hidden"
                    ></div>

                </form>


                <!-- DELETE -->

                <form id="delete-cache-form" class="operation">

                    <div class="operation-header">
                        <div>
                            <span class="operation-label">DELETE</span>
                            <h2>Remove entry</h2>
                        </div>
                    </div>

                    <div class="fields">

                        <div class="field">
                            <label for="delete-key">Key</label>

                            <input
                                id="delete-key"
                                type="text"
                                placeholder="user:1001"
                                autocomplete="off"
                                required
                            >
                        </div>

                    </div>

                    <button
                        class="button button-danger"
                        type="submit"
                    >
                        Remove entry
                    </button>

                </form>

            </section>


            <!-- CACHE STATE -->

            <section class="panel">

                <div class="panel-header">

                    <div>
                        <div class="eyebrow">STATE</div>
                        <h2>Cache contents</h2>
                    </div>

                    <div class="panel-actions">

                        <span class="capacity">
                            <span id="cache-size">0</span>
                            /
                            <span id="cache-capacity">0</span>
                        </span>

                        <button
                            id="refresh-cache"
                            class="button button-small"
                            type="button"
                        >
                            Refresh
                        </button>

                        <button
                            id="clear-cache"
                            class="button button-small button-danger-outline"
                            type="button"
                        >
                            Clear
                        </button>

                    </div>

                </div>


                <div class="cache-view">

                    <div class="cache-direction">
                        <span>MRU</span>
                        <span>Most recently used</span>
                    </div>

                    <div id="cache-items">

                        <div class="empty-state">

                            <span class="empty-state-symbol">—</span>

                            <strong>No entries</strong>

                            <span>
                                Store an entry to begin.
                            </span>

                        </div>

                    </div>

                    <div class="cache-direction cache-direction-bottom">
                        <span>LRU</span>
                        <span>Least recently used</span>
                    </div>

                </div>

            </section>


            <!-- ACTIVITY -->

            <section class="panel activity-panel">

                <div class="panel-header">

                    <div>
                        <div class="eyebrow">ACTIVITY</div>
                        <h2>Operations</h2>
                    </div>

                </div>

                <div id="activity-log">

                    <div class="activity-empty">
                        No operations yet.
                    </div>

                </div>

            </section>

        </main>
    `;
}


export function initDashboard() {

    loadCacheState();


    const setForm =
        document.getElementById("set-cache-form");

    const getForm =
        document.getElementById("get-cache-form");

    const deleteForm =
        document.getElementById("delete-cache-form");

    const clearButton =
        document.getElementById("clear-cache");

    const refreshButton =
        document.getElementById("refresh-cache");


    /* =====================================================
       SET
       ===================================================== */

    setForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const key =
            document.getElementById("cache-key").value.trim();

        const value =
            document.getElementById("cache-value").value;

        const ttl =
            Number(
                document.getElementById("cache-ttl").value
            );

        const unit =
            Number(
                document.getElementById("ttl-unit").value
            );

        const response = await fetch("/api/cache/set", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                key,
                value,
                ttl: ttl * unit
            })
        });

        if (!response.ok) {
            addActivity("SET request failed", "error");
            return;
        }

        const data = await response.json();

        addActivity(
            data.created
                ? `SET ${key}`
                : `UPDATE ${key}`,
            "success"
        );

        setForm.reset();

        document.getElementById("cache-ttl").value = 60;

        await loadCacheState();
    });


    /* =====================================================
       GET
       ===================================================== */

    getForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const key =
            document.getElementById("get-key").value.trim();

        const response = await fetch("/api/cache/get", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                key
            })
        });

        if (!response.ok) {
            addActivity("GET request failed", "error");
            return;
        }

        const data = await response.json();

        const result =
            document.getElementById("get-result");

        result.classList.remove("hidden");


        if (data.found) {

            result.innerHTML = `
                <span class="result-status hit">
                    HIT
                </span>

                <span class="result-value">
                    ${escapeHTML(String(data.value))}
                </span>
            `;

            addActivity(
                `GET ${key} → HIT`,
                "success"
            );

        } else {

            result.innerHTML = `
                <span class="result-status miss">
                    MISS
                </span>

                <span class="result-value">
                    Key not found
                </span>
            `;

            addActivity(
                `GET ${key} → MISS`,
                "warning"
            );
        }

        await loadCacheState();
    });


    /* =====================================================
       DELETE
       ===================================================== */

    deleteForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const key =
            document
                .getElementById("delete-key")
                .value
                .trim();

        const response = await fetch(
            "/api/cache/delete",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    key
                })
            }
        );

        if (!response.ok) {
            addActivity(
                "DELETE request failed",
                "error"
            );

            return;
        }

        const data = await response.json();

        addActivity(
            data.deleted
                ? `DELETE ${key}`
                : `DELETE ${key} → not found`,
            data.deleted
                ? "warning"
                : "neutral"
        );

        deleteForm.reset();

        await loadCacheState();
    });


    /* =====================================================
       CLEAR
       ===================================================== */

    clearButton.addEventListener("click", async () => {

        const response = await fetch(
            "/api/cache/clear",
            {
                method: "POST"
            }
        );

        if (!response.ok) {
            addActivity(
                "CLEAR request failed",
                "error"
            );

            return;
        }

        addActivity(
            "CACHE CLEARED",
            "warning"
        );

        await loadCacheState();
    });


    /* =====================================================
       REFRESH
       ===================================================== */

    refreshButton.addEventListener(
        "click",
        loadCacheState
    );
}


/* =========================================================
   CACHE STATE
   ========================================================= */

async function loadCacheState() {

    const response =
        await fetch("/api/cache/state");

    if (!response.ok) {
        return;
    }

    const state =
        await response.json();

    document.getElementById("cache-size").textContent =
        state.Size;

    document.getElementById("cache-capacity").textContent =
        state.Capacity;

    renderCacheItems(state.Items);
}


function renderCacheItems(items) {

    const container =
        document.getElementById("cache-items");


    if (!items || items.length === 0) {

        container.innerHTML = `
            <div class="empty-state">

                <span class="empty-state-symbol">—</span>

                <strong>No entries</strong>

                <span>
                    Store an entry to begin.
                </span>

            </div>
        `;

        return;
    }


    container.innerHTML =
        items.map((item, index) => {

            const remaining =
                getRemainingSeconds(item.Expiry);

            return `
                <div class="cache-item">

                    <span class="cache-index">
                        ${String(index + 1).padStart(2, "0")}
                    </span>

                    <span class="cache-key">
                        ${escapeHTML(item.Key)}
                    </span>

                    <span class="cache-value">
                        ${escapeHTML(String(item.Value))}
                    </span>

                    <span class="cache-ttl">
                        ${formatTTL(remaining)}
                    </span>

                    ${
                        index === 0
                            ? `<span class="mru-label">MRU</span>`
                            : `<span></span>`
                    }

                </div>
            `;

        }).join("");
}


function getRemainingSeconds(expiry) {

    const milliseconds =
        new Date(expiry).getTime() -
        Date.now();

    return Math.max(
        0,
        Math.ceil(milliseconds / 1000)
    );
}


function formatTTL(seconds) {

    if (seconds <= 0) {
        return "expired";
    }

    if (seconds < 60) {
        return `${seconds}s`;
    }

    const minutes =
        Math.floor(seconds / 60);

    const remainingSeconds =
        seconds % 60;

    if (minutes < 60) {
        return remainingSeconds === 0
            ? `${minutes}m`
            : `${minutes}m ${remainingSeconds}s`;
    }

    const hours =
        Math.floor(minutes / 60);

    const remainingMinutes =
        minutes % 60;

    return remainingMinutes === 0
        ? `${hours}h`
        : `${hours}h ${remainingMinutes}m`;
}


/* =========================================================
   ACTIVITY
   ========================================================= */

function addActivity(message, type) {

    const log =
        document.getElementById("activity-log");

    const empty =
        log.querySelector(".activity-empty");

    if (empty) {
        empty.remove();
    }


    const entry =
        document.createElement("div");

    entry.className =
        `activity-entry ${type}`;


    entry.innerHTML = `
        <span class="activity-indicator"></span>

        <span class="activity-message">
            ${escapeHTML(message)}
        </span>

        <span class="activity-time">
            ${new Date().toLocaleTimeString()}
        </span>
    `;


    log.prepend(entry);
}


/* =========================================================
   SECURITY
   ========================================================= */

function escapeHTML(value) {

    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}