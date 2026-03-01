const API_URL = "https://script.google.com/macros/s/AKfycbzFm2EIRnXIp6tt9hI_W1Ns6APrmZfydE6NbzKlGntCFsgmEeKRIyIo2nV3frIEfDTy0g/exec";

async function apiRequest(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return response.json();
}

// Fix: Function name should match what's called in register.js
function registerStudent(userData) {
  return apiRequest({
    action: "register",
    ...userData
  });
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