document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("isAdminLoggedIn") !== "true") {
    location.href = "admin-login.html";
    return;
  }

  document.getElementById("dash-content").style.display = "block";
  loadUsers();
  loadAttendance();
});

// USERS
async function loadUsers() {
  const users = await getUsers();
  document.getElementById("userBody").innerHTML = users.map(u => `
    <tr>
      <td>${u.name}</td>
      <td>${u.regNo}</td>
      <td>${u.email}</td>
    </tr>
  `).join("");
}

// ATTENDANCE
async function loadAttendance() {
  const records = await getAttendance();
  document.getElementById("attendanceBody").innerHTML = records.map(a => `
    <tr>
      <td>${a.name}</td>
      <td>${a.regNo}</td>
      <td>${a.email}</td>
      <td>${new Date(a.time).toLocaleString()}</td>
    </tr>
  `).join("");
}

function logout() {
  localStorage.removeItem("isAdminLoggedIn");
  location.href = "admin-login.html";
}