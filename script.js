const datosIslas = [];
let pronosticosVisitados = [];
let pronosticosSugeridos = [];
const boton = document.querySelector("#botonEnviar");
const sugerenciasContainer = document.getElementById("sugerenciasContainer");

async function obtenerClimaParaIslasCanarias() {
  const apiKey = ''; // Reemplaza con tu API key de OpenWeatherMap

  // Lista de las 8 islas Canarias con sus coordenadas
  const islas = [
    { nombre: 'Gran Canaria', lat: 27.9202, lon: -15.5477 },
    { nombre: 'Tenerife', lat: 28.2916, lon: -16.6291 },
    { nombre: 'Fuerteventura', lat: 28.3587, lon: -14.0537 },
    { nombre: 'Lanzarote', lat: 29.0469, lon: -13.5899 },
    { nombre: 'La Palma', lat: 28.6829, lon: -17.7624 },
    { nombre: 'La Gomera', lat: 28.0974, lon: -17.1114 },
    { nombre: 'El Hierro', lat: 27.7422, lon: -18.0204 },
    { nombre: 'La Graciosa', lat: 29.2603, lon: -13.5083 },
  ];

  const promesas = islas.map((isla) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${isla.lat}&lon=${isla.lon}&appid=${apiKey}&units=metric&lang=es`;
    return fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error(`Error en ${isla.nombre}: ${response.status}`);
      }
      return response.json();
    });
  });

  try {
    const resultados = await Promise.all(promesas);

    resultados.forEach((data, index) => {
      const isla = islas[index];
      const iconCode = data.weather[0].icon;
      const iconUrl = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;

      // Metemos toda la información de las islas
      datosIslas.push({
        nombre: isla.nombre,
        temperatura: data.main.temp,
        condicion: data.weather[0].description,
        viento: data.wind.speed,
        humedad: data.main.humidity,
        icono: iconUrl,
      });
    });
    guardarDatosEnLocalStorage(datosIslas);
    generarCards(datosIslas);
  } catch (error) {
    console.error('Error al obtener el clima:', error.message);
  }
}

function guardarDatosEnLocalStorage(datosIslas) {
  const datosExistentes = localStorage.getItem("datosIslasCanarias");
  if (datosExistentes) {
    console.log("Los datos ya están en el Local Storage.");
    return
  }
  localStorage.setItem("datosIslasCanarias", JSON.stringify(datosIslas));
  console.log("Datos de las islas guardados en el Local Storage.");
}

function generarCards(datosIslas) {
  const contenedor = document.getElementById("contenedor-cards");
  const fragmento = document.createDocumentFragment();

  // Crear las filas
  const filas = [document.createElement("div"), document.createElement("div")];
  filas.forEach((fila) => {
    fila.classList.add("row", "mb-4"); // Clase de Bootstrap para la fila
    fragmento.appendChild(fila);
  });

  // Añadir cada isla como una card
  datosIslas.forEach((isla, index) => {
    // Crear la card y su estructura
    const card = document.createElement("div");
    card.classList.add("col-md-3", "mb-4"); // Tamaño de la card
    const cardContainer = document.createElement("div");
    cardContainer.classList.add("card", "position-relative", "card_personalizada");

    // Título de la card (nombre de la isla)
    const cardHeader = document.createElement("h5");
    cardHeader.classList.add("card-header", "text-center", "cursor-pointer","text-bordered");
    cardHeader.textContent = isla.nombre;

    // Imagen del icono en la esquina superior derecha
    const icono = document.createElement("img");
    icono.src = isla.icono;
    icono.alt = "Icono del clima";
    icono.classList.add("icono-clima");

    // Contenido de la card (detalles del pronóstico)
    const cardBody = document.createElement("div");
    cardBody.classList.add("card-body", "d-none"); // Oculto por defecto
    cardBody.innerHTML = `
      <p class="card-text">Temperatura: ${isla.temperatura}°C</p>
      <p class="card-text">Condición: ${isla.condicion}</p>
      <p class="card-text">Viento: ${isla.viento} m/s</p>
      <p class="card-text">Humedad: ${isla.humedad}%</p>
    `;

    // Agregar funcionalidad para mostrar/ocultar detalles
    cardHeader.addEventListener("click", () => {
      cardBody.classList.toggle("d-none"); // Mostrar/ocultar detalles
    });

    // Construir la card
    cardContainer.appendChild(icono);
    cardContainer.appendChild(cardHeader);
    cardContainer.appendChild(cardBody);
    card.appendChild(cardContainer);

    // Insertar en la fila correspondiente
    const filaIndex = index < 4 ? 0 : 1;
    filas[filaIndex].appendChild(card);
  });

  // Agregar las filas al contenedor
  contenedor.appendChild(fragmento);
}





//Lo primero que hacemos es comprobar si estan los datos en el local storage para asi ahorrarnos una llamada a la api
function obtenerDatosDeLocalStorage() {
  const datosIslas = localStorage.getItem("datosIslasCanarias");
  if (datosIslas) {
    return JSON.parse(datosIslas); 
  }
  console.log("No hay datos guardados en el Local Storage.");
  return null;
}

function conseguirDatos(){
  const datosIslas = obtenerDatosDeLocalStorage();

  if(datosIslas){
    console.log("Obtenemos los datos del local storage");
    generarCards(datosIslas)
  }
  else{
    console.log("Obtenemos los datos de la api");
    obtenerClimaParaIslasCanarias();
  }
}

conseguirDatos();

//Ahora haremos las funciones pertinenetes para hacer consultas a la api en funcion del nombre del input del usuario, y luego guardaremos los datos en el local/session storage.


async function buscarDatosPronostico() {
  //el .trim() quita los espacios para que no haya error de usuario
  const pronosticoFeo = document.querySelector("#nuevoPronostico");
  const pronostico = pronosticoFeo.value.trim();


  if (pronostico === "") {
    mostrarError("Tienes que escribir un lugar para buscar su pronóstico.");
    return;
  }

  try {
    const resultado = await consultarPronostico(pronostico);
    if (resultado) {
      agregarPronostico(resultado);

    } else {
      mostrarError("No se encontró el pronóstico para el lugar ingresado.");
    }
  } catch (error) {
    mostrarError("Ocurrió un error al consultar el pronóstico. Inténtalo nuevamente.");
    console.error(error);
  }
}

//Funcion para mostrar el error
function mostrarError(mensaje) {
  const divError = document.createElement("div");
  divError.textContent = mensaje;
  divError.style.color = "red";

  document.body.appendChild(divError);

  setTimeout(() => {
    divError.remove();
  }, 3000);
}


boton.addEventListener("click", buscarDatosPronostico);

async function consultarPronostico(lugar) {
  const apiKey = '37e727e45a1dbf2da8791de1d78b478e';
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    lugar
  )}&appid=${apiKey}&units=metric&lang=es`;

  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) {
      return null; // Lugar no encontrado
    }
    throw new Error("Error en la consulta de la API.");
  }

  const data = await response.json();
  return {
    nombre: data.name,
    temperatura: data.main.temp,
    condicion: data.weather[0].description,
    viento: data.wind.speed,
    humedad: data.main.humidity,
    icono: `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
  };
}

function agregarPronostico(pronostico) {
  // Verificar si el pronóstico ya existe en los visitados
  const pronosticoExisteVisitados = pronosticosVisitados.some(
    (p) => p.nombre.toLowerCase() === pronostico.nombre.toLowerCase()
  );

  if (!pronosticoExisteVisitados) {
    // Agregar al array visitados y guardar en sessionStorage
    pronosticosVisitados.push(pronostico);
    sessionStorage.setItem("pronosticosVisitados", JSON.stringify(pronosticosVisitados));
  }

  // Verificar si el pronóstico ya existe en los sugeridos
  const pronosticoExisteSugeridos = pronosticosSugeridos.some(
    (p) => p.nombre.toLowerCase() === pronostico.nombre.toLowerCase()
  );

  if (!pronosticoExisteSugeridos) {
    // Agregar al array sugeridos y guardar en localStorage
    pronosticosSugeridos.push(pronostico);
    localStorage.setItem("pronosticosSugeridos", JSON.stringify(pronosticosSugeridos));
  }

  console.log("Pronóstico añadido correctamente:", pronostico.nombre);

  // Actualizar las cards de visitados
  generarCardsVisitados(pronosticosVisitados);

  // Actualizar las sugerencias cerca del input
  mostrarSugerencias();
}


// Antes de salir o refrescar la página, sincronizamos los datos
window.addEventListener("beforeunload", () => {
  // Guarda los datos actuales de sessionStorage en localStorage
  localStorage.setItem("pronosticosSugeridos", JSON.stringify(pronosticosSugeridos));
});





function mostrarResultados(datos) {
  
  const contenedor = document.getElementById("contenedor-cards");
  contenedor.innerHTML = "";

  // Crear una card con los datos del pronóstico
  const card = document.createElement("div");
  card.classList.add("card", "mb-3");
  card.style.width = "18rem";

  const img = document.createElement("img");
  img.src = datos.icono;
  img.classList.add("card-img-top");
  img.alt = `Icono del clima de ${datos.nombre}`;

  const cardBody = document.createElement("div");
  cardBody.classList.add("card-body");

  const cardTitle = document.createElement("h5");
  cardTitle.classList.add("card-title");
  cardTitle.textContent = datos.nombre;

  const cardText = document.createElement("p");
  cardText.classList.add("card-text");
  cardText.innerHTML = `
    <strong>Temperatura:</strong> ${datos.temperatura}°C<br>
    <strong>Condición:</strong> ${datos.condicion}<br>
    <strong>Viento:</strong> ${datos.viento} m/s<br>
    <strong>Humedad:</strong> ${datos.humedad}%
  `;

  // Agregar los elementos al contenedor
  cardBody.appendChild(cardTitle);
  cardBody.appendChild(cardText);
  card.appendChild(img);
  card.appendChild(cardBody);
  contenedor.appendChild(card);
}

function generarCardsVisitados(pronosticosVisitados) {
  const contenedor = document.getElementById("pronosticosBuscados");

  // Limpiamos el contenedor para evitar duplicados
  contenedor.innerHTML = "";

  // Creamos un fragmento para optimizar la inserción en el DOM
  const fragmento = document.createDocumentFragment();

  // Crear filas para agrupar las cards
  const filas = [];
  pronosticosVisitados.forEach((pronostico, index) => {
    // Si es el inicio de una nueva fila
    if (index % 4 === 0) {
      const nuevaFila = document.createElement("div");
      nuevaFila.classList.add("row", "mb-4");
      filas.push(nuevaFila);
    }

    // Crear la card y su estructura
    const card = document.createElement("div");
    card.classList.add("col-md-3", "mb-4"); // Tamaño de la card
    const cardContainer = document.createElement("div");
    cardContainer.classList.add("card", "position-relative", "card_personalizada");

    // Título de la card (nombre de la ubicación)
    const cardHeader = document.createElement("h5");
    cardHeader.classList.add("card-header", "text-center", "cursor-pointer", "text-bordered");
    cardHeader.textContent = pronostico.nombre;

    // Imagen del icono en la esquina superior derecha
    const icono = document.createElement("img");
    icono.src = pronostico.icono;
    icono.alt = `Icono del clima de ${pronostico.nombre}`;
    icono.classList.add("icono-clima");

    // Contenido de la card (detalles del pronóstico)
    const cardBody = document.createElement("div");
    cardBody.classList.add("card-body", "d-none");
    cardBody.innerHTML = `
      <p class="card-text">Temperatura: ${pronostico.temperatura}°C</p>
      <p class="card-text">Condición: ${pronostico.condicion}</p>
      <p class="card-text">Viento: ${pronostico.viento} m/s</p>
      <p class="card-text">Humedad: ${pronostico.humedad}%</p>
    `;

    // Agregar funcionalidad para mostrar/ocultar detalles
    cardHeader.addEventListener("click", () => {
      cardBody.classList.toggle("d-none");
    });

    // Construir la card
    cardContainer.appendChild(icono);
    cardContainer.appendChild(cardHeader);
    cardContainer.appendChild(cardBody);
    card.appendChild(cardContainer);

    // Agregar la card a la fila correspondiente
    const filaActual = filas[Math.floor(index / 4)];
    filaActual.appendChild(card);
  });

  // Agregar las filas al fragmento
  filas.forEach((fila) => fragmento.appendChild(fila));

  // Añadir el fragmento al contenedor
  contenedor.appendChild(fragmento);
}

function mostrarSugerencias() {
  const contenedorSugerencias = document.getElementById("contenedorSugerencias");
  
  // Limpiamos las sugerencias actuales
  contenedorSugerencias.innerHTML = "";

  pronosticosSugeridos.forEach((pronostico) => {
    const sugerenciaDiv = document.createElement("div");
    sugerenciaDiv.classList.add("sugerencia-item");
    sugerenciaDiv.textContent = pronostico.nombre; // Muestra solo el nombre del pronóstico

    // Añadir funcionalidad al hacer clic (si es necesario)
    sugerenciaDiv.addEventListener("click", () => {
      agregarPronostico(pronostico);
      console.log(`Pronóstico seleccionado: ${pronostico.nombre}`);
    });

    // Añadimos la sugerencia al contenedor
    contenedorSugerencias.appendChild(sugerenciaDiv);
  });
}





// Cargar pronósticos al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  const pronosticosGuardados = JSON.parse(sessionStorage.getItem("pronosticosVisitados")) || [];
  if (pronosticosGuardados.length > 0) {
    generarCardsVisitados(pronosticosGuardados);
  }
});

let pronosticosVisitadosCrudo = sessionStorage.getItem("pronosticosVisitados");
let pronosticosSugeridosCrudo = localStorage.getItem("pronosticosSugeridos");
if (pronosticosVisitadosCrudo) {
  pronosticosVisitados = JSON.parse(pronosticosVisitadosCrudo);
  generarCardsVisitados(pronosticosVisitados);
}

if (pronosticosSugeridosCrudo) {
  pronosticosSugeridos = JSON.parse(pronosticosSugeridosCrudo);
} else {
  localStorage.setItem("pronosticosSugeridos", JSON.stringify([])); // Inicializamos si está vacío
}

document.getElementById("botonEliminarSugeridos").addEventListener("click", () => {
  // Vaciar el array de sugeridos
  pronosticosSugeridos = [];
  
  // Eliminar del localStorage
  localStorage.removeItem("pronosticosSugeridos");
  
  // Limpiar las sugerencias del DOM
  const contenedorSugerencias = document.getElementById("contenedorSugerencias");
  contenedorSugerencias.innerHTML = "";

  console.log("Todos los pronósticos sugeridos han sido eliminados.");
});


//Funciones para ordenar los datos

function ordenarPorNombre(pronosticos) {
  return pronosticos.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function ordenarPorTemperatura(pronosticos) {
  return pronosticos.sort((a, b) => a.temperatura - b.temperatura);
}

function actualizarVisitadosOrdenados(ordenar) {
  if (ordenar === "nombre") {
      pronosticosVisitados = ordenarPorNombre(pronosticosVisitados);
  } else if (ordenar === "temperatura") {
      pronosticosVisitados = ordenarPorTemperatura(pronosticosVisitados);
  }
  sessionStorage.setItem("pronosticosVisitados", JSON.stringify(pronosticosVisitados));
  generarCardsVisitados(pronosticosVisitados);
}


document.getElementById("ordenarVisitadosPorNombre").addEventListener("click", () => {
  actualizarVisitadosOrdenados("nombre");
});

document.getElementById("ordenarVisitadosPorTemperatura").addEventListener("click", () => {
  actualizarVisitadosOrdenados("temperatura");
});


function actualizarVisibilidadSugerencias() {
  const contenedorSugerencias = document.getElementById("contenedorSugerencias");
  const botonEliminarSugeridos = document.getElementById("botonEliminarSugeridos");
  const tituloSugerencias = document.querySelector("#tituloSugerido");

  // Si no hay sugerencias, ocultar los elementos
  if (contenedorSugerencias.children.length === 0) {
      botonEliminarSugeridos.style.display = "none";
      tituloSugerencias.style.display = "none";
  } else {
      botonEliminarSugeridos.style.display = "block";
      tituloSugerencias.style.display = "block";
  }
}
mostrarSugerencias();
