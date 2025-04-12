// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyA_x09ePbtXQ96lLvXzrLkGUb1U3klBfOM",
  authDomain: "loker-bc23d.firebaseapp.com",
  databaseURL: "https://loker-bc23d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "loker-bc23d",
  storageBucket: "loker-bc23d.appspot.com",
  messagingSenderId: "292212374092",
  appId: "1:292212374092:web:ed2111258acffc1c0752e9",
  measurementId: "G-QECZ68YHJN"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Toggle Form
const btnJobseeker = document.getElementById("btn-jobseeker");
const btnCompany = document.getElementById("btn-company");
const formJobseeker = document.getElementById("form-jobseeker");
const formCompany = document.getElementById("form-company");

btnJobseeker.addEventListener("click", () => {
  btnJobseeker.classList.add("active");
  btnCompany.classList.remove("active");
  formJobseeker.classList.add("active");
  formCompany.classList.remove("active");
});

btnCompany.addEventListener("click", () => {
  btnCompany.classList.add("active");
  btnJobseeker.classList.remove("active");
  formCompany.classList.add("active");
  formJobseeker.classList.remove("active");
});

// Register Jobseeker
formJobseeker.addEventListener("submit", (e) => {
  e.preventDefault();
  const nama = document.getElementById("nama-jobseeker").value;
  const email = document.getElementById("email-jobseeker").value;
  const password = document.getElementById("password-jobseeker").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const uid = userCredential.user.uid;
      return db.ref("users/jobseeker/" + uid).set({
        nama,
        email,
        role: "jobseeker"
      });
    })
    .then(() => {
      alert("Pendaftaran Jobseeker berhasil!");
      window.location.href = "login.html";
    })
    .catch((error) => {
      alert("Gagal daftar: " + error.message);
    });
});

// Register Company
formCompany.addEventListener("submit", (e) => {
  e.preventDefault();
  const nama = document.getElementById("nama-company").value;
  const email = document.getElementById("email-company").value;
  const password = document.getElementById("password-company").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const uid = userCredential.user.uid;
      return db.ref("users/perusahaan/" + uid).set({
        nama,
        email,
        role: "company"
      });
    })
    .then(() => {
      alert("Pendaftaran Perusahaan berhasil!");
      window.location.href = "login.html";
    })
    .catch((error) => {
      alert("Gagal daftar: " + error.message);
    });
});
