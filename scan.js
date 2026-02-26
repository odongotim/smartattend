// Firebase already initialized in scan.html
// User info
const userName = localStorage.getItem("name");
const regNo = localStorage.getItem("regNo");

// Display user info
document.getElementById("user").innerText = `Logged in as: ${userName} (${regNo})`;

// Logout function
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// Mark attendance function
function markAttendance() {
  db.collection("attendance").add({
    name: userName,
    regNo: regNo,
    time: new Date()
  })
  .then(() => alert("Attendance marked!"))
  .catch(err => console.error(err));
}

// QR scanning (Html5Qrcode) - camera only
function onScanSuccess(decodedText, decodedResult) {
  document.getElementById("result").innerText = decodedText;

  // Automatically mark attendance
  markAttendance();
}

// Initialize QR scanner (camera only)
const html5QrCode = new Html5Qrcode("reader");

// Only start camera scanning, disable image file scanning
Html5Qrcode.getCameras().then(cameras => {
  if (cameras && cameras.length) {
    const cameraId = cameras[0].id; // default to first camera
    html5QrCode.start(
      cameraId,
      { fps: 10, qrbox: 250 },
      onScanSuccess,
      errorMessage => {
        console.warn("QR scan error:", errorMessage);
      }
    ).catch(err => {
      console.error("Unable to start camera:", err);
      alert("Camera not accessible. Make sure you allow camera permission.");
    });
  } else {
    alert("No camera found on this device.");
  }
}).catch(err => {
  console.error("Error getting cameras:", err);
});