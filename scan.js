const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby7lDB1nEMEbSrmx45oHZTpiI-cGr9FBGGANfSnt3bllYWtGaPAsQzCmfdJnqtb-Nj8/exec";

let scanner;
let scanned = false;

function logout(){
  localStorage.removeItem("isUserLoggedIn");
  location.href = "login.html";
}

window.onload = () => {
  if (localStorage.getItem("isUserLoggedIn") !== "true") {
    location.href = "login.html";
    return;
  }

  scanner = new Html5Qrcode("reader");

  scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    async (text) => {
      if (scanned) return;
      scanned = true;

      result.innerText = text;
      await scanner.stop();

      fetch(WEB_APP_URL, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          action: "scan",
          qrData: text
        })
      })
      .then(() => alert("Attendance recorded ✅"))
      .catch(() => alert("Error ❌"));
    }
  );
};