/* ═══════════════════════════════════════════════════════════════
   ChessArena — Profile Editor
   ──────────────────────────────────────────────────────────────
   ✅ Firebase signed-in user apna naam change kar sakta hai
   ✅ Custom profile photo upload kar sakta hai (resize → base64)
   ✅ Local users bhi naam change kar sakte hain
   ✅ Updated naam + photo opponent ko online game mein dikhta hai
   ✅ Header avatar + naam bhi turant update hota hai
═══════════════════════════════════════════════════════════════ */

const PE_NAME_KEY   = 'cm_custom_displayname';
const PE_AVATAR_KEY = 'cm_custom_avatar';        // base64 JPEG data-URL

/* ──────────────────────────────────────────────────────────────
   PUBLIC HELPERS — used by online-profile.js & firebase.js
────────────────────────────────────────────────────────────── */
function peGetCustomName()   { return localStorage.getItem(PE_NAME_KEY)   || null; }
function peGetCustomAvatar() { return localStorage.getItem(PE_AVATAR_KEY) || null; }

/* ──────────────────────────────────────────────────────────────
   OPEN / CLOSE
────────────────────────────────────────────────────────────── */
function openEditProfile() {
  const modal = document.getElementById('edit-profile-modal');
  if (!modal) return;

  _pePendingAvatar = null;   // reset pending change

  // Determine current name
  const fbUser = (typeof currentUser !== 'undefined') ? currentUser : null;
  const currentName = peGetCustomName()
    || (fbUser ? (fbUser.displayName || fbUser.email?.split('@')[0]) : null)
    || localStorage.getItem('cm_username')
    || 'Player';

  const nameInput = document.getElementById('ep-name-input');
  if (nameInput) nameInput.value = currentName;

  // Determine current avatar
  const customAv = peGetCustomAvatar();
  const fbPhoto  = fbUser?.photoURL;
  _peRenderAvatarPreview(customAv || fbPhoto || null, currentName);

  document.getElementById('profile-modal')?.classList.remove('show');
  modal.classList.add('show');
}

function closeEditProfile() {
  document.getElementById('edit-profile-modal')?.classList.remove('show');
  _pePendingAvatar = null;
}

/* ──────────────────────────────────────────────────────────────
   AVATAR PREVIEW HELPER
────────────────────────────────────────────────────────────── */
function _peRenderAvatarPreview(src, name) {
  const el = document.getElementById('ep-avatar-preview');
  if (!el) return;
  if (src) {
    el.innerHTML = `<img src="${src}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--gold);">`;
  } else {
    const initial = (name || 'P')[0].toUpperCase();
    el.innerHTML  = '';
    el.textContent = initial;
    el.style.cssText = 'width:80px;height:80px;border-radius:50%;background:var(--gold);color:#120d04;display:flex;align-items:center;justify-content:center;font-size:2.2rem;font-weight:700;border:2px solid var(--gold);';
  }
}

/* ──────────────────────────────────────────────────────────────
   AVATAR FILE SELECT — resize to 128 × 128, store as base64
────────────────────────────────────────────────────────────── */
let _pePendingAvatar = null;   // null = unchanged | '__remove__' | base64 string

