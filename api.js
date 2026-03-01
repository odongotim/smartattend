const API_URL = "https://script.google.com/macros/s/AKfycbwLVqhFMRQT0LHup3ilj_PLa_pFC_a9E5RtkZcXlVDFz2-uRnrxw1KN9XuBZmWuaa0d_g/exec";

// ---------- USERS ----------
async function registerStudent(data) {
  const res = await fetch(API_URL, {
    method: "POST",
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