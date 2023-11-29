if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      let reg;
      reg = await navigator.serviceWorker.register('./sw.js', {type: "module"});
      console.log('Service worker registrada!', reg);
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

  adicionarFotoAoIndexDB(url)
};

function adicionarFotoAoIndexDB(url) {
  const posicao = posicaoInicial ? {
    latitude: posicaoInicial.coords.latitude,
    longitude: posicaoInicial.coords.longitude
  } : null;

  const dataHora = new Date().toISOString();

  // Abre ou cria o banco de dados
  const request = window.indexedDB.open('fotosDB', 1);

  request.onerror = function(event) {
    console.error('Erro ao abrir o banco de dados:', event.target.errorCode);
  };

  request.onupgradeneeded = function(event) {
    const db = event.target.result;

    // Cria a loja de objetos para armazenar as fotos
    const store = db.createObjectStore('fotos', { keyPath: 'id', autoIncrement: true });

    // Cria os índices para busca por data e localização
    store.createIndex('data', 'data');
    store.createIndex('latitude', 'latitude');
    store.createIndex('longitude', 'longitude');
  };

  request.onsuccess = function(event) {
    const db = event.target.result;

    // Adiciona a foto ao banco de dados
    const transaction = db.transaction(['fotos'], 'readwrite');
    const store = transaction.objectStore('fotos');
    const novaFoto = { url, posicao, data: dataHora };

    store.add(novaFoto);

    transaction.oncomplete = function() {
      console.log('Foto adicionada ao IndexDB com sucesso!');
    };

    transaction.onerror = function(event) {
      console.error('Erro ao adicionar a foto ao IndexDB:', event.target.error);
    };
  };
}

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

let posicaoInicial; //variavel para capturar a posicao
const capturarLocalizacao = document.getElementById('localizacao');
const latitude = document.getElementById('latitude');
const longitude = document.getElementById('longitude');
const map = document.getElementById('mapa');
const sucesso = (posicao) => {//callback de sucesso para captura da posicao
  posicaoInicial = posicao;
  latitude.innerHTML = posicaoInicial.coords.latitude;
  longitude.innerHTML = posicaoInicial.coords.longitude;
  map.src = "https://maps.google.com/maps?q=" + posicaoInicial.coords.latitude + ", " + posicaoInicial.coords.longitude + "&z=16&output=embed"
}


const erro = (error) => {//callback ite error (falha para captura de Localizacao)
  let errorMessage;
  switch(error.code){
    case 0:
      errorMessage = "Erro desconhecido"
    break;
    case 1:
      errorMessage = "Permissão negada!"
    break;
    case 2:
      errorMessage = "Captura de posição indisponivel!"
    break;
    case 3:
      errorMessage = "Tempo de solicitação excedido!"
    break ;
  }
  console.log('Ocorreu um erro: ' + errorMessage);
}

function listarFotosDoIndexDB() {
  const request = window.indexedDB.open('fotosDB', 1);

  request.onerror = function(event) {
    console.error('Erro ao abrir o banco de dados:', event.target.errorCode);
  };

  request.onsuccess = function(event) {
    const db = event.target.result;

    const transaction = db.transaction(['fotos'], 'readonly');
    const store = transaction.objectStore('fotos');
    const fotosIndex = store.index('data');

    const fotosRequest = fotosIndex.getAll();

    fotosRequest.onsuccess = function() {
      const fotosArmazenadas = fotosRequest.result;

      if (fotosArmazenadas.length > 0) {
        console.log('Fotos armazenadas no IndexDB:');
        fotosArmazenadas.forEach((foto) => {
          console.log(`URL: ${foto.url}, Data: ${foto.data}, Latitude: ${foto.posicao ? foto.posicao.latitude : 'N/A'}, Longitude: ${foto.posicao ? foto.posicao.longitude : 'N/A'}`);
        });
      } else {
        console.log('Não há fotos armazenadas no IndexDB.');
      }
    };

    fotosRequest.onerror = function(event) {
      console.error('Erro ao obter fotos do IndexDB:', event.target.error);
    };
  };
}

window.addEventListener("load", cameraStart, false);