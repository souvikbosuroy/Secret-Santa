/*************************************************
 * CONFIG — EDIT ONLY THIS
 *************************************************/
const participants = [
  { name: "Sayak Maanna",   answer: "manna1111" },
  { name: "Debjit Dey",  answer: "dey1112" },
  { name: "Souvik Bosu Roy", answer: "Bosu1113" },
  { name: "Anindya Mazumder",   answer: "Mazumder1114" },
].map(p => ({
  name: p.name,
  answer: p.answer.toLowerCase().trim()
}));

/*************************************************
 * STORAGE AUTO-SYNC LOGIC (DO NOT TOUCH)
 *************************************************/
const STORAGE_KEY = "secret_santa_secure";
const STORAGE_VERSION = "v3";

// signature changes whenever code data changes
const SIGNATURE = participants
  .map(p => `${p.name}:${p.answer}`)
  .join("|");

const defaultState = {
  version: STORAGE_VERSION,
  signature: SIGNATURE,
  assignedTokens: {},
  pool: participants.map(p => p.name)
};

let state = JSON.parse(localStorage.getItem(STORAGE_KEY));

if (
  !state ||
  state.version !== STORAGE_VERSION ||
  state.signature !== SIGNATURE
) {
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
 * DEVICE CHECK
 *************************************************/
function isPhone() {
  return (
    /android|iphone|ipod|windows phone/i.test(navigator.userAgent) &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0) &&
    window.innerWidth <= 768
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
    showResult(state.assignedTokens[userToken]);
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
    diceDiv.textContent = "🎲".repeat(Math.random() * 6 + 1);
    count++;

    if (count > 10) {
      clearInterval(interval);
      const chosen = available[Math.floor(Math.random() * available.length)];

      state.assignedTokens[userToken] = chosen;
      state.pool = state.pool.filter(n => n !== chosen);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

      showResult(chosen);
    }
  }, 100);
};

/*************************************************
 * RESULT + PHONE ONLY + SCREENSHOT DETERRENCE
 *************************************************/
function showResult(name) {
  gameDiv.style.display = "none";
  resultDiv.style.display = "block";
  qrDiv.innerHTML = "";

  if (!isPhone()) {
    assignedNameDiv.innerHTML =
      "<b>🔒 Open this link on your phone to reveal your secret</b>";
    return;
  }

  assignedNameDiv.textContent =
    "This QR is protected. Screenshots discouraged.";

  const qr = new QRious({
    element: document.createElement("canvas"),
    value: name,
    size: 220
  });

  qrDiv.appendChild(qr.element);
  enableAntiScreenshot();
}

/*************************************************
 * ANDROID SCREENSHOT DETECTION (BEST POSSIBLE)
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
  document.body.style.webkitUserSelect = "none";
}
