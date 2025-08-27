<template>
  <div class="flex flex-col items-center justify-center w-3/4 h-3/4 my-5 bg-gray-100 p-6 rounded-lg shadow-lg">
    <!-- Contenedor de VISA -->
    <div
        class="w-full max-w-md p-4 border border-gray-300 rounded-lg bg-white shadow-md"
        id="buttonPaymentListContainer"
    ></div>

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
      Iniciar flujo VISA
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const captureContext = ref("");
const transientToken = ref("");

const loadVisaClickToPay = async () => {
  console.log("Cargando script de VISA Click to Pay...");
  const script = document.createElement("script");
  script.src =
      "https://testup.cybersource.com/uc/v1/assets/0.23.2/SecureAcceptance.js";
      // "https://apitest.cybersource.com/up/v1/assets/0.22.6/SecureAcceptance.js";
  script.async = true;
  script.onload = () => console.log("Script VISA cargado ✅");
  script.onerror = () => console.error("Error al cargar el script de VISA.");
  document.head.appendChild(script);
};

const startVisaFlow = async () => {
  if (!captureContext.value) {
    console.error("No se ha definido captureContext 🚨");
    return;
  }

  try {
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

onMounted(() => {
  console.log("Componente montado ✅");
  loadVisaClickToPay();
});
</script>