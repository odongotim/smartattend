const API_URL = "https://script.google.com/macros/s/AKfycbz_K4KR--0dgrY_BBSvjOuL5oIjcNMtiWgeZWwLzYMaYqdaGOfWpFB5dOUpeun3uSGIbQ/exec";

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