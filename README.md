# MonkeyPatch Content Management System

A content management system for lazy developers.

Live-edit your website inside Developer Tools, and changes are automagically synced to your Github repo.

## Get Started

* Create a Github repository and enable Github pages
* Include `dist/monkeypatch.min.js` in your HTML with something like `<script src="monkeypatch.min.js" type="text/javascript"></script>`
* Grab a [Personal Access Token on Github](https://github.com/settings/tokens) with repo access
* Open up the developer console on your webpage and type `_mp.init()`
* You will be prompted for the following:
  * Enter your repo's URL (eg. "https://github.com/userOrOrg/repoName")
  * Enter your repo's branch name (defaults to `main`)
  * Enter the path of the HTML file in your repo (for example, `index.html` or `docs/index.html`)
  * Enter your Github Personal Access Token that has permission to save to your repo
  * This information will be kept in your `localStorage`. You can clear it out with `_mp.clear()`
* Edit your webpage using Devtools and your changes will get synced to your repo!

## Development

All code lives in `monkeypatch.js` and has no dependencies.

After modifying `monkeypatch.js`, minify the code using an external service and place the result in `dist/monkeypatch.min.js`.
