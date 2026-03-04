// Google Apps Script Web App URL (doPost/doGet)
// NOTE: Replace with YOUR deployed Web App URL if you re-deploy.
const API_URL = "https://script.google.com/macros/s/AKfycbxH14xU6XygPF62VB_LlAXDKuPcxT7fAMPyCXX5Ld9cqsiXavwEfAsB6qC7w3L-BFrgcQ/exec";

// expose for other scripts
window.API_URL = API_URL;

// ---------- USERS ----------
async function registerStudent(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "register",
      ...data
    })
  });
  return res.json();
}

async function getUsers() {
  const res = await fetch(`${API_URL}?type=users`);
  const data = await res.json();
  return data.data || [];
}

// ---------- ATTENDANCE ----------
async function markAttendance(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "attendance",
      ...data
    })
  });
  return res.json();
}

async function getAttendance() {
  const res = await fetch(`${API_URL}?type=attendance`);
  const data = await res.json();
  return data.data || [];
}