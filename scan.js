// ---------------- USER INFO ----------------
const userName = localStorage.getItem("name");
const regNo = localStorage.getItem("regNo");

document.getElementById("user").innerText =
  `Logged in as: ${userName} (${regNo})`;

let hasMarked = false;

// ---------------- ATTENDANCE ----------------
function markAttendance() {
  const user = firebase.auth().currentUser;

  if (!user) {
    alert("❌ Session expired. Login again.");
    window.location.href = "login.html";
    return;
  }

  if (hasMarked) return;
  hasMarked = true;

  const now = new Date();
  const date = now.toISOString().split("T")[0];

  db.collection("attendance").add({
    uid: user.uid,
    name: userName,
    regNo: regNo,
    date: date,
    time: now
  })
  .then(() => {
    document.getElementById("result").innerText = "✅ Attendance marked";
    console.log("Attendance saved");
    setTimeout(() => hasMarked = false, 3000);
  })
  .catch(err => {
    console.error("Firestore error:", err);
    alert("❌ Attendance NOT saved");
    hasMarked = false;
  });
}

function onScanSuccess(decodedText) {
  console.log("QR scanned:", decodedText);
  markAttendance();
}

// ---------------- QR SCANNER ----------------
const html5QrCode = new Html5Qrcode("reader");
let cameras = [];
let currentCameraIndex = 0;

function startCamera(index) {
  const cameraId = cameras[index].id;

  html5QrCode.stop().catch(() => {})
  .finally(() => {
    html5QrCode.start(
      cameraId,
      {
        fps: 10,
        qrbox: 280
      },
      onScanSuccess
    ).catch(err => console.error("Camera error:", err));
  });
}

Html5Qrcode.getCameras().then(camList => {
  cameras = camList;
  const backCam = camList.findIndex(c =>
    c.label.toLowerCase().includes("back")
  );
  currentCameraIndex = backCam >= 0 ? backCam : 0;
  startCamera(currentCameraIndex);
});

// ---------------- SWITCH CAMERA ----------------
function switchCamera() {
  if (cameras.length < 2) return;
  currentCameraIndex = (currentCameraIndex + 1) % cameras.length;
  startCamera(currentCameraIndex);
}