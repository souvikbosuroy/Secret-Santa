/*************************************************
 * CONFIG — EDIT ONLY THIS
 *************************************************/
const participants = [
  { name: "Sayak Maanna", answer: "manna1111" },
  { name: "Debjit Dey", answer: "dey1112" },
  { name: "Souvik Bosu Roy", answer: "bosu1113" },
  { name: "Anindya Mazumder", answer: "mazumder1114" },
].map(p => ({
  name: p.name,
  answer: p.answer.toLowerCase().trim()
}));

/*************************************************
 * STORAGE AUTO-SYNC LOGIC
 *************************************************/
const STORAGE_KEY = "secret_santa_secure";
const STORAGE_VERSION = "v5";

const SIGNATURE = participants
  .map(p => `${p.name}:${p.answer}`)
  .join("|");

const defaultState = {
  version: STORAGE_VERSION,
  signature: SIGNATURE,
  assignedTokens: {}, // token → { name, opened, device }
  pool: participants.map(p => p.name)
};

let state = JSON.parse(localStorage.getItem(STORAGE_KEY));

if (!state || state.version !== STORAGE_VERSION || state.signature !== SIGNATURE) {
  state = structuredClone(defaultState);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/*************************************************
 * DOM
 *************************************************/
const secretInput = document.getElementById("secretAnswer");
const unlockBtn = document.getElementById("unlockBtn");
const loginMsg = document.getElementById("loginMsg");
const gameDiv = document.getElementById("game");
const rollBtn = document.getElementById("rollBtn");
const diceDiv = document.getElementById("dice");
const resultDiv = document.getElementById("result");
const assignedNameDiv = document.getElementById("assignedName");
const qrDiv = document.getElementById("qr");
const overlay = document.getElementById("warningOverlay");

let currentUser = null;
let userToken = null;

/*************************************************
 * DEVICE + FINGERPRINT
 *************************************************/
function isPhone() {
  return (
    /android|iphone|ipod|windows phone/i.test(navigator.userAgent) &&
    navigator.maxTouchPoints > 0 &&
    window.innerWidth <= 768
  );
}

function getDeviceFingerprint() {
  return btoa(
    navigator.userAgent +
    "|" +
    screen.width +
    "x" +
    screen.height +
    "|" +
    navigator.maxTouchPoints
  );
}

/*************************************************
 * UNLOCK
 *************************************************/
unlockBtn.onclick = () => {
  const answer = secretInput.value.toLowerCase().trim();
  const user = participants.find(p => p.answer === answer);

  if (!user) {
    loginMsg.textContent = "Incorrect answer";
    return;
  }

  currentUser = user.name;
  userToken = btoa(user.name + ":" + answer);
  loginMsg.textContent = "";

  if (state.assignedTokens[userToken]) {
    showReveal(state.assignedTokens[userToken]);
  } else {
    gameDiv.style.display = "block";
  }
};

/*************************************************
 * ROLL
 *************************************************/
rollBtn.onclick = () => {
  const available = state.pool.filter(n => n !== currentUser);
  if (!available.length) {
    alert("No one left!");
    return;
  }

  let count = 0;
  const interval = setInterval(() => {
    diceDiv.textContent = "🎲".repeat(Math.floor(Math.random() * 6) + 1);
    if (++count > 10) {
      clearInterval(interval);

      const chosen = available[Math.floor(Math.random() * available.length)];
      state.assignedTokens[userToken] = {
        name: chosen,
        opened: false,
        device: null
      };

      state.pool = state.pool.filter(n => n !== chosen);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      showReveal(state.assignedTokens[userToken]);
    }
  }, 100);
};

/*************************************************
 * ANIMATED REVEAL
 *************************************************/
function showReveal(entry) {
  gameDiv.style.display = "none";
  resultDiv.style.display = "block";
  qrDiv.innerHTML = "";

  if (!isPhone()) {
    assignedNameDiv.innerHTML =
      "<b>🔒 Open this link on your phone</b>";
    return;
  }

  const fingerprint = getDeviceFingerprint();

  if (entry.opened && entry.device !== fingerprint) {
    assignedNameDiv.innerHTML =
      "<b>❌ This link was already opened on another device</b>";
    return;
  }

  if (!entry.device) {
    entry.device = fingerprint;
  }

  assignedNameDiv.innerHTML = "🎁 Opening your secret...";
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  setTimeout(() => {
    assignedNameDiv.innerHTML = `
      <div style="font-size:28px; animation: pop 0.6s ease">
        🎅 You got <b>${entry.name}</b>
      </div>
    `;

    entry.opened = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    generateQR();
  }, 2000);
}

/*************************************************
 * QR WITH LINK
 *************************************************/
function generateQR() {
  const revealUrl =
    window.location.origin +
    window.location.pathname +
    "?token=" +
    encodeURIComponent(userToken);

  const qr = new QRious({
    element: document.createElement("canvas"),
    value: revealUrl,
    size: 220
  });

  qrDiv.appendChild(qr.element);
  enableAntiScreenshot();
}

/*************************************************
 * AUTO OPEN FROM LINK
 *************************************************/
(function () {
  const token = new URLSearchParams(location.search).get("token");
  if (!token || !state.assignedTokens[token]) return;

  userToken = token;
  showReveal(state.assignedTokens[token]);
})();

/*************************************************
 * SCREENSHOT DETERRENCE
 *************************************************/
function enableAntiScreenshot() {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      qrDiv.classList.add("secure-blur");
      overlay.style.display = "flex";
    } else {
      qrDiv.classList.remove("secure-blur");
      overlay.style.display = "none";
    }
  });

  document.body.style.userSelect = "none";
}

/*************************************************
 * 🎄 FESTIVE EFFECTS
 *************************************************/
function startSnow() {
  for (let i = 0; i < 30; i++) {
    const snow = document.createElement("div");
    snow.className = "snow";
    snow.textContent = "❄";
    snow.style.left = Math.random() * 100 + "vw";
    snow.style.animationDuration = 5 + Math.random() * 5 + "s";
    snow.style.opacity = Math.random();
    document.body.appendChild(snow);

    setTimeout(() => snow.remove(), 10000);
  }
}

function confettiBurst() {
  for (let i = 0; i < 40; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.left = Math.random() * 100 + "vw";
    confetti.style.background =
      ["#ff0", "#f00", "#0f0", "#0ff", "#f0f"][Math.floor(Math.random() * 5)];
    confetti.style.animationDuration = 3 + Math.random() * 3 + "s";
    document.body.appendChild(confetti);

    setTimeout(() => confetti.remove(), 6000);
  }

  /*************************************************
 * LINK-BASED REVEAL (PHONE ONLY)
 *************************************************/
const params = new URLSearchParams(window.location.search);
const revealToken = params.get("reveal");

if (revealToken) {
  const saved = state.assignedTokens[revealToken];

  if (!saved) {
    document.body.innerHTML = "<h2>❌ Link expired or invalid</h2>";
  } else if (!isPhone()) {
    document.body.innerHTML = "<h2>📵 Open this link on your phone</h2>";
  } else {
    // ONE-TIME OPEN
    delete state.assignedTokens[revealToken];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    showResult(saved);
  }
}

}
