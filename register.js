function register(){
  const name = document.getElementById("name").value;
  const reg = document.getElementById("reg").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if(!name || !reg || !email || !password){
    document.getElementById("msg").innerText = "All fields are required";
    return;
  }

  fetch("https://script.google.com/macros/s/AKfycbzk10M26SgP4PrnBrBnnjSPzqAuNxauuG0-zKhY5NecJJEkeQqi_mJhJ-bnn1-UGMnR4w/exec", {
    method: "POST",
    body: JSON.stringify({
      action: "register",
      name,
      reg,
      email,
      password
    })
  })
  .then(res => res.text())
  .then(response => {
    if(response === "success"){
      document.getElementById("msg").innerText = "Registration successful! Please login.";
      setTimeout(()=> window.location.href="login.html", 1500);
    } else {
      document.getElementById("msg").innerText = response;
    }
  });
}