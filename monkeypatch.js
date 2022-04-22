window._mp = {
    // Initialize and validate all our configuration data, saving it to localStorage
    init: function (repoURL, branchName, filePath, token) {
        if (repoURL === undefined) {
            repoURL = prompt("Enter the URL of your github repository (example: 'https://github.com/userOrOrg/repoName')");
        }
        // Validate the repoURL
        const url = new URL(repoURL);
        if (url.origin !== "https://github.com") {
            console.error("[monkeypatch] " + repoURL + " does not have protocol and domain of 'https://github.com'");
            return;
        }
        const pathPieces = url.pathname.split("/");
        if (pathPieces.length !== 3) {
            console.error("[monkeypatch] URL path in '" + url.pathname + "' should match '/<user_or_org>/<repo_name>'");
            return;
        }
        const userOrg = pathPieces[1];
        const repoName = pathPieces[2];
        if (branchName === undefined) {
            branchName = prompt("Enter the branch name of your repo (leave blank for 'main')");
            if (branchName === "") {
                branchName = "main";
            }
        }
        if (filePath === undefined) {
            filePath = prompt("Enter the HTML file path for this webpage in your repo (leave blank for 'index.html')");
            if (filePath === "") {
                filePath = "index.html";
            }
            // Strip any leading slash
            if (filePath[0] === "/") {
                filePath = filePath.slice(1);
            }
        }
        if (token === undefined) {
            token = prompt("Enter a Github Personal Access Token that can write to branch name of your repo (leave blank for 'main')");
            if (token === "") {
                console.error("[monkeypatch] No token entered; cannot continue.");
                return;
            }
        }
        localStorage.setItem("userOrg", userOrg);
        localStorage.setItem("repoName", repoName);
        localStorage.setItem("branchName", branchName);
        localStorage.setItem("filePath", filePath);
        localStorage.setItem("token", token);
        window._mp.contents = document.documentElement.innerHTML;
        window._mp.connect();
    },
    // Delete all stateful data
    clear: function () {
        window._mp.observer.disconnect();
        window._mp.observer = null;
        localStorage.removeItem("userOrg");
        localStorage.removeItem("repoName");
        localStorage.removeItem("branchName");
        localStorage.removeItem("filePath");
        localStorage.removeItem("token");
        console.log("[monkeypatch] All configuration data cleared.");
    },
    // Connect to github and start auto-saving changes to the DOM
    connect: function() {
        console.log("[monkeypatch] Listening to page changes");
        window._mp.observer = new MutationObserver(function () {
            // Run this code on any change to the DOM
            // Throttle to save at most once every 1s
            const contents = document.documentElement.innerHTML;
            if (_mp.contents === contents) {
                // No changes
                return;
            }
            if (_mp.contents === null) {
                // First pageload
                _mp.contents = contents;
                return;
            }
            _mp.lastChange = Number(new Date());
            _mp.contents = contents;
        });
        // Listen for all changes to any nodes
        // Warning: this is probably memory intensive (an alternative would be to use polling)
        window._mp.observer.observe(document.documentElement, {
            attributes: true,
            childList: true,
            subtree: true,
            characterData: true,
        });
        // Check for saves every 3s
        setInterval(() => {
            if (_mp.lastChange > _mp.lastSave) {
                _mp.sync();
            }
        }, _mp.saveInterval);
    },
    sync: function (cb) {
        // Sync _mp.contents to Github using the cached config
        const owner = localStorage.getItem("userOrg");
        const repo = localStorage.getItem("repoName");
        const path = localStorage.getItem("filePath");
        const baseURL = "https://api.github.com/repos/" + owner + "/" + repo
        window.fetch(baseURL + "/contents/" + path)
            .then((resp) => resp.json()).then((resp) => {
                if (resp.type !== "file") {
                    throw new Error("File located at '" + owner + "/" + repo + "/" + path + "' is not a file");
                }
                const sha = resp.sha;
                const data = JSON.stringify({
                    message: "monkeypatch " + path,
                    content: window.btoa(_mp.contents),
                    sha,
                });
                const request = {
                    method: "PUT",
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token"),
                        "Content-Type": "application/json",
                        "Accept": "application/vnd.github.v3+json",
                    },
                    body: data,
                };
                window.fetch(baseURL + "/contents/" + path, request)
                    .then((resp) => {
                        if (!resp.ok) {
                            if (resp.status === 409) {
                                // Too many requests. Try again next time.
                                return;
                            }
                            throw new Error("Error saving to Github: " + resp.status + " " + resp.statusText);
                        }
                        // Call the callback, if present
                        _mp.lastSave = Number(new Date());
                        // Reset retry interval to default
                        _mp.retryInterval = 5000;
                        console.log("[monkeypatch] Saved changes at " + new Date());
                    })
                    .catch((err) => {
                        // Runtime error saving to github
                        console.error("[monkeypatch] " + err);
                    });
        }).catch((err) => {
            console.error("[monkeypatch] " + err);
        });
    },
    observer: null,
    contents: null,
    lastSave: 0,
    lastChange: 0,
    saveInterval: 3000,
};

// Stuff to run immediately
(function() {
    if (localStorage.userOrg && localStorage.repoName && localStorage.branchName && localStorage.filePath && localStorage.token) {
        console.log("[monkeypatch] Found existing config data. Run `_mp.init()` to reset and `_mp.clear()` to remove config.");
        window._mp.connect();
    } else {
        console.log("[monkeypatch] No config found. Run `_mp.init()` to initialize configuration data.");
        console.log("[monkeypatch] See https://github.com/jayrbolton/monkeypatch-cms for help.");
    }
})();
