// Firebase Init
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

const logoutBtn = document.getElementById("logout-btn");
const jobForm = document.getElementById("job-form");
const jobsList = document.getElementById("jobs-list");
const companyNameEl = document.getElementById("company-name");

let currentUser;

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    currentUser = user;
    companyNameEl.innerText = user.email;
    loadJobs(user.uid);
  }
});

logoutBtn.addEventListener("click", () => {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
});

jobForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("job-title").value.trim();
  const location = document.getElementById("job-location").value.trim();
  const description = document.getElementById("job-description").value.trim();
  const salary = document.getElementById("job-salary").value.trim() || "Not Specified"; // Default jika tidak diisi
  const jobType = document.getElementById("job-type").value.trim();

  if (!title || !location || !description) {
    alert("Semua field harus diisi!");
    return;
  }

  const jobId = jobForm.getAttribute("data-edit-id");
  const jobRef = jobId
    ? db.ref(`users/perusahaan/${currentUser.uid}/lowongan/${jobId}`)
    : db.ref(`users/perusahaan/${currentUser.uid}/lowongan`).push();

  const newJobId = jobRef.key;

  const jobData = {
    title,
    location,
    description,
    salary,
    jobType,
    postedAt: new Date().toISOString(),
    jobId: newJobId,
  };

  jobRef.set(jobData)
    .then(() => {
      alert(jobId ? "Lowongan berhasil diperbarui!" : "Lowongan berhasil ditambahkan!");
      jobForm.reset();
      jobForm.removeAttribute("data-edit-id");
      loadJobs(currentUser.uid);
    })
    .catch((error) => {
      console.error("Gagal menyimpan lowongan:", error);
      alert("Terjadi kesalahan. Coba lagi nanti.");
    });
});

function loadJobs(uid) {
  jobsList.innerHTML = "<p>Memuat data...</p>";

  db.ref(`users/perusahaan/${uid}/lowongan`).once("value", (snapshot) => {
    jobsList.innerHTML = "";
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const job = child.val();
        const jobId = job.jobId || child.key;

        const jobCard = document.createElement("div");
        jobCard.className = "job-card";
        jobCard.innerHTML = `
          <h4>${job.title}</h4>
          <p><strong>Lokasi:</strong> ${job.location}</p>
          <p><strong>Gaji:</strong> ${job.salary}</p>
          <p><strong>Tipe:</strong> ${job.jobType}</p>
          <p>${job.description}</p>
          <small>Diposting pada: ${new Date(job.postedAt).toLocaleString()}</small>
          <div style="margin-top: 10px;">
            <button class="edit-btn" data-id="${jobId}" style="margin-right: 5px;">Edit</button>
            <button class="delete-btn" data-id="${jobId}" style="background-color: red; color: white;">Hapus</button>
          </div>
          <h5>Pelamar:</h5>
          <ul class="applicants-list" id="applicants-${jobId}"><li>Memuat...</li></ul>
        `;

        jobsList.appendChild(jobCard);
        loadApplicants(jobId);
      });

      // Tambah event listener setelah semua job dimuat
      document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const jobId = btn.getAttribute("data-id");
          db.ref(`users/perusahaan/${uid}/lowongan/${jobId}`).once("value", (snapshot) => {
            const job = snapshot.val();
            document.getElementById("job-title").value = job.title;
            document.getElementById("job-location").value = job.location;
            document.getElementById("job-description").value = job.description;
            document.getElementById("job-salary").value = job.salary;
            document.getElementById("job-type").value = job.jobType;
            jobForm.setAttribute("data-edit-id", jobId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        });
      });

      document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const jobId = btn.getAttribute("data-id");
          if (confirm("Yakin ingin menghapus lowongan ini?")) {
            db.ref(`users/perusahaan/${uid}/lowongan/${jobId}`).remove()
              .then(() => {
                alert("Lowongan berhasil dihapus!");
                loadJobs(uid);
              })
              .catch((error) => {
                console.error("Gagal menghapus lowongan:", error);
                alert("Terjadi kesalahan saat menghapus lowongan.");
              });
          }
        });
      });
    } else {
      jobsList.innerHTML = "<p>Belum ada lowongan yang diposting.</p>";
    }
  });
}

function loadApplicants(jobId) {
  const applicantsList = document.getElementById(`applicants-${jobId}`);
  applicantsList.innerHTML = "<li>Memuat...</li>";

  db.ref("lamaran").once("value", (snapshot) => {
    applicantsList.innerHTML = "";
    let found = false;

    snapshot.forEach((lamaranSnap) => {
      const lamaranKey = lamaranSnap.key;
      const pelamarObj = lamaranSnap.val();

      if (lamaranKey === jobId) {
        Object.values(pelamarObj).forEach((data) => {
          const linkCV = data.link_cv || data.cvLink || "#";
          const li = document.createElement("li");
          li.innerHTML = `
            <strong>${data.nama}</strong> (${data.email}) - 
            <a href="${linkCV}" target="_blank">Lihat CV</a>
          `;
          applicantsList.appendChild(li);
          found = true;
        });
      } else {
        Object.values(pelamarObj).forEach((data) => {
          if (data.jobId === jobId || data.lowongan === jobId) {
            const linkCV = data.link_cv || data.cvLink || "#";
            const li = document.createElement("li");
            li.innerHTML = `
              <strong>${data.nama}</strong> (${data.email}) - 
              <a href="${linkCV}" target="_blank">Lihat CV</a>
            `;
            applicantsList.appendChild(li);
            found = true;
          }
        });
      }
    });

    if (!found) {
      applicantsList.innerHTML = "<li>Belum ada pelamar</li>";
    }
  });
}
