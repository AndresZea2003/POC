<template>
  <div class="flex flex-col items-center justify-center w-3/4 h-3/4 my-5 bg-gray-100 p-6 rounded-lg shadow-lg">
    <!-- Contenedor de VISA -->
    <div
        class="w-full max-w-md p-4 border border-gray-300 rounded-lg bg-white shadow-md"
        id="buttonPaymentListContainer"
    ></div>

    <!-- URL de la librería (SecureAcceptance.js) -->
    <input
        class="mt-6 w-full max-w-md p-3 border border-gray-300 rounded-lg bg-white shadow-md text-xs"
        v-model="libraryUrl"
        type="url"
        placeholder="URL de la librería (SecureAcceptance.js)..."
    />

    <!-- Textarea donde el usuario pega o ve el token transitorio -->
    <textarea
        class="mt-6 w-full max-w-md h-40 p-4 border border-gray-300 rounded-lg bg-white shadow-md resize-none"
        v-model="captureContext"
        placeholder="Pega aquí tu captureContext generado..."
    ></textarea>

    <!-- Textarea para mostrar el transient token -->
    <textarea
        class="mt-6 w-full max-w-md h-40 p-4 border border-gray-300 rounded-lg bg-white shadow-md resize-none"
        v-model="transientToken"
        placeholder="Aquí aparecerá el transientToken..."
        readonly
    ></textarea>

    <button
        class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
        @click="startVisaFlow"
    >
      Iniciar flujo VISA 11 nov
    </button>
    Test _ 3
  </div>
</template>

<script setup>
import { ref } from "vue";

const DEFAULT_LIBRARY_URL =
    "https://testup.cybersource.com/uc/v1/assets/amb0DIrevwx54EaTGtvTXLy53TGED3v1Yn4k6mPBmMkIeODeJOpUFfekGQZanWwehbpZ2YRQBLWINMJuG3WYex5Ufm2qChlPg74GQwZg8z6_-A98CTnOaVrCxqSlrSsv-aGUU-AoOLhWMO_MXtfy1lHJeKucE0Zm4urXwamSwOosEiV1CB5EneVzCXl4bEX5WUiHdtHlu2P28f1Yf/SecureAcceptance.js";
// "https://up.cybersource.com/uc/v1/assets/0.34/SecureAcceptance.js";

const libraryUrl = ref(DEFAULT_LIBRARY_URL);
const captureContext = ref("");
const transientToken = ref("");

let loadedLibraryUrl = null;
let libraryScript = null;

// Carga la librería desde la URL indicada; si cambió, reemplaza el script anterior.
const loadVisaClickToPay = (url) => {
  if (loadedLibraryUrl === url && typeof Accept !== "undefined") {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    console.log("Cargando script de VISA Click to Pay...", url);
    libraryScript?.remove();
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onload = () => {
      loadedLibraryUrl = url;
      console.log("Script VISA cargado ✅");
      resolve();
    };
    script.onerror = () => {
      loadedLibraryUrl = null;
      reject(new Error("Error al cargar el script de VISA: " + url));
    };
    libraryScript = script;
    document.head.appendChild(script);
  });
};

const startVisaFlow = async () => {
  const url = libraryUrl.value.trim();
  if (!url) {
    console.error("No se ha definido la URL de la librería 🚨");
    return;
  }
  if (!captureContext.value) {
    console.error("No se ha definido captureContext 🚨");
    return;
  }

  try {
    await loadVisaClickToPay(url);

    const showArgs = {
      containers: {
        paymentSelection: "#buttonPaymentListContainer",
      },
    };

    Accept(captureContext.value)
        .then((accept) => accept.unifiedPayments())
        .then((up) => up.show(showArgs))
        .then((tt) => {
          transientToken.value = tt; // guardo en la vista
          console.log("tt:", tt);
        })
        .catch((error) => {
          console.error("Error en flujo de Click to Pay:", error);
        });
  } catch (e) {
    console.error("Error inesperado:", e);
  }
};
</script>