function handleAvatarFileChange(input) {
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    _peShowError('Please select a valid image file (JPG, PNG, etc.).');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 128;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const w = Math.round(img.width  * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      _pePendingAvatar = canvas.toDataURL('image/jpeg', 0.82);
      _peRenderAvatarPreview(_pePendingAvatar, document.getElementById('ep-name-input')?.value || 'P');
      _peShowError('');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  input.value = '';   // allow same file re-select
}

function removeCustomAvatar() {
  _pePendingAvatar = '__remove__';
  const name = document.getElementById('ep-name-input')?.value || 'Player';
  _peRenderAvatarPreview(null, name);
}

/* ──────────────────────────────────────────────────────────────
   SAVE
────────────────────────────────────────────────────────────── */
async function saveProfileEdit() {
  const nameInput = document.getElementById('ep-name-input');
  const saveBtn   = document.getElementById('ep-save-btn');

  const newName = nameInput?.value?.trim();
  if (!newName || newName.length < 2) {
    _peShowError('Name must be at least 2 characters.'); return;
  }
  if (newName.length > 24) {
    _peShowError('Name is too long (max 24 characters).'); return;
  }
  _peShowError('');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }

  try {
    /* 1 ── localStorage ── */
    localStorage.setItem(PE_NAME_KEY,   newName);
    localStorage.setItem('cm_username', newName);

    if (_pePendingAvatar === '__remove__') {
      localStorage.removeItem(PE_AVATAR_KEY);
    } else if (_pePendingAvatar) {
      localStorage.setItem(PE_AVATAR_KEY, _pePendingAvatar);
    }

    /* 2 ── Firebase Auth + Firestore ── */
    const fbUser = (typeof currentUser !== 'undefined') ? currentUser : null;
    if (fbUser) {
      const finalAvatar = _pePendingAvatar === '__remove__' ? null
                        : (_pePendingAvatar || peGetCustomAvatar());

      // Auth profile (displayName always; photoURL only if it's a URL not base64 > 1MB limit)
      try {
        const profileUpdate = { displayName: newName };
        if (finalAvatar && finalAvatar.length < 512 * 1024) {
          // base64 ≈ 96 KB is fine for auth photoURL in most configs
          profileUpdate.photoURL = finalAvatar;
        }
        await (typeof fbAuth !== 'undefined' ? fbAuth : firebase.auth())
          .currentUser?.updateProfile(profileUpdate);
        // Refresh local reference
        if (typeof fbAuth !== 'undefined') currentUser = fbAuth.currentUser;
      } catch(e) { /* some configs reject base64 photoURL – ok, localStorage covers it */ }

      // Firestore (stores full base64 — accessible cross-device via leaderboard)
      if (typeof fbDb !== 'undefined' && fbDb) {
        const fsUpdate = { displayName: newName };
        if (_pePendingAvatar === '__remove__') {
          fsUpdate.customPhotoURL = '';
        } else if (_pePendingAvatar) {
          fsUpdate.customPhotoURL = _pePendingAvatar;
        }
        await fbDb.collection('users').doc(fbUser.uid).set(fsUpdate, { merge: true });
        await fbDb.collection('leaderboard').doc(fbUser.uid).set(fsUpdate, { merge: true });
      }
    }

    /* 3 ── Refresh header UI ── */
    if (typeof updateHeaderForUser === 'function' && fbUser) {
      updateHeaderForUser(fbUser);   // firebase.js will pick up localStorage overrides
    } else {
      // Guest / local — update header manually
      const nameEl = document.getElementById('user-name');
      if (nameEl) nameEl.textContent = newName;
      const avEl = document.getElementById('user-avatar');
      if (avEl) {
        const av = peGetCustomAvatar();
        if (av) avEl.innerHTML = `<img src="${av}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">`;
        else    avEl.textContent = newName[0].toUpperCase();
      }
    }

    _pePendingAvatar = null;
    closeEditProfile();
    if (typeof showToast === 'function') showToast('✅ Profile updated!');

  } catch(err) {
    _peShowError('Error: ' + (err.message || 'Could not save. Try again.'));
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Changes'; }
  }
}

/* ──────────────────────────────────────────────────────────────
   ERROR HELPER
────────────────────────────────────────────────────────────── */
function _peShowError(msg) {
  const el = document.getElementById('ep-error');
  if (el) el.textContent = msg;
}

