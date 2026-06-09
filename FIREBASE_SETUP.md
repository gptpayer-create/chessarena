# 🔑 ChessMaster PRO — Firebase Production Setup

---

## Step 1 — Firebase Project Banao

1. https://console.firebase.google.com → **Add project**
2. Naam do (jaise: `chessmaster-pro`) → Create

---

## Step 2 — Web App Register Karo

1. Project mein `</>` icon click karo
2. App nickname do → **Register app**
3. Jo `firebaseConfig` milega use copy karo
4. `js/firebase-config.js` mein `YOUR_*` values replace karo

---

## Step 3 — Authentication Enable Karo

**Authentication → Sign-in method:**
- ✅ Google — Enable
- ✅ Email/Password — Enable

**Authentication → Settings → Authorized domains:**
- Apna domain add karo (jaise: `chessmaster.netlify.app`)

---

## Step 4 — Firestore Database Banao (PRODUCTION mode)

1. **Firestore Database → Create database**
2. **"Start in production mode"** select karo ✅
3. Region choose karo (asia-south1 = Mumbai, best for India)

---

## Step 5 — Production Security Rules Lagao

**Firestore → Rules tab → Yeh paste karo → Publish:**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Users: sirf apna data read/write kar sakte hain ──
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null
                    && request.auth.uid == userId
                    && request.resource.data.keys().hasAll(['displayName','elo','streak','createdAt'])
                    && request.resource.data.elo is int
                    && request.resource.data.elo >= 100
                    && request.resource.data.elo <= 4000;
      allow update: if request.auth != null
                    && request.auth.uid == userId
                    && (!request.resource.data.keys().hasAny(['elo']) ||
                       (request.resource.data.elo is int
                        && request.resource.data.elo >= 100
                        && request.resource.data.elo <= 4000));

      // Game history: sirf apni games
      match /games/{gameId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow create: if request.auth != null
                      && request.auth.uid == userId
                      && request.resource.data.moveCount is int
                      && request.resource.data.moveCount >= 1
                      && request.resource.data.moveCount <= 500;
        allow delete: if request.auth != null && request.auth.uid == userId;
      }
    }

    // ── Leaderboard: sabko dikhta hai, sirf apna entry update ──
    match /leaderboard/{userId} {
      allow read: if true;
      allow create, update: if request.auth != null
                            && request.auth.uid == userId
                            && request.resource.data.elo is int
                            && request.resource.data.elo >= 100
                            && request.resource.data.elo <= 4000
                            && request.resource.data.name is string
                            && request.resource.data.name.size() <= 50;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Step 6 — Deploy Karo (Free Hosting)

### Option A — Netlify (Easiest)
1. https://netlify.com/drop
2. `chess-upgrade` folder drag & drop karo
3. Done — live URL mil jaayega instantly

### Option B — GitHub Pages
```bash
git init
git add .
git commit -m "ChessMaster PRO launch"
git remote add origin https://github.com/TUMHARA_USERNAME/chess.git
git push -u origin main
```
GitHub → Settings → Pages → Branch: main → Save

### Option C — Vercel
```bash
npm i -g vercel
vercel deploy
```

---

## Step 7 — Custom Domain (Optional)

Netlify/Vercel dono free mein custom domain support karte hain:
1. Domain kharido (Namecheap, GoDaddy)
2. Netlify → Domain settings → Add custom domain
3. DNS records update karo jaise bataya jaaye

---

## Security Rules Ka Matlab

| Rule | Kya protect karta hai |
|---|---|
| `request.auth.uid == userId` | Koi aur user ka data nahi dekh sakta |
| `elo >= 100 && elo <= 4000` | ELO cheating se bachata hai |
| `moveCount <= 500` | Fake game data block karta hai |
| `name.size() <= 50` | XSS / injection attacks block |
| Leaderboard `read: true` | Sabko global rankings dikhti hain |

---

## Guest vs Logged In

| Feature | Guest | Logged In |
|---|---|---|
| Chess khelna | ✅ | ✅ |
| ELO | Browser only | ☁️ Har device pe sync |
| Game History | 25 games local | ☁️ Cloud (unlimited) |
| Leaderboard | Local | 🌐 Global worldwide |
| Streak | Local | ☁️ Synced |
| Profile photo | ❌ | ✅ Google photo |
