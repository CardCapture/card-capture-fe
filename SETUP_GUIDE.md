# Card Capture Frontend - Co-Founder Setup

## Part 1: What Kreg Does Before the Call

### Already Done
- [x] Branch protection on `main` and `staging` (PRs required, unit tests must pass)
- [x] `CLAUDE.md` added to repo with contributor instructions
- [x] `.env.grant` created locally (gitignored, won't be committed)
- [x] Claude Code settings template ready
- [x] Grant invited to CardCapture GitHub org

### Before the Call
1. **Send Grant two things via text/Signal** (not email, they contain keys):
   - The `.env.grant` file (he'll save this as `.env.local` later)
   - The `settings.json` content from the "Claude Code Settings" section below

2. **Make sure Grant has done these before the call:**
   - Created a GitHub account and accepted the CardCapture org invite
   - Signed up for Claude Pro ($20/month) at https://claude.ai
   - Has his Windows laptop ready

---

## Part 2: On the Phone with Grant

There are only 3 manual steps. After that, Claude handles the rest.

### Step 1: Install WSL (~5 min + restart)

1. Click the **Windows search bar** (bottom-left of screen, next to the Start menu)
2. Type **PowerShell**
3. **Right-click** "Windows PowerShell" and choose **"Run as administrator"**
4. If Windows asks "Do you want to allow this app to make changes?" click **Yes**
5. A blue terminal window opens. Type this and press Enter:

```
wsl --install
```

6. Wait for it to finish, then **restart the computer**
7. After restart, a terminal pops up asking for a **username** and **password**. Pick something simple. (Nothing shows when typing the password. That's normal.)

### Step 2: Install Node.js and Claude Code (~5 min)

Open the **Ubuntu** app from the Start menu (search "Ubuntu"). Run these one at a time:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```
(It asks for the password from Step 1. Nothing shows while typing. That's normal.)

```bash
sudo apt-get install -y nodejs
```

```bash
npm install -g @anthropic-ai/claude-code
```

### Step 3: Set Up Claude Code Settings (~3 min)

Still in the Ubuntu terminal:

```bash
mkdir -p ~/.claude
nano ~/.claude/settings.json
```

A text editor opens in the terminal:
1. **Right-click** in the terminal to paste the settings.json content (Ctrl+V won't work here)
2. Press **Ctrl+X** to exit
3. It asks "Save modified buffer?" -- press **Y**
4. It shows the filename -- press **Enter**

---

### That's it for manual steps. Claude handles the rest.

Run this:

```bash
claude
```

Log in with the Claude Pro account (a browser window opens, follow the prompts).

Once Claude is running, tell it:

> "Read the file SETUP_GUIDE.md and walk me through the remaining setup steps."

Claude will read this file and take it from here.

---

## Setup Steps for Claude to Follow

Claude: the user is a non-technical co-founder setting up this project for the first time on Windows/WSL. Walk them through each step below one at a time. Explain what you're doing in plain language. Wait for confirmation before moving to the next step.

### 1. Create the workspace folder structure
```bash
mkdir -p ~/cardcapture/collateral
```

This creates:
- `~/cardcapture/` -- root workspace for all Card Capture work
- `~/cardcapture/collateral/` -- for marketing flyers, copy drafts, brainstorms, and anything that doesn't go in the codebase

Create a README in the collateral folder so the user knows what it's for:
```bash
cat > ~/cardcapture/collateral/README.md << 'EOF'
# Card Capture Collateral

Use this folder for anything that doesn't belong in the codebase:
- Marketing flyers and one-pagers
- Copy drafts and messaging docs
- Brainstorms and planning notes
- Design briefs

You can ask Claude to create and edit files here. Nothing in this folder is tracked by git or deployed anywhere.
EOF
```

### 2. Set up Git identity
```bash
git config --global user.name "Grant"
git config --global user.email "grant@cardcapture.io"
```

### 3. Generate SSH key for GitHub
Run:
```bash
ssh-keygen -t ed25519 -C "grant@cardcapture.io"
```
Press Enter for all prompts (no passphrase).

Then show the public key:
```bash
cat ~/.ssh/id_ed25519.pub
```

Tell the user to:
1. Copy the key (select text, right-click to copy)
2. Open https://github.com/settings/keys in their browser
3. Click "New SSH key"
4. Name it "Windows laptop"
5. Paste the key and click "Add SSH key"

Wait for them to confirm before continuing.

### 4. Test GitHub connection
```bash
ssh -T git@github.com
```
Should say "Hi [username]! You've successfully authenticated."

If it fails, help them troubleshoot the SSH key setup.

### 5. Clone the repository
```bash
cd ~/cardcapture
git clone git@github.com:CardCapture/card-capture-fe.git
cd card-capture-fe
npm install
```
The npm install takes a minute or two. That's normal.

### 6. Create the .env.local file
Ask the user: "Kreg sent you a .env file via text. Can you paste the contents here?"

Save what they paste as `~/cardcapture/card-capture-fe/.env.local`

### 7. Test the app
```bash
npm run dev
```
Tell the user to open http://localhost:3000 in their Windows browser. They should see the Card Capture app. If it loads, the setup is working.

### 8. First test change
Walk them through the full workflow:
1. Create a branch: `git checkout -b feat/grant-test`
2. Make a small visible change to `src/pages/AboutPage.tsx` (change a heading or add a line of text)
3. Have them preview it at http://localhost:3000/about
4. Commit the change, push the branch, and open a PR to staging
5. Tell them Kreg will review and merge the PR on his end

If this whole loop works, the setup is complete.

Tell the user their workspace is set up like this:
```
~/cardcapture/
  card-capture-fe/    -- the app code (git repo)
  collateral/         -- marketing materials, copy drafts, etc.
```

To work, just run `cd ~/cardcapture && claude`. Claude can access both folders from there.

---

## Claude Code Settings

This is the settings.json content to paste in Step 3:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run dev)",
      "Bash(npm run build)",
      "Bash(npm run lint)",
      "Bash(npm test)",
      "Bash(npm run test:unit)",
      "Bash(npm run test:unit:*)",
      "Bash(git status)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git branch*)",
      "Bash(git checkout -b *)",
      "Bash(git checkout staging)",
      "Bash(git pull*)",
      "Bash(git add *)",
      "Bash(git stash*)",
      "Bash(ls *)",
      "Bash(cat *)",
      "Bash(pwd)",
      "Bash(node --version)",
      "Bash(npm --version)"
    ],
    "deny": [
      "Bash(git push --force*)",
      "Bash(git push -f*)",
      "Bash(git push origin main*)",
      "Bash(git push origin staging*)",
      "Bash(rm -rf *)",
      "Bash(sudo *)"
    ]
  }
}
```

---

## Daily Workflow (for Grant, after setup)

Open the Ubuntu terminal, then:

```bash
cd ~/cardcapture
claude
```

Tell Claude what you want to do in plain English. Examples:
- "Update the heading on the home page" (Claude edits code in `card-capture-fe/`)
- "Change the contact email on the contact page"
- "Draft a one-pager for recruiters explaining Card Capture" (Claude creates it in `collateral/`)
- "Create a marketing flyer for career fairs"

Claude can access both folders from here. For code changes, it handles branching, committing, pushing, and opening PRs. For collateral, it just creates files locally.

## Tips
- Always preview changes in the browser before committing
- If something looks wrong, tell Claude to fix it or undo it
- VS Code works great with WSL: run `code .` from the Ubuntu terminal
- If Claude gets rate limited, take a break and try later
- You can ask Claude anything: "What does this file do?" or "Where is the contact page?"

## Troubleshooting

**localhost:3000 not loading**: Make sure the dev server is running. Try http://127.0.0.1:3000.

**npm install failed**: Tell Claude "run sudo apt-get update and then try npm install again"

**"Permission denied (publickey)"**: SSH key isn't linked to GitHub. Tell Claude "help me set up my SSH key for GitHub."

**Claude rate limited**: Pro plan has usage limits. Take a break and come back later.
