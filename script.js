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
 * INIT
 *************************************************/
unlockBtn.disabled = true;
gameDiv.style.display = "none";
resultDiv.style.display = "none";

/*************************************************
 * LOAD USERS
 *************************************************/
async function loadUsers() {
  const res = await fetch(API_URL);
  users = await res.json();
  unlockBtn.disabled = false;
}
loadUsers();

/*************************************************
 * LOGIN
 *************************************************/
unlockBtn.onclick = () => {
  const answer = secretInput.value.toLowerCase().trim();
  const user = users.find(u => u.answer === answer);

  if (!user) {
    loginMsg.textContent = "❌ Wrong answer";
    return;
  }

  currentUser = user;
  greeting.textContent = `Hi, ${user.name} 👋`;
  loginMsg.textContent = "";

  if (user.assigned_to) {
    showResult(user.assigned_to);
    return;
  }

  gameDiv.style.display = "block";
};

/*************************************************
 * ASSIGN (GET-BASED, CORS-SAFE)
 *************************************************/
rollBtn.onclick = async () => {
  rollBtn.disabled = true;

  const available = users
    .filter(u => !u.assigned_to && u.name !== currentUser.name)
    .map(u => u.name);

  const chosen =
    available[Math.floor(Math.random() * available.length)];

  const url =
    `${API_URL}?action=assign` +
    `&giver=${encodeURIComponent(currentUser.name)}` +
    `&receiver=${encodeURIComponent(chosen)}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.success) {
    alert(data.error);
    location.reload();
    return;
  }

  showResult(data.assigned_to);
};

/*************************************************
 * RESULT
 *************************************************/
function showResult(name) {
  gameDiv.style.display = "none";
  resultDiv.style.display = "block";
  assignedNameDiv.innerHTML = `🎁 You got <b>${name}</b>`;
}
