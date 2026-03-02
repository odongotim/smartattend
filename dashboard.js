document.addEventListener("DOMContentLoaded", async () => {
  // ===== ADMIN CHECK =====
  if (localStorage.getItem("isAdminLoggedIn") !== "true") {
    location.href = "admin-login.html";
    return;
  }

  const dash = document.getElementById("dash-content");
  if (dash) dash.style.display = "block";

  try {
    await loadUsers();
    await loadAttendance();
  } catch (err) {
    console.error("Dashboard Load Error:", err);
  }
});


/* =========================
   LOAD USERS
========================= */
async function loadUsers() {
  try {
    const users = await getUsers();

    if (!users || users.length === 0) {
      document.getElementById("userBody").innerHTML =
        `<tr><td colspan="3">No registered users</td></tr>`;
      return;
    }

    document.getElementById("userBody").innerHTML =
      users.map(u => `
        <tr>
          <td>${u.name || "-"}</td>
          <td>${u.regNo || "-"}</td>
          <td>${u.email || "-"}</td>
        </tr>
      `).join("");

  } catch (error) {
    console.error("Users fetch failed:", error);
    document.getElementById("userBody").innerHTML =
      `<tr><td colspan="3">Failed to load users</td></tr>`;
  }
}


/* =========================
   LOAD ATTENDANCE
========================= */
async function loadAttendance() {
  try {
    const records = await getAttendance();

    if (!records || records.length === 0) {
      document.getElementById("attendanceBody").innerHTML =
        `<tr><td colspan="4">No attendance records</td></tr>`;
      return;
    }

    document.getElementById("attendanceBody").innerHTML =
      records.map(a => `
        <tr>
          <td>${a.name || "-"}</td>
          <td>${a.regNo || "-"}</td>
          <td>${a.email || "-"}</td>
          <td>${a.time ? new Date(a.time).toLocaleString() : "-"}</td>
        </tr>
      `).join("");

  } catch (error) {
    console.error("Attendance fetch failed:", error);
    document.getElementById("attendanceBody").innerHTML =
      `<tr><td colspan="4">Failed to load attendance</td></tr>`;
  }
}


/* =========================
   LOGOUT
========================= */
function logout() {
  localStorage.removeItem("isAdminLoggedIn");
  location.href = "admin-login.html";
}