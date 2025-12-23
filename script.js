/*************************************************
 * CONFIG
 *************************************************/
const SHEET_API =
  "https://script.google.com/macros/s/AKfycbwd-HHZmIssn49E6oe3ALqU6GQwTZwBHAyXWR-Nz7E16GfdIrkiA8q2UccVp7wRtn8rdA/exec";

const STORAGE_KEY = "secret_santa_secure";
const STORAGE_VERSION = "v6";

/*************************************************
 * GLOBALS
 *************************************************/
let participants = [];
let state = null;
let currentUser = null;
let userToken = null;

/*************************************************
 * LOAD PARTICIPANTS FROM SHEET
 *************************************************/
async function loadParticipants() {
  const res = await fetch(SHEET_API);
  participants = await res.json();

  initStorage();
}

loadParticipants();

/*************************************************
 * STORAGE
 *************************************************/
function initStorage() {
  const SIGNATURE = participants
    .map(p => `${p.name}:${p.answer}`)
    .join("|");

  const defaultState = {
    version: STORAGE_VERSION,
    signature: SIGNATURE,
    assignedTokens: {},
    pool: participants.map(p => p.name)
  };

  state = JSON.parse(localStorage.getItem(STORAGE_KEY));

  if (!state || state.signature !== SIGNATURE) {
    state = structuredClone(defaultState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
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
const overlay = document.getElementById("warningOverlay");

/*************************************************
 * DEVICE CHECK
 *************************************************/
function isPhone() {
  return (
    /android|iphone|ipod|windows phone/i.test(navigator.userAgent) &&
    navigator.maxTouchPoints > 0 &&
    window.innerWidth <= 768
  );
}

function fingerprint() {
  return btoa(
    navigator.userAgent +
    "|" +
    screen.width +
    "x" +
    screen.height
  );
}

/*************************************************
 * LOGIN
 *************************************************/
unlockBtn.onclick = () => {
  const answer = secretInput.value.toLowerCase().trim();
  const user = participants.find(p => p.answer === answer);

  if (!user) {
    loginMsg.textContent = "❌ Wrong answer";
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

      const chosen =
        available[Math.floor(Math.random() * available.length)];

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
 * REVEAL
 *************************************************/
function showReveal(entry) {
  gameDiv.style.display = "none";
  resultDiv.style.display = "block";

  if (!isPhone()) {
    assignedNameDiv.innerHTML =
      "<b>📵 Open this on your phone</b>";
    return;
  }

  const fp = fingerprint();

  if (entry.opened && entry.device !== fp) {
    assignedNameDiv.innerHTML =
      "<b>❌ Already opened on another device</b>";
    return;
  }

  if (!entry.device) entry.device = fp;

  assignedNameDiv.innerHTML = "🎁 Opening...";

  setTimeout(() => {
    assignedNameDiv.innerHTML = `
      <div style="font-size:28px">
        🎅 You got <b>${entry.name}</b>
      </div>
    `;

    entry.opened = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, 1500);
}

/*************************************************
 * AUTO OPEN VIA LINK
 *************************************************/
(function () {
  const token = new URLSearchParams(location.search).get("token");
  if (!token || !state?.assignedTokens[token]) return;

  userToken = token;
  showReveal(state.assignedTokens[token]);
})();
