const userName = localStorage.getItem("name");
const regNo = localStorage.getItem("regNo");

if (userName && regNo) {
    document.getElementById("user").innerText = `Logged in as: ${userName} (${regNo})`;
}

function logout() {
    localStorage.clear();
    auth.signOut().then(() => {
        window.location.href = "login.html";
    });
}

let hasMarked = false; 

function markAttendance(qrData) {
  const user = firebase.auth().currentUser;

  if (!user) {
    alert("❌ You are not logged in. Please login again.");
    return;
  }

  // Create a unique ID for today (e.g., "Reg123_2026-02-26")
  const today = new Date().toISOString().split('T')[0]; 
  const docId = `${regNo}_${today}`; 

  const docRef = db.collection("attendance").doc(docId);

  // We use .set with { merge: true } to ensure we don't overwrite 
  // existing data if you decide to add more fields later.
  docRef.set({
    name: userName,               // From localStorage
    email: user.email,            // Fetched directly from Firebase Auth
    regNo: regNo,                 // From localStorage
    scanData: qrData || "No data",
    time: firebase.firestore.FieldValue.serverTimestamp(),
    date: today
  }, { merge: true })
  .then(() => {
    document.getElementById("result").innerText = "Attendance marked!";
    document.getElementById("result").style.color = "green";
    console.log("Data saved for:", user.email);
  })
  .catch(err => {
    console.error("Firebase Error:", err);
    // If you see 'permission denied' here, check the rules below
    alert("Error: " + err.message);
    hasMarked = false;
  });
}

function onScanSuccess(decodedText) {
    if (hasMarked) return;
    hasMarked = true;
    console.log("QR Scanned:", decodedText);
    markAttendance(decodedText);
}

// ---------------- Camera Controls ----------------
const html5QrCode = new Html5Qrcode("reader");
let cameras = [];
let currentCameraIndex = 0;
let isSwitching = false;

function startCamera(index) {
    if (!cameras || cameras.length === 0) return;
    const cameraId = cameras[index].id;

    html5QrCode.start(
        cameraId,
        { fps: 10, qrbox: 250 },
        onScanSuccess,
        errorMessage => { /* Scan noise */ }
    ).catch(err => console.error("Camera error:", err));
}

Html5Qrcode.getCameras().then(camList => {
    if (camList && camList.length) {
        cameras = camList;
        const backCam = camList.findIndex(c => c.label.toLowerCase().includes("back") || c.label.toLowerCase().includes("rear"));
        currentCameraIndex = backCam >= 0 ? backCam : 0;
        startCamera(currentCameraIndex);
    }
}).catch(err => console.error("Detection error:", err));

function switchCamera() {
    if (cameras.length < 2 || isSwitching) return;
    isSwitching = true;
    currentCameraIndex = (currentCameraIndex + 1) % cameras.length;

    html5QrCode.stop().then(() => startCamera(currentCameraIndex)).finally(() => { isSwitching = false; });
}