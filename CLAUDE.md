<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

# CeleMod — Project Guide

CeleMod is a Celeste game mod manager. Tauri v2 desktop app with a Rust backend and React frontend. Originally a Sciter app, ported to Tauri.

## Commands

```sh
# Dev — launch Tauri app with hot reload
cargo tauri dev

# Production build
cargo tauri build

# Frontend only
bun run build

# Rust checks
cargo check -p cele-mod
```

## Project Structure

```
celemod/
  src-tauri/              # Rust backend (Tauri v2)
    src/main.rs           # Entry point + self-update (/update arg swap)
    src/lib.rs            # Tauri builder, plugin registration, ~30 command handlers
    src/commands.rs       # All #[tauri::command] functions + utility helpers
    src/types.rs          # Shared types (DownloadInfo, LocalMod, etc.)
    src/everest.rs        # Everest mod loader install/detect, mod list caching
    src/blacklist.rs      # Mod blacklist profile management
    src/ureq.rs           # Multi-threaded HTTP download utility
    src/wegfan.rs         # WEGFan API data structures
    tauri.conf.json       # Window config, plugins, CSP
    capabilities/         # Tauri v2 permission capabilities

  src/                     # Frontend (React + TypeScript)
    index.tsx              # Entry point
    App.tsx                # MemoryRouter, GlobalContext, sidebar, Routes
    i18n.ts                # i18next config (6 locales, {key} interpolation)
    states.ts              # Zustand stores + @tauri-apps/plugin-store persistence
    utils.ts               # callRemote() → Tauri invoke(), event helpers
    api/                   # HTTP API clients (wegfan API)
    components/            # Shared UI components (Button, Popup, ModList, etc.)
    context/               # Business logic (download, modManage, everest, blacklist, theme)
    routes/                # Pages (Home, Search, Manage, Everest, Multiplayer, RecommendMods, RecommendMaps)
    locales/               # Translation JSON files (zh-CN, en-US, ru-RU, pt-BR, fr-FR, de-DE)
    resources/             # Images
```

## IPC: Frontend ↔ Backend

All Rust functions exposed via `#[tauri::command]` in commands.rs, registered in lib.rs.

**Simple commands** — async `callRemote("command_name", arg1, arg2, ...)` returns parsed result.

**Progress commands** (downloads, installs) — Rust emits events via `app_handle.emit("event-name", payload)`; frontend listens with `listenProgress<Payload>("event-name", callback)` before invoking.

Event names: `download-mod-progress`, `everest-install-progress`, `self-update-progress`, `mod-check-progress`.

The `callRemote()` utility maps positional args to named params using a command-name lookup table in utils.ts (`getParamNames`).

## Key Patterns

- **`src/` import alias**: configured in vite.config.ts; use `import x from 'src/y'`
- **Zustand** for shared state; `createPersistedStateByKey` wraps plugin-store for auto-persistence
- **react-i18next** with `{key}` interpolation (not `{{key}}`): `i18n.t('{slot0}分钟前', { slot0: 5 })`
- **Popup system**: Popup.tsx renders React into detached DOM containers via `createRoot()`
- **Test mode**: `--test-mode` flag skips Celeste detection (creates temp dir)

## UI Framework

Uses **HeroUI v3** (React Aria Components) + **Tailwind CSS v4**.

- Components imported from `@heroui/react` (Button, Checkbox, ProgressBar, ProgressCircle, Modal, etc.)
- Styles from `@heroui/styles` imported in `src/globals.css` after `@import "tailwindcss"`
- Icons from **lucide-react**: `<Icon name="icon-name" />` maps to lucide-react icons in `src/components/Icon.tsx`
- No SCSS or CSS modules — all styling via Tailwind utility classes and HeroUI semantic tokens (`bg-surface`, `text-foreground`, `bg-accent/15`, `text-accent`, `border-border`, `bg-default/40`, `shadow-overlay`, etc.)
- Dark/light theme handled by HeroUI automatically via CSS custom properties
