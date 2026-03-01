function onScanSuccess(decodedText) {
  if (hasMarked) return;

  const [session, ts, qLat, qLng, expiry] = decodedText.split("|");

  if (Date.now() - ts > expiry * 60000) {
    updateStatus("QR expired", "#ff4d4d");
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    if (pos.coords.accuracy > 50) {
      updateStatus("Weak GPS signal", "#ff4d4d");
      return;
    }

    const dist = getDistance(
      pos.coords.latitude,
      pos.coords.longitude,
      qLat,
      qLng
    );

    if (dist > 50) {
      updateStatus(`Too far (${Math.round(dist)}m)`, "#ff4d4d");
      return;
    }

    submitAttendance(session);
  });
}

function submitAttendance(session) {
  const data = {
    name: localStorage.getItem("userName"),
    regNo: localStorage.getItem("userRegNo"),
    email: localStorage.getItem("userEmail"),
    session
  };

  markAttendance(data).then(r => {
    if (r.success) {
      hasMarked = true;
      updateStatus("Attendance marked ✔", "#00ff88");
    } else {
      updateStatus(r.message, "#ffcc00");
    }
  });
}