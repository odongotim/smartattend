document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("isAdminLoggedIn") !== "true") {
    window.location.href = "admin-login.html";
    return;
  }

  document.getElementById("dash-content").style.display = "block";
  loadUsers();
  loadAttendance();
});

function loadUsers() {
  getUsers().then(users => {
    let html = "";
    users.forEach(u => {
      html += `
        <tr>
          <td>${u.name}</td>
          <td>${u.regNo}</td>
          <td>${u.email}</td>
        </tr>`;
    });
    document.getElementById("userBody").innerHTML = html;
  });
}

function loadAttendance() {
  getAttendance().then(records => {
    let html = "";

    records.forEach(a => {
      html += `
        <tr>
          <td>${a.name}</td>     
          <td>${a.regNo}</td>
          <td>${a.email}</td>
          <td>${new Date(a.time).toLocaleString()}</td>
        </tr>
      `;
    });

    document.getElementById("attendanceBody").innerHTML = html;
  });
}

function logout() {
  localStorage.removeItem("isAdminLoggedIn");
  window.location.href = "admin-login.html";
}