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

async function markAttendance(qrData) {
  const user = firebase.auth().currentUser;

  if (!user) {
    alert("❌ You are not logged in. Please login again.");
    return;
  }

  try {
    // 1. Fetch official registration data from the 'users' collection
    const userDoc = await db.collection("users").doc(user.uid).get();

    if (!userDoc.exists) {
      alert("❌ Registration data not found. Please contact admin.");
      return;
    }

    const userData = userDoc.data();
    
    // 2. Prepare Unique ID for today to prevent duplicates
    const today = new Date().toISOString().split('T')[0]; 
    const docId = `${userData.regNo}_${today}`; 
    const docRef = db.collection("attendance").doc(docId);

    // 3. Save official details to the attendance sheet
    await docRef.set({
      name: userData.name,          // Actual name from registration
      email: userData.email,        // Actual email from registration
      regNo: userData.regNo,        // Actual registration number
      scanData: qrData || "No data",
      time: firebase.firestore.FieldValue.serverTimestamp(),
      date: today,
      uid: user.uid
    }, { merge: true });

    document.getElementById("result").innerText = "Attendance marked successfully!";
    document.getElementById("result").style.color = "green";

  } catch (err) {
    console.error("Error marking attendance:", err);
    alert("❌ Error: " + err.message);
    hasMarked = false;
  }
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