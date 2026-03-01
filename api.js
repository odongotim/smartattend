const API_URL = "https://script.google.com/macros/s/AKfycbwLVqhFMRQT0LHup3ilj_PLa_pFC_a9E5RtkZcXlVDFz2-uRnrxw1KN9XuBZmWuaa0d_g/exec";

async function apiRequest(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return response.json();
}

// Fix: Function name should match what's called in register.js
function registerStudent(userData) {
  return fetch(API_URL, {
    method: "POST",
    // We explicitly set the action to "register" to match the backend if block
    body: JSON.stringify({
      action: "register", 
      name: userData.name,
      regNo: userData.regNo,
      email: userData.email,
      password: userData.password
    })
  }).then(res => res.json());
}

function markAttendance(attendanceData) {
  return apiRequest({
    action: "attendance",
    ...attendanceData
  });
}

async function getUsers() {
  const res = await fetch(`${API_URL}?type=users`);
  const result = await res.json();
  // We wrap it to match your login.js expectation: res.users
  return { success: result.success, users: result.data };
}