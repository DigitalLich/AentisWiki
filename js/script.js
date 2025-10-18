/*  -----------------------------------------
                    Data Tree
    ----------------------------------------- */
const CODEX_DATA = {
    "Geo & Org": {
        type: "folder",
        children: {
            "Eusacix": {
                type: "folder",
                children: {
                    "Hestein Empire": { type: "link", href: "html/eusacix/hestein-empire.html" }
                }
            },
            "Continents": { type: "link", href: "continents.html" }
        }
    },
    "Meta": {
        type: "folder",
        children: {
            "Welcome": { type: "link", href: "index.html" },
        }
    },
    "Author's Notes": {
        type: "folder",
        children: {
            "About": { type: "link", href: "about.html" }
        }
    }
};

/*  -----------------------------------------
                Sidebar elements
    ----------------------------------------- */
const elList   = document.getElementById("codex-list");
const elCrumb  = document.getElementById("codex-breadcrumb");
const input    = document.getElementById("codex-search-input");
const btn      = document.getElementById("codex-search-button");

/*  -----------------------------------------
    State: normal drill-down vs search mode
    ----------------------------------------- */
let path = [];                // e.g. ["Geo & Org", "Eusacix"]
let mode = "browse";          // "browse" | "search"
let lastQuery = "";
let lastResults = [];

/*  -----------------------------------------
    Helpers: data traversal & flattening
    ----------------------------------------- */
function getNode(p) {
    let node = { type: "folder", children: CODEX_DATA };
    for (const key of p) {
        node = node?.children?.[key];
        if (!node) break;
    }
    return node;
}

function flattenTree(tree, trail = []) {
    const rows = [];
    for (const [label, item] of Object.entries(tree)) {
        const nextTrail = [...trail, label];
        if (item.type === "folder") {
            rows.push({
                kind: "folder",
                label,
                trail: nextTrail,      // ["Geo & Org","Eusacix"]
            });
            if (item.children) {
                rows.push(...flattenTree(item.children, nextTrail));
            }
        } else {
            rows.push({
                kind: "link",
                label,
                trail: nextTrail,      // includes the article label at end
                href: item.href
            });
        }
    }
    return rows;
}

const ALL_ROWS = flattenTree(CODEX_DATA);

/*  -----------------------------------------
        Search (tokenized, case-insensitive)
    ----------------------------------------- */
function normalize(s) {
    return s
        .normalize("NFD").replace(/\p{Diacritic}/gu, "") // strip accents
        .toLowerCase();
}

function searchCodex(query) {
    const q = normalize(query).trim();
    if (!q) return [];
    const tokens = q.split(/\s+/).filter(Boolean);

    return ALL_ROWS.filter(row => {
        const hay = normalize(row.label + " " + row.trail.join(" "));
        return tokens.every(tok => hay.includes(tok));
    }).slice(0, 100); // cap to avoid huge lists
}

/*  -----------------------------------------
    URL hash routing (browse or search)
       - browse: #/Geo%20%26%20Org/Eusacix
       - search: #search?q=empire
    ----------------------------------------- */
function setBrowseHashFromPath() {
    const slug = "/" + path.map(encodeURIComponent).join("/");
    history.replaceState(null, "", "#" + slug);
}

function setSearchHash(q) {
    const url = new URL(location.href);
    url.hash = "search?q=" + encodeURIComponent(q);
    history.replaceState(null, "", url);
}

function parseHash() {
    const h = location.hash.replace(/^#/, "");
    if (!h) return { mode: "browse", path: [] };

    if (h.startsWith("search")) {
        // expect search?q=...
        const m = /(?:^search|\?)(?:.*[?&])?q=([^&]+)/.exec(h);
        const q = m ? decodeURIComponent(m[1]) : "";
        return { mode: "search", query: q };
    }

    // browse path: "/Geo%20%26%20Org/Eusacix"
    const parts = h.split("/").filter(Boolean).map(decodeURIComponent);
    return { mode: "browse", path: parts };
}

/*  -----------------------------------------
            Rendering (browse mode)
    ----------------------------------------- */
function renderBrowse() {
    const node = getNode(path) ?? { type: "folder", children: {} };

    // breadcrumb
    elCrumb.innerHTML = "";
    const rootLink = document.createElement("a");
    rootLink.href = "#/";
    rootLink.textContent = "World Codex";
    elCrumb.appendChild(rootLink);

    let acc = [];
    path.forEach(seg => {
        const sep = document.createElement("span");
        sep.className = "sep";
        sep.textContent = "›";
        elCrumb.appendChild(sep);

        acc.push(seg);
        const link = document.createElement("a");
        link.href = "#/" + acc.map(encodeURIComponent).join("/");
        link.textContent = seg;
        elCrumb.appendChild(link);
    });

    // list
    elList.innerHTML = "";

    if (path.length > 0) {
        const back = document.createElement("li");
        back.className = "codex-item codex-back";
        back.setAttribute("role", "button");
        back.tabIndex = 0;
        back.innerHTML = `<span class="codex-icon">↩︎</span><span>Back</span>`;
        back.addEventListener("click", () => {
            path.pop();
            setBrowseHashFromPath();
            render();
        });
        back.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); back.click(); }
        });
        elList.appendChild(back);
    }

    const children = Object.entries(node.children ?? {});
    for (const [label, item] of children) {
        const li = document.createElement("li");
        li.className = "codex-item";

        if (item.type === "folder") {
            li.setAttribute("role", "button");
            li.tabIndex = 0;
            li.innerHTML = `<span class="codex-icon">📁</span><span>${label}</span>`;
            li.addEventListener("click", () => {
                path.push(label);
                setBrowseHashFromPath();
                render();
            });
            li.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); li.click(); }
            });
        } else {
            li.innerHTML = `<span class="codex-icon">📄</span><a href="${item.href}">${label}</a>`;
        }

        elList.appendChild(li);
    }
}

/*  -----------------------------------------
            Rendering (search mode)
    ----------------------------------------- */
function renderSearch() {
    // breadcrumb: "Search: <query>" + a clear/back to root link
    elCrumb.innerHTML = "";
    const rootLink = document.createElement("a");
    rootLink.href = "#/";
    rootLink.textContent = "World Codex";
    elCrumb.appendChild(rootLink);

    const sep = document.createElement("span");
    sep.className = "sep";
    sep.textContent = "›";
    elCrumb.appendChild(sep);

    const label = document.createElement("span");
    label.textContent = `Search: "${lastQuery}"`;
    elCrumb.appendChild(label);

    // list: results
    elList.innerHTML = "";

    if (!lastQuery.trim()) {
        const tip = document.createElement("li");
        tip.className = "codex-item";
        tip.innerHTML = `<span class="codex-icon">🔎</span><span>Type a term and press Enter</span>`;
        elList.appendChild(tip);
        return;
    }

    if (lastResults.length === 0) {
        const none = document.createElement("li");
        none.className = "codex-item";
        none.innerHTML = `<span class="codex-icon">🙈</span><span>No matches</span>`;
        elList.appendChild(none);
        return;
    }

    for (const row of lastResults) {
        const li = document.createElement("li");
        li.className = "codex-item codex-hit";

        const trailText = row.trail.slice(0, -1).join(" › ");
        const title = row.label;

        if (row.kind === "folder") {
            li.setAttribute("role", "button");
            li.tabIndex = 0;
            li.innerHTML =
                `<span class="codex-icon">📁</span>
                 <div style="display:flex;flex-direction:column;gap:2px;">
                   <span>${title}</span>
                   <small class="trail">${trailText}</small>
                 </div>`;
            li.addEventListener("click", () => {
                // jump directly to that folder path
                path = row.trail; // for folders, trail ends at the folder
                mode = "browse";
                setBrowseHashFromPath();
                render();
            });
            li.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); li.click(); }
            });
        } else {
            li.innerHTML =
                `<span class="codex-icon">📄</span>
                 <div style="display:flex;flex-direction:column;gap:2px;">
                   <a href="${row.href}">${title}</a>
                   <small class="trail">${trailText}</small>
                 </div>`;
        }

        elList.appendChild(li);
    }
}

/*  -----------------------------------------
            Top-level render switch
    ----------------------------------------- */
function render() {
    if (mode === "search") {
        renderSearch();
    } else {
        renderBrowse();
    }
}

/*  -----------------------------------------
    Search wiring (button + Enter + hash)
    ----------------------------------------- */
function submitSearch() {
    const q = input.value || "";
    lastQuery = q;
    lastResults = searchCodex(q);
    mode = "search";
    setSearchHash(q);
    render();
}

btn?.addEventListener("click", submitSearch);
input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitSearch();
});

/*  -----------------------------------------
        Init from hash & keep synced
    ----------------------------------------- */
function initFromHash() {
    const parsed = parseHash();
    if (parsed.mode === "search") {
        mode = "search";
        lastQuery = parsed.query || "";
        if (input) input.value = lastQuery;
        lastResults = searchCodex(lastQuery);
    } else {
        mode = "browse";
        path = parsed.path || [];
    }
    render();
}

window.addEventListener("hashchange", initFromHash);
document.addEventListener("DOMContentLoaded", initFromHash);
