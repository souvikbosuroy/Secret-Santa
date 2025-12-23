/*************************************************
 * CONFIG
 *************************************************/
const API_URL = "https://script.google.com/macros/s/AKfycbwd-HHZmIssn49E6oe3ALqU6GQwTZwBHAyXWR-Nz7E16GfdIrkiA8q2UccVp7wRtn8rdA/exec";

/*************************************************
 * GLOBALS
 *************************************************/
let users = [];
let currentUser = null;

/*************************************************
 * LOAD USERS FROM SHEET
 *************************************************/
async function loadUsers() {
  const res = await fetch(API_URL);
  users = await res.json();
}
loadUsers();

/*************************************************
 * DOM
 *************************************************/
const secretInput = document.getElementById("secretAnswer");
const unlockBtn = document.getElementById("unlockBtn");
const rollBtn = document.getElementById("rollBtn");
const loginMsg = document.getElementById("loginMsg");
const greeting = document.getElementById("greeting");
const resultDiv = document.getElementById("result");
const assignedNameDiv = document.getElementById("assignedName");

/*************************************************
 * LOGIN
 *************************************************/
unlockBtn.onclick = async () => {
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
  document.getElementById("game").style.display = "block";

  if (user.assigned_to) {
    document.getElementById("game").style.display = "none";
    showResult(user.assigned_to);
    rollBtn.disabled = true;
  }
};


/*************************************************
 * ASSIGN (GLOBAL LOCK)
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

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      giver: currentUser.name,
      receiver: chosen
    })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.error);
    location.reload(); // resync from sheet
    return;
  }

  showResult(data.assigned_to);
};

/*************************************************
 * RESULT
 *************************************************/
function showResult(name) {
  resultDiv.style.display = "block";
  assignedNameDiv.innerHTML = `
    🎁 You got <b>${name}</b>
  `;
}
