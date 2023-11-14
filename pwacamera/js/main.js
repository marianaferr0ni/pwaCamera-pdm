if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      let reg;
      reg = await navigator.serviceWorker.register('./sw.js', {type: "module"});
      console.log('Service worker registrada! reg');
    } catch (err) {
      console.log(' Service worker registro falhou:', err);
    }
  });
};

var constraints = {video: {facingMode: "user"}, audio: false };

const cameraView = document.querySelector("#camera--view"),
  cameraOutput = document.querySelector("#camera--output"),
  cameraSensor = document.querySelector("#camera--sensor"),
  cameraTrigger = document.querySelector("#camera--trigger")

const fotos = []

function cameraStart(){
  navigator.mediaDevices
  .getUserMedia(constraints)
  .then(function (stream) {
    let track = stream.getTracks()[0];
    cameraView.srcObject = stream;
  })
  .catch(function (error) {
    console.error("Ocorreu um erro.", error)
  });
};

cameraTrigger.onclick = function () {
  cameraSensor.width = cameraView.videoWidth;
  cameraSensor.height = cameraView.videoHeight;
  cameraSensor.getContext("2d").drawImage(cameraView, 0, 0);
  const url = cameraSensor.toDataURL("image/webp");
  cameraOutput.src = url
  cameraOutput.classList.add("taken");

  if (fotos.length >= 3) {
    fotos.shift(); // Remove a foto mais antiga se houver 3 ou mais fotos na lista.
  }
  fotos.push(url);
  displayFotos();
};

function displayFotos () {
  const fotosContainer = document.querySelector("#fotos-container");
  fotosContainer.innerHTML = ""; // Limpa o conteúdo anterior.

  fotos.forEach((url) => {
    const img = document.createElement("img");
    img.src = url;
    fotosContainer.appendChild(img);
  });
}

const switchCameraButton = document.querySelector("#switch-camera-button");
switchCameraButton.addEventListener("click", async () => {
  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((device) => device.kind === "videoinput");

      if (videoInputs.length >= 2) {
        const currentCamera = constraints.video.facingMode;
        constraints.video.facingMode = currentCamera === "user" ? "environment" : "user";
        cameraStart();
      } else {
        alert("Não há câmeras disponíveis para alternar.");
      }
    } catch (error) {
        console.error("Erro ao alternar entre as câmeras:", error);
    }
  } 
  else {
    alert("Seu navegador não suporta a troca de câmera.");
  }
});

window.addEventListener("load", cameraStart, false);