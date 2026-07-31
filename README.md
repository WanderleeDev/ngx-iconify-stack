# NgxIconifyStack Workspace 🏗️

Welcome to the monorepo workspace for **ngx-iconify-stack**. This repository contains the core library, its schematics, and the official documentation site.

---

## 📁 Project Structure

- **[`projects/ngx-iconify-stack/`](./projects/ngx-iconify-stack/)** - The core Angular library source code.
- **[`projects/ngx-iconify-stack/src/schematics/`](./projects/ngx-iconify-stack/src/schematics/)** - Angular CLI schematics to automate library setup (`ng add`, `generate-icon-subset`, `skill`).
- **[`projects/docs/`](./projects/docs/)** - Official documentation site — Angular 22 SSR app with the library in action.

---

## 🚀 Quick Start for Contributors

To set up the workspace locally, follow these steps:

### 1. Install Dependencies

This project uses **npm** as its package manager:

```bash
npm install
```

### 2. Quick Development Commands

Run these commands from the root directory:

| Task              | Command                     | Description                                                         |
| ----------------- | --------------------------- | ------------------------------------------------------------------- |
| **Start Docs**    | `ng serve docs`             | Launches the local dev server for the documentation site.           |
| **Build Library** | `npm run build:lib`         | Compiles the library and its schematics into the `dist/` directory. |
| **Run Tests**     | `ng test ngx-iconify-stack` | Runs the library unit tests (Vitest).                               |
| **Icon Subset**   | `npm run ngx-iconify-stack:generate-icons` | Scans templates and rebuilds the offline icon subset. |

---

## 🤝 Contribution Guidelines

We use conventional commits and structured branching to keep the history clean.

### Commit Messages

Please follow the **Conventional Commits** specification (e.g., `feat(lib): add color input` or `fix(schematics): resolve config paths`).

### Development Workflow

1. Fork the repository and create your feature branch (`git checkout -b feature/my-new-feature`).
2. Implement your changes. Make sure to run `ng test ngx-iconify-stack` and `npm run build:lib` to verify that everything builds and passes.
3. Commit your changes using conventional commits, push to your fork, and open a Pull Request.

---

For technical details on how to use the library in your own project, please refer to the **[Library README](./projects/ngx-iconify-stack/README.md)**.
