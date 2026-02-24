function login(){
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if(!email || !password){
    document.getElementById("msg").innerText = "Enter email and password";
    return;
  }

  fetch("https://script.google.com/macros/s/AKfycbzk10M26SgP4PrnBrBnnjSPzqAuNxauuG0-zKhY5NecJJEkeQqi_mJhJ-bnn1-UGMnR4w/exec", {
    method: "POST",
    body: JSON.stringify({
      action: "login",
      email,
      password
    })
  })
  .then(res => res.json())
  .then(data => {
    if(data.status === "success"){
      localStorage.setItem("attendanceUser", JSON.stringify(data.user));
      window.location.href = "scan.html";
    } else {
      document.getElementById("msg").innerText = "Invalid login details";
    }
  });
}