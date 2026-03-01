const API_URL = "https://script.google.com/macros/s/AKfycbx6ruL3dqMOHz4omCBwZT6GSna-4Gjoa-vNrpsP5ilkLzeD8TAbwNpNRNYU8IE8p1oquA/exec";

// REGISTER USER
function registerUser(name, regNo, email) {
  return fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "register",
      name,
      regNo,
      email
    })
  }).then(res => res.json());
}

// MARK ATTENDANCE
function markAttendance(name, regNo, email, session) {
  return fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "attendance",
      name,
      regNo,
      email,
      session
    })
  }).then(res => res.json());
}

// GET USERS
function getUsers() {
  return fetch(`${API_URL}?type=users`).then(r => r.json());
}

// GET ATTENDANCE
function getAttendance() {
  return fetch(`${API_URL}?type=attendance`).then(r => r.json());
}