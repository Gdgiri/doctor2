// Audio Recorder
let mediaRecorder;
let recordedChunks = [];

navigator.mediaDevices
  .getUserMedia({ audio: true })
  .then(function (stream) {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = function (event) {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    mediaRecorder.onstop = function () {
      let recordedBlob = new Blob(recordedChunks, { type: "audio/wav" });
      let reader = new FileReader();
      reader.readAsDataURL(recordedBlob);
      reader.onloadend = function () {
        let base64data = reader.result;
        saveRecording(base64data);
        displayRecordings();
      };
      document.getElementById("recordingStatus").textContent =
        "Recording stopped.";
      document.getElementById("startRecording").disabled = false;
      document.getElementById("stopRecording").disabled = true;
    };
    document
      .getElementById("startRecording")
      .addEventListener("click", function () {
        recordedChunks = [];
        mediaRecorder.start();
        document.getElementById("recordingStatus").textContent = "Recording...";
        document.getElementById("startRecording").disabled = true;
        document.getElementById("stopRecording").disabled = false;
      });
    document
      .getElementById("stopRecording")
      .addEventListener("click", function () {
        mediaRecorder.stop();
      });
    displayRecordings();
  })
  .catch(function (err) {
    console.error("Error accessing microphone: ", err);
  });

function saveRecording(base64data) {
  let recordings = JSON.parse(localStorage.getItem("recordings")) || [];
  recordings.push(base64data);
  localStorage.setItem("recordings", JSON.stringify(recordings));
}

function displayRecordings() {
  let recordings = JSON.parse(localStorage.getItem("recordings")) || [];
  let savedRecordingsDiv = document.getElementById("savedRecordings");
  savedRecordingsDiv.innerHTML = "";
  recordings.forEach((recording, index) => {
    let audioElement = new Audio();
    audioElement.src = recording;
    let recordingDiv = document.createElement("div");
    let playButton = document.createElement("button");
    playButton.textContent = "Play";
    playButton.classList = "btn btn-success";
    playButton.addEventListener("click", function () {
      audioElement.play();
      playButton.style.display = "none";
      stopButton.style.display = "inline";
    });
    let stopButton = document.createElement("button");
    stopButton.textContent = "Stop";
    stopButton.style.display = "none";
    stopButton.classList = "btn btn-danger";
    stopButton.addEventListener("click", function () {
      audioElement.pause();
      audioElement.currentTime = 0;
      playButton.style.display = "inline";
      stopButton.style.display = "none";
    });
    audioElement.addEventListener("ended", function () {
      playButton.style.display = "inline";
      stopButton.style.display = "none";
    });
    let deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList = "btn btn-warning";
    deleteButton.addEventListener("click", function () {
      deleteRecording(index);
    });
    let progressBar = document.createElement("input");
    progressBar.type = "range";
    progressBar.min = 0;
    progressBar.max = 100;
    progressBar.value = 0;
    audioElement.addEventListener("timeupdate", function () {
      let progress = (audioElement.currentTime / audioElement.duration) * 100;
      progressBar.value = progress;
    });
    progressBar.addEventListener("input", function () {
      let seekTime = (progressBar.value / 100) * audioElement.duration;
      audioElement.currentTime = seekTime;
    });
    recordingDiv.appendChild(playButton);
    recordingDiv.appendChild(stopButton);
    recordingDiv.appendChild(progressBar);
    recordingDiv.appendChild(deleteButton);
    savedRecordingsDiv.appendChild(recordingDiv);
  });
}

function deleteRecording(index) {
  let recordings = JSON.parse(localStorage.getItem("recordings")) || [];
  recordings.splice(index, 1);
  localStorage.setItem("recordings", JSON.stringify(recordings));
  displayRecordings();
}

// Camera Capture
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureButton = document.getElementById("capture");
const capturedImage = document.getElementById("capturedImage");
const context = canvas.getContext("2d");

navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((error) => {
    console.error("Error accessing the camera", error);
  });

const savedImage = localStorage.getItem("capturedImage");
if (savedImage) {
  capturedImage.src = savedImage;
}

captureButton.addEventListener("click", () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageDataURL = canvas.toDataURL("image/png");
  capturedImage.src = imageDataURL;
  localStorage.setItem("capturedImage", imageDataURL);
});

// Token generator
class SequenceTokenGenerator {
  constructor() {
    const savedCounter = localStorage.getItem("tokenCounter");
    this.counter = savedCounter ? parseInt(savedCounter, 10) : 0;
  }

  generateToken() {
    this.counter++;
    localStorage.setItem("tokenCounter", this.counter);
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const token = `${day}-${month}-${year}-${this.counter}`;
    localStorage.setItem("lastGeneratedToken", token);
    return token;
  }

  resetToken() {
    this.counter = 0;
    localStorage.removeItem("tokenCounter");
    localStorage.removeItem("lastGeneratedToken");
  }
}

const tokenGenerator = new SequenceTokenGenerator();

function generateAndDisplayToken() {
  const token = tokenGenerator.generateToken();
  document.getElementById("tokenDisplay").textContent = token;
}

