# ERUDITIO — Your Everyday Guide

A simple, no-jargon guide to running the app and adding your notes.
You do **not** need to be a developer. Just follow the steps.

> **What this app does:** you drop your Markdown (`.md`) notes into a folder,
> and ERUDITIO automatically turns them into flashcards and schedules reviews
> so you actually remember what you read. Everything runs on your own computer.

---

## 0. One-time setup (only the very first time)

You need **Docker Desktop** installed and running.

- If you don't have it: download it from <https://www.docker.com/products/docker-desktop/>,
  install it, and open it once so the whale icon appears in your menu bar.
- That's it. You never have to touch it again — just make sure it's running
  before you start the app.

Everything below is run from the project folder:

```
/Users/mehrdad/Desktop/my-site/Eruditio
```

To open a terminal already in that folder, you can run this line:

```bash
cd /Users/mehrdad/Desktop/my-site/Eruditio
```

---

## 1. Start the app

In the project folder, run:

```bash
docker compose up -d
```

Wait about 10–20 seconds the first time. Then open your browser at:

### 👉 http://localhost:8080

That's the app. **No login, no password** — it opens straight to your dashboard.

> The `-d` just means "run in the background" so you can close the terminal
> and the app keeps running.

---

## 2. Add your notes

You have two ways. Use whichever feels easier.

### Way A — the helper script (recommended)

The `add-notes.sh` script takes your `.md` files, fixes them up, and files them
into the app automatically. Run it from the project folder.

**Add one file:**
```bash
./add-notes.sh -d Biology  ~/Desktop/photosynthesis.md
```

**Add several files into a subject + topic, with tags:**
```bash
./add-notes.sh -d Math -t Algebra --tags "groups, symmetry"  ~/notes/*.md
```

**Add a whole folder at once:**
```bash
./add-notes.sh -d History  ~/Documents/history-notes/
```

**Just preview (writes nothing):**
```bash
./add-notes.sh -d Biology --dry-run  ~/Desktop/photosynthesis.md
```

Within a second or two the app shows a "flashcards generated" message and your
note appears. You don't need to restart anything.

#### Script options

| What you type        | What it means                        | Default   |
|----------------------|--------------------------------------|-----------|
| `-d "Name"`          | Subject / domain (top folder)        | `General` |
| `-t "Name"`          | Topic (sub-folder)                   | none      |
| `--tags "a, b, c"`   | Tags for the note                    | empty     |
| `--difficulty N`     | How hard it is, 1–5                  | `3`       |
| `--lang en`          | Language code (`en`, `de`, `fr`…)    | `en`      |
| `--source "URL"`     | Where the note came from             | empty     |
| `--dry-run` or `-n`  | Preview only, write nothing          | off       |
| `--help` or `-h`     | Show built-in help                   | —         |

> The script never changes your original files — it copies cleaned-up versions
> into the app's vault. Anything you already wrote (your text, your headings,
> your `[[links]]`) is kept exactly as-is.

### Way B — by hand (drag & drop)

The app watches this folder:

```
/Users/mehrdad/Desktop/my-site/Eruditio/vault
```

Open it in Finder:
```bash
open /Users/mehrdad/Desktop/my-site/Eruditio/vault
```

Drag any `.md` file in there. The folder you put it in becomes its subject:

```
vault/Mathematics/Algebra/Group Theory.md   →  subject "Mathematics", topic "Algebra"
vault/Biology/Cells.md                       →  subject "Biology"
vault/loose-note.md                          →  subject "General"
```

That's all — it gets indexed automatically.

---

## 3. What a note can look like

Plain Markdown is fine. Optionally, the top can have a small info block
(all lines optional):

```markdown
---
title: Group Theory
tags: [algebra, symmetry]
difficulty: 3
language: en
source: https://example.com
---

# Group Theory

A **group** is a set with an operation that is associative, has an identity,
and where every element has an inverse.

See also [[Vector Spaces]]   ← this becomes a link in the Graph view
```

If you skip the top block, the title comes from the filename and difficulty
defaults to 3. The `add-notes.sh` script fills all of this in for you.

---

## 4. Stop the app

When you're done for the day (optional — it's fine to leave it running):

```bash
docker compose down
```

Your notes and progress are **saved** and will be there next time you start it.

---

## 5. Start it again later

```bash
cd /Users/mehrdad/Desktop/my-site/Eruditio
docker compose up -d
```

Then open **http://localhost:8080** again.

---

## 6. Quick troubleshooting

| Problem | Fix |
|---|---|
| Page won't open at localhost:8080 | Make sure Docker Desktop is running, then `docker compose up -d` and wait ~15s. |
| A note didn't appear | Check the file ends in `.md` and is inside the `vault` folder. Open **Settings → Vault → Re-index** in the app. |
| "Cannot connect" / it looks empty | The app shows a small offline banner if the engine isn't up. Run `docker compose up -d` and reload the page. |
| Want to start fresh | Empty the `vault` folder and remove your notes; ask me to clear the database. |
| Is everything running? | `docker compose ps` — you should see 4 services "Up". |

---

## Cheat sheet

```bash
# go to the project
cd /Users/mehrdad/Desktop/my-site/Eruditio

# start  /  stop
docker compose up -d
docker compose down

# add notes
./add-notes.sh -d Subject -t Topic  myfile.md
./add-notes.sh -d Subject  ~/a-folder-of-notes/

# open the app
#   browser → http://localhost:8080
```

That's everything you need. Happy learning! 📚
