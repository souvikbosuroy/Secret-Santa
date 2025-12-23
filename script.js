/************************************
 * CONFIG – EDIT ONLY THIS SECTION
 ************************************/
const participants = [
  { name: "Sayak Manna", answer: "sayak2054" },
  { name: "Debjit Dey", answer: "debjit2055" },
  { name: "Sujay Biswas", answer: "sujay2057" },
  { name: "Anindya Mazumder", answer: "anindya2058" },
  { name: "Sayani Kundu", answer: "sayani2059" },
  { name: "Souvik Bosu Roy", answer: "souvik2060" },
];

/************************************
 * INTERNAL SETUP (DO NOT EDIT)
 ************************************/
const STORAGE_VERSION = "v2"; // bump this if logic ever changes
const PARTICIPANT_SIGNATURE = participants
  .map(p => p.name + ":" + p.answer)
  .join("|");

const STORAGE_KEY = "secretSantaData";

const defaultData = {
  version: STORAGE_VERSION,
  signature: PARTICIPANT_SIGNATURE,
  assignedTokens: {},
  sharedPool: participants.map(p => p.name)
};

/************************************
 * LOAD + AUTO SYNC STORAGE
 ************************************/
let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;

// If data is missing OR participants changed → reset safely
if (
  !data ||
  data.version !== STORAGE_VERSION ||
  data.signature !== PARTICIPANT_SIGNATURE
) {
  data = structuredClone(defaultData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/************************************
 * DOM ELEMENTS
 ************************************/
const secretInput = document.getElementById("secretAnswer");
const unlockBtn = document.getElementById("unlockBtn");
const loginMsg = document.getElementById("loginMsg");
const gameDiv = document.getElementById("game");
const rollBtn = document.getElementById("rollBtn");
const diceDiv = document.getElementById("dice");
const resultDiv = document.getElementById("result");
const assignedNameDiv = document.getElementById("assignedName");
const qrDiv = document.getElementById("qr");

let currentUser = null;
let userToken = null;

/************************************
 * UNLOCK USER
 ************************************/
unlockBtn.addEventListener("click", () => {
  const answer = secretInput.value.trim().toLowerCase();
  const user = participants.find(
    p => p.answer.toLowerCase() === answer
  );

  if (!user) {
    loginMsg.textContent = "Incorrect answer!";
    return;
  }

  currentUser = user.name;
  userToken = btoa(user.name + ":" + answer);
  loginMsg.textContent = "";

  if (data.assignedTokens[userToken]) {
    showResult(data.assignedTokens[userToken]);
  } else {
    gameDiv.style.display = "block";
  }
});

/************************************
 * ROLL DICE
 ************************************/
rollBtn.addEventListener("click", () => {
  const available = data.sharedPool.filter(
    name => name !== currentUser
  );

  if (!available.length) {
    alert("No one left to assign!");
    return;
  }

  let rolls = 0;
  const interval = setInterval(() => {
    diceDiv.textContent = "🎲".repeat(
      Math.floor(Math.random() * 6) + 1
    );

    rolls++;
    if (rolls > 10) {
      clearInterval(interval);

      const picked =
        available[Math.floor(Math.random() * available.length)];

      data.assignedTokens[userToken] = picked;
      data.sharedPool = data.sharedPool.filter(n => n !== picked);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      showResult(picked);
    }
  }, 100);
});

/************************************
 * SHOW RESULT (QR ONLY)
 ************************************/
function showResult(name) {
  gameDiv.style.display = "none";
  resultDiv.style.display = "block";

  assignedNameDiv.textContent =
    "Scan your QR code to see your assignment";

  qrDiv.innerHTML = "";
  const qr = new QRious({
    element: document.createElement("canvas"),
    value: name,
    size: 200
  });

  qrDiv.appendChild(qr.element);
}
