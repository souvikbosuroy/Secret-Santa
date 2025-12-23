/*************************************************
 * CONFIG
 *************************************************/
const API_URL =
  "https://script.google.com/macros/s/AKfycbwd-HHZmIssn49E6oe3ALqU6GQwTZwBHAyXWR-Nz7E16GfdIrkiA8q2UccVp7wRtn8rdA/exec";

/*************************************************
 * GLOBALS
 *************************************************/
let users = [];
let currentUser = null;

/*************************************************
 * DOM
 *************************************************/
const secretInput = document.getElementById("secretAnswer");
const unlockBtn = document.getElementById("unlockBtn");
const rollBtn = document.getElementById("rollBtn");
const loginMsg = document.getElementById("loginMsg");
const greeting = document.getElementById("greeting");
const gameDiv = document.getElementById("game");
const resultDiv = document.getElementById("result");
const assignedNameDiv = document.getElementById("assignedName");

/*************************************************
 * INITIAL STATE
 *************************************************/
unlockBtn.disabled = true;
gameDiv.style.display = "none";
resultDiv.style.display = "none";

/*************************************************
 * LOAD USERS FROM GOOGLE SHEET
 *************************************************/
async function loadUsers() {
  try {
    const res = await fetch(API_URL);
    users = await res.json();
    unlockBtn.disabled = false;
  } catch (e) {
    loginMsg.textContent = "❌ Failed to load data";
  }
}
loadUsers();

/*************************************************
 * LOGIN
 *************************************************/
unlockBtn.onclick = () => {
  if (!users.length) {
    loginMsg.textContent = "⏳ Loading… please wait";
    return;
  }

  const answer = secretInput.value.toLowerCase().trim();
  const user = users.find(u => u.answer === answer);

  if (!user) {
    loginMsg.textContent = "❌ Wrong answer";
    return;
  }

  currentUser = user;
  greeting.textContent = `Hi, ${user.name} 👋`;
  loginMsg.textContent = "";

  // SHOW GAME
  gameDiv.style.display = "block";

  // If already assigned, show result directly
  if (user.assigned_to) {
    gameDiv.style.display = "none";
    showResult(user.assigned_to);
    rollBtn.disabled = true;
  }
};

/*************************************************
 * ASSIGN (GLOBAL LOCK VIA SHEET)
 *************************************************/
rollBtn.onclick = async () => {
  rollBtn.disabled = true;

  const available = users
    .filter(
      u =>
        !u.assigned_to &&
        u.name !== currentUser.name
    )
    .map(u => u.name);

  if (!available.length) {
    alert("❌ No valid names left");
    return;
  }

  const chosen =
    available[Math.floor(Math.random() * available.length)];

  // ✅ USE FORMDATA (NO HEADERS, NO JSON)
  const formData = new FormData();
  formData.append("giver", currentUser.name);
  formData.append("receiver", chosen);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.error || "Assignment failed");
      location.reload(); // resync with sheet
      return;
    }

    showResult(data.assigned_to);
  } catch (e) {
    alert("❌ Network error");
    location.reload();
  }
};

/*************************************************
 * RESULT
 *************************************************/
function showResult(name) {
  gameDiv.style.display = "none";
  resultDiv.style.display = "block";

  assignedNameDiv.innerHTML = `
    🎁 You got <b>${name}</b>
  `;
}