function resetToken() {
  tokenGenerator.resetToken();
  document.getElementById("tokenDisplay").textContent = "";
}

function generateQRCode(text) {
  // Clear any previous QR Code
  const qrCodeDiv = document.getElementById("qrcode");
  qrCodeDiv.innerHTML = "";

  // Generate the QR Code inside the div
  new QRCode(qrCodeDiv, {
    text: text,
    width: 128,
    height: 128,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });

  // Convert QR Code to a Data URL
  const qrCodeImageDataURL = qrCodeDiv.firstChild.toDataURL("image/png");

  // Save QR Code image to localStorage
  localStorage.setItem("qrCodeImage", qrCodeImageDataURL);

  // Display QR Code in the div
  qr.makeCode(text);
}

// Function to download QR Code image
function downloadQRCode() {
  const qrCodeImageDataURL = localStorage.getItem("qrCodeImage");
  if (qrCodeImageDataURL) {
    const downloadLink = document.createElement("a");
    downloadLink.href = qrCodeImageDataURL;
    downloadLink.download = "qr-code.png";
    downloadLink.click();
  } else {
    alert("No QR code generated yet.");
  }
}

// Event listener for download button
document
  .getElementById("downloadQRCodeButton")
  .addEventListener("click", downloadQRCode);

// Event listener for generating token
document
  .getElementById("generateTokenButton")
  .addEventListener("click", generateAndDisplayToken);

// Event listener for resetting token
document.getElementById("resetButton").addEventListener("click", resetToken);

// Booking appointment
document.getElementById("bookAppointment").addEventListener("click", () => {
  const patientName = document.getElementById("patientName").value;
  const patientAddress = document.getElementById("patientAddress").value;
  const appointmentCause = document.getElementById("appointmentCause").value;
  const token = document.getElementById("tokenDisplay").textContent;
  const capturedImageSrc = document.getElementById("capturedImage").src;
  const recordings = JSON.parse(localStorage.getItem("recordings")) || [];

  if (
    !patientName ||
    !patientAddress ||
    !appointmentCause ||
    !capturedImageSrc ||
    !recordings.length ||
    !token
  ) {
    alert("Please complete all steps before booking the appointment.");
    return;
  }

  const appointmentDetails = {
    patientName,
    patientAddress,
    appointmentCause,
    token,
    capturedImageSrc,
    recordings,
  };

  localStorage.setItem(
    "appointmentDetails",
    JSON.stringify(appointmentDetails)
  );

  displayAppointmentDetails();
  generateQRCodeFromAppointmentDetails(appointmentDetails);
});

// Function to display appointment details
function displayAppointmentDetails() {
  const appointmentDetails = JSON.parse(
    localStorage.getItem("appointmentDetails")
  );
  if (appointmentDetails) {
    const {
      patientName,
      patientAddress,
      appointmentCause,
      token,
      capturedImageSrc,
      recordings,
    } = appointmentDetails;
    const detailsHTML = `
      <h3>Appointment Details</h3>
      <p><strong>Name:</strong> ${patientName}</p>
      <p><strong>Address:</strong> ${patientAddress}</p>
      <p><strong>Cause of Appointment:</strong> ${appointmentCause}</p>
      <p><strong>Token:</strong> ${token}</p>
      <div>
        <h4>Captured Photo:</h4>
        <img src="${capturedImageSrc}" class="img-fluid" />
      </div>
      <div>
        <h4>Recorded Audio:</h4>
        ${recordings
          .map(
            (recording, index) => `
          <div>
            <audio controls src="${recording}"></audio>
            <button class="btn btn-warning" onclick="deleteRecording(${index})">Delete</button>
          </div>
        `
          )
          .join("")}
      </div>
    `;
    document.getElementById("appointmentDetails").innerHTML = detailsHTML;
  }
}

// Function to generate QR code from appointment details
function generateQRCodeFromAppointmentDetails(details) {
  const { patientName, patientAddress, appointmentCause, token } = details;
  const qrCodeContent = `Name: ${patientName}, Address: ${patientAddress}, Cause: ${appointmentCause}, Token: ${token}`;
  generateQRCode(qrCodeContent);
}

// Function to combine all code snippets into one and generate a QR Code
function combineCodeAndGenerateQR() {
  // Combine all your code snippets into one string
  let combinedCode = `// Your combined code here`;

  // Encode the combined code as a Base64 string
  let encodedCode = btoa(combinedCode);

  // Generate and display the QR Code
  generateQRCode(encodedCode);
}

// Event listener for a button to combine code and generate QR Code
document
  .getElementById("combineAndGenerateQRButton")
  .addEventListener("click", combineCodeAndGenerateQR);

// Load QR Code from localStorage on window load
window.onload = function () {
  const qrCodeImageDataURL = localStorage.getItem("qrCodeImage");
  if (qrCodeImageDataURL) {
    const qrCodeDiv = document.getElementById("qrcode");
    qrCodeDiv.innerHTML = `<img src="${qrCodeImageDataURL}" alt="QR Code" />`;
  }
  displayAppointmentDetails();
};
