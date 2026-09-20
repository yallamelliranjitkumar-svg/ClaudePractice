# NonStaff Physician Directory

A small web app for storing and looking up non-staff physician (provider) information. It is plain HTML, CSS and JavaScript: no build step, no dependencies, no server.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure: login, menu, insert flow and find screen |
| `styles.css` | Look and feel: white background, light-green header, Times New Roman, centered layout |
| `app.js` | All behavior: login, insert steps, validation, search, storage |

## How to open the app

**Option 1: open the file directly.** Download or clone this repository and double-click `index.html`. It opens in your default browser.

**Option 2: run a local web server** (closer to how it would behave when hosted). From the repository folder:

```bash
python -m http.server 5173
```

Then visit <http://localhost:5173>. Any static file server works, for example `npx serve`.

**Option 3: host it on GitHub Pages.** In the repository go to *Settings > Pages*, set the source to the `main` branch and the `/ (root)` folder, and save. After a minute the app is served at:

```
https://yallamelliranjitkumar-svg.github.io/ClaudePractice/
```

## Logging in

| | |
| --- | --- |
| Username | `admin` |
| Password | `physician123` |

> **These are demo credentials, not real security.** The app has no server, so the username and password are written in plain text at the top of `app.js`, and anyone who can open the page (or this public repository) can read them. Do not store real patient or provider data behind this login. See *Making the login real* below.

## Using the app

1. **Log in** with the credentials above.
2. Choose **Insert a Provider** or **Find a Provider**.
3. **Insert a Provider** works in three saved steps; each section opens after the previous one is saved:
   1. Provider details: PID, First name, Middle initial (optional), Last name, Speciality (dropdown)
   2. Address: Address first line, City, Pincode, State
   3. Phone number (required) and Fax number (optional)

   The provider is stored when the last step is saved. PIDs must be unique. Use **Edit** on a saved section to fix a mistake before the final save.
4. **Find a Provider**: enter a PID (exact match) or a name (any order, partial matches allowed).
5. **Log out** from the header.

## Where the data is stored

Providers are saved in the browser's `localStorage` under the key `nonstaff-physician-directory:v1`. This means:

- Data stays on the computer and browser where it was entered. It is **not** shared between users, browsers or devices, and it is not stored on GitHub.
- Clearing the browser's site data deletes the providers.
- Nothing is sent over the network.

## Making the login real

A static page cannot keep a password secret. To protect real data you need a backend, for example:

- A small server (Node/Express, Flask, etc.) that checks credentials and stores the providers in a database, or
- A hosted service (Firebase, Supabase, Auth0) that handles sign-in and storage.

## Project status

First version. Not yet done: editing or deleting saved providers, a shared database, and real authentication.
