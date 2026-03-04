# Card Capture Frontend - Co-Founder Setup

## Part 1: What Kreg Does Before the Call

### Already Done
- [x] Branch protection on `main` and `staging` (PRs required, unit tests must pass)
- [x] `CLAUDE.md` added to repo with contributor instructions
- [x] `.env.grant` created locally (gitignored, won't be committed)
- [x] Claude Code settings template ready
- [x] Grant invited to CardCapture GitHub org

### Before the Call
1. **Commit CLAUDE.md and SETUP_GUIDE.md to staging**
   ```bash
   cd card-capture-fe
   git add CLAUDE.md SETUP_GUIDE.md
   git commit -m "Add CLAUDE.md and setup guide for contributors"
   git push origin staging
   ```

2. **Send Grant two files via text/Signal** (not email, they contain keys):
   - `.env.grant` (he'll save this as `.env.local`)
   - The `settings.json` content from Part 2 Step 6 below

3. **Make sure Grant has done these before the call:**
   - Created a GitHub account and accepted the CardCapture org invite
   - Signed up for Claude Pro ($20/month) at https://claude.ai
   - Has his Windows laptop ready

---

## Part 2: On the Phone with Grant

Walk him through these steps. He types, you talk him through it.

### Step 1: Install WSL (~5 min + restart)

Tell him to open **PowerShell as Administrator** (right-click, "Run as administrator"):

```
wsl --install
```

This installs Ubuntu. **He needs to restart his computer.** After restart, Ubuntu opens automatically and asks for a username and password. Tell him to pick something simple.

### Step 2: Install Node.js (~3 min)

In the Ubuntu terminal:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

Should show v20.x.

### Step 3: Set Up Git Identity (~2 min)

```bash
git config --global user.name "Grant"
git config --global user.email "grant@cardcapture.io"
```

### Step 4: SSH Key for GitHub (~5 min)

```bash
ssh-keygen -t ed25519 -C "grant@cardcapture.io"
```

Tell him to press Enter for every prompt (no passphrase).

```bash
cat ~/.ssh/id_ed25519.pub
```

He copies the output, goes to https://github.com/settings/keys, clicks "New SSH key", pastes it, saves.

Test it:
```bash
ssh -T git@github.com
```

Should say "Hi [username]! You've successfully authenticated."

### Step 5: Clone the Repo (~3 min)

```bash
git clone git@github.com:CardCapture/card-capture-fe.git
cd card-capture-fe
npm install
```

The `npm install` takes a minute or two.

### Step 6: Add Config Files (~3 min)

**The .env.local file** (the one you texted him as `.env.grant`):

```bash
nano .env.local
```

He pastes the contents you sent him, then `Ctrl+X`, `Y`, `Enter` to save.

**The Claude settings file:**

```bash
mkdir -p ~/.claude
nano ~/.claude/settings.json
```

He pastes this, then `Ctrl+X`, `Y`, `Enter`:

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

### Step 7: Test the App (~2 min)

```bash
npm run dev
```

He opens his Windows browser to http://localhost:3000. The app should load and work against the staging API.

`Ctrl+C` to stop the server.

### Step 8: Install and Launch Claude Code (~5 min)

```bash
npm install -g @anthropic-ai/claude-code
```

Then:
```bash
cd ~/card-capture-fe
claude
```

He'll be prompted to authenticate with his Claude Pro account. Follow the browser flow.

### Step 9: First Test Run (~10 min)

Once Claude is running, walk him through this:

1. **Create a branch:**
   Tell Claude: "Create a new branch called feat/grant-test"

2. **Make a small change:**
   Tell Claude: "On the About page, add a line that says 'Test change by Grant' at the top"

3. **Preview it:**
   Tell Claude: "Run the dev server so I can preview"
   He checks http://localhost:3000/about in his browser.

4. **Commit and push:**
   Tell Claude: "Commit this change and push it to my branch"
   (Claude will ask for approval on the commit and push since they're not in the allow list)

5. **Open a PR:**
   Tell Claude: "Open a pull request to staging"

6. **You review the PR on your end**, approve it, then close/delete the test branch.

If that whole loop works, he's good to go. Delete the test branch and celebrate.

---

## Daily Workflow (for Grant, after setup)

```bash
# Open Ubuntu terminal
cd card-capture-fe
git checkout staging
git pull
git checkout -b feat/describe-your-change
claude
```

Describe what you want in plain English. Preview in the browser. Ask Claude to commit, push, and open a PR when you're happy.

## Tips
- Always preview changes in the browser before committing
- If something looks wrong, tell Claude to fix it or undo it
- VS Code works great with WSL: run `code .` from the Ubuntu terminal
- If Claude gets rate limited, take a break and try later

## Troubleshooting

**localhost:3000 not loading**: Make sure `npm run dev` is running. Try http://127.0.0.1:3000.

**npm install failed**: Run `sudo apt-get update && sudo apt-get upgrade -y` then try again.

**"Permission denied (publickey)"**: SSH key isn't set up right. Re-do Step 4.

**Claude rate limited**: Pro plan has limits. For heavy sessions, let Kreg know.