/* ──────────────────────────────────────────────────────────────
   INJECT MODAL INTO DOM
────────────────────────────────────────────────────────────── */
function injectEditProfileModal() {
  if (document.getElementById('edit-profile-modal')) return;

  const div = document.createElement('div');
  div.id = 'edit-profile-modal';
  div.className = 'profile-modal';
  div.style.zIndex = '900';
  div.innerHTML = `
    <div class="profile-box" style="max-width:320px;gap:.85rem;padding:1.5rem 1.3rem;">

      <div style="font-size:1.12rem;font-weight:700;color:var(--gold);text-align:center;letter-spacing:.02em;">
        ✏️ Edit Profile
      </div>

      <!-- Avatar preview -->
      <div style="display:flex;flex-direction:column;align-items:center;gap:.55rem;">
        <div id="ep-avatar-preview"
             style="width:80px;height:80px;border-radius:50%;background:var(--gold);color:#120d04;
                    display:flex;align-items:center;justify-content:center;font-size:2.2rem;
                    font-weight:700;border:2px solid var(--gold);overflow:hidden;">?</div>
        <div style="display:flex;gap:.4rem;">
          <label class="btn" style="font-size:.75rem;cursor:pointer;padding:.32rem .7rem;margin:0;">
            📷 Upload Photo
            <input type="file" accept="image/*" style="display:none;"
                   onchange="handleAvatarFileChange(this)">
          </label>
          <button class="btn"
                  style="font-size:.75rem;padding:.32rem .7rem;color:#e06060;border-color:rgba(220,80,80,.3);"
                  onclick="removeCustomAvatar()">✕ Remove</button>
        </div>
        <div style="font-size:.72rem;color:var(--text-dim);">JPG / PNG · auto-resized to 128×128</div>
      </div>

      <!-- Name input -->
      <div style="width:100%;">
        <label style="font-size:.78rem;color:var(--text-dim);margin-bottom:.28rem;display:block;">
          Display Name
        </label>
        <input id="ep-name-input" type="text" maxlength="24" placeholder="Your name…"
               style="width:100%;box-sizing:border-box;background:var(--panel-bg);
                      border:1px solid var(--border-col);color:var(--text-col);
                      border-radius:6px;padding:.45rem .65rem;font-size:.9rem;outline:none;">
      </div>

      <!-- Error -->
      <div id="ep-error" style="color:#e06060;font-size:.78rem;text-align:center;min-height:1.1em;"></div>

      <!-- Buttons -->
      <div style="display:flex;gap:.5rem;width:100%;">
        <button class="btn" style="flex:1;font-size:.82rem;" onclick="closeEditProfile()">Cancel</button>
        <button id="ep-save-btn" class="btn btn-primary" style="flex:1;font-size:.82rem;"
                onclick="saveProfileEdit()">Save Changes</button>
      </div>
    </div>`;

  document.body.appendChild(div);

  // Close on backdrop click
  div.addEventListener('click', e => { if (e.target === div) closeEditProfile(); });
}

/* ──────────────────────────────────────────────────────────────
   PATCH firebase.js functions to use localStorage overrides
   (runs after all scripts are loaded)
────────────────────────────────────────────────────────────── */
function _pePatchFirebaseFunctions() {

  /* ── updateHeaderForUser ── show custom name/avatar in header */
  if (typeof updateHeaderForUser === 'function') {
    const _orig = updateHeaderForUser;
    updateHeaderForUser = function(user) {
      _orig(user);   // let original run first
      const customName = peGetCustomName();
      const customAv   = peGetCustomAvatar();
      if (customName) {
        const el = document.getElementById('user-name');
        if (el) el.textContent = customName;
      }
      if (customAv) {
        const el = document.getElementById('user-avatar');
        if (el) el.innerHTML = `<img src="${customAv}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">`;
      }
    };
  }

  /* ── openUserProfile ── show custom name/avatar in profile modal */
  if (typeof openUserProfile === 'function') {
    const _orig = openUserProfile;
    openUserProfile = function() {
      _orig();   // let original populate the modal
      const customName = peGetCustomName();
      const customAv   = peGetCustomAvatar();
      if (customName) {
        const el = document.getElementById('profile-name');
        if (el) el.textContent = customName;
      }
      if (customAv) {
        const el = document.getElementById('profile-avatar');
        if (el) el.innerHTML = `<img src="${customAv}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid var(--gold);">`;
      }
    };
  }
}

/* ──────────────────────────────────────────────────────────────
   INIT
────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    injectEditProfileModal();
    _pePatchFirebaseFunctions();
    console.log('[ChessArena] Profile Editor v1.0 loaded ✓');
  }, 700);   // after firebase.js has defined its functions
});
