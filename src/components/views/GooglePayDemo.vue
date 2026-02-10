<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div class="w-full max-w-3xl bg-white rounded-lg shadow-xl overflow-hidden">
      <div class="p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Google Pay Demo</h2>
        <p class="text-gray-600 mb-6">
          Prueba de concepto para integración de Google Pay
        </p>

        <div class="mb-6">
          <div class="flex border-b border-gray-200">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              @click="currentTab = tab.value"
              :class="[
                'py-2 px-4 font-medium focus:outline-none',
                currentTab === tab.value
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700',
              ]"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="mt-4">
            <div v-if="currentTab === 'request'">
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Solicitud de Pago:</label
              >
              <pre
                class="bg-gray-100 p-4 rounded-md overflow-auto text-sm h-[50vh]"
                >{{ JSON.stringify(paymentRequest, null, 2) }}</pre
              >
            </div>

            <div v-if="currentTab === 'response'">
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Token de Pago:</label
              >
              <pre
                class="bg-gray-100 p-4 rounded-md overflow-auto text-sm h-[50vh]"
                >{{
                  paymentData
                    ? JSON.stringify(paymentData, null, 2)
                    : "No hay datos de pago aún"
                }}</pre
              >
            </div>

            <div v-if="currentTab === 'decrypted'">
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Datos Desencriptados (Simulados):</label
              >
              <pre
                class="bg-gray-100 p-4 rounded-md overflow-auto text-sm h-[50vh]"
                >{{
                  decryptedData
                    ? JSON.stringify(decryptedData, null, 2)
                    : "No hay datos desencriptados aún"
                }}</pre
              >
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <button :disabled="!paymentsClient" id="google-pay-button"></button>
        </div>
        <!-- <button
            @click="onGooglePayButtonClicked"
            :disabled="!paymentsClient"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Pagar con Google Pay
          </button> -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import * as forge from "node-forge";

const paymentsClient = ref(null);
const paymentRequest = ref(null);
const paymentData = ref(null);
const decryptedData = ref(null);
const currentTab = ref("request");

const tabs = [
  { label: "Solicitud", value: "request" },
  { label: "Respuesta", value: "response" },
  // { label: "Datos Desencriptados", value: "decrypted" },
];

onMounted(() => {
  const script = document.createElement("script");
  script.src = "https://pay.google.com/gp/p/js/pay.js";
  script.async = true;
  script.onload = onGooglePayLoaded;
  document.body.appendChild(script);

  return () => {
    document.body.removeChild(script);
  };
});

const onGooglePayLoaded = () => {
  console.log("Script de Google Pay cargado.");
  if (window.google && window.google.payments && window.google.payments.api) {
    const paymentsClient = new google.payments.api.PaymentsClient({
      environment: "TEST",
    });

    const paymentDataRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        {
          type: "CARD",
          parameters: {
            // allowedAuthMethods: ['CRYPTOGRAM_3DS'],
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['AMEX', 'DISCOVER', 'MASTERCARD', 'VISA'],
            assuranceDetailsRequired: true
          },
          tokenizationSpecification: {
            type: "PAYMENT_GATEWAY",
            parameters: {
              gateway: "placetopay",
              gatewayMerchantId: "Este es un Example",
            },
          },
        },
      ],
      merchantInfo: {
        merchantId: "BCR2DN4T6M3Y5S4P",
        merchantName: "Example Merchant",
      },
      transactionInfo: {
        totalPriceStatus: "FINAL",
        totalPrice: "2000",
        currencyCode: "COP",
        countryCode: "CO",
      },
    };

    paymentRequest.value = paymentDataRequest;

    const button = paymentsClient.createButton({
      onClick: () =>
        onGooglePayButtonClicked(paymentsClient, paymentDataRequest),
    });

    const buttonContainer = document.getElementById("google-pay-button");
    if (buttonContainer) {
      buttonContainer.appendChild(button);
      console.log("Botón de Google Pay añadido al DOM.");
    } else {
      console.error(
        "No se encontró el contenedor para el botón de Google Pay."
      );
    }
  } else {
    console.error("Google Pay no está disponible.");
  }
};

const onGooglePayButtonClicked = async (paymentsClient, paymentDataRequest) => {
  if (!paymentsClient) return;

  try {
    paymentData.value = await paymentsClient.loadPaymentData(
      paymentRequest.value
    );
    simulateDecryption(paymentData.value);
    // await sendPaymentDataToServer(paymentData.value);
    currentTab.value = "response";
  } catch (err) {
    console.error(err);
  }
};

const simulateDecryption = (paymentDataValue) => {
  decryptedData.value = {
    "gatewayMerchantId": "googletest",
    "messageExpiration": "1725986899985",
    "messageId": "AH2Ejtf5xkNu0_0hU60yGyNLOSGZq3RcF8AUx2ralVwyijXjGnkDjlVJXXoDy9ha1Zd3tiwdQM6GIFYO2nNAHVi2Mqk7xydTwEj_zMrC_auEiE_DJVFkPCo",
    "paymentMethod": "CARD",
    "paymentMethodDetails": {
      "expirationYear": 2026,
      "expirationMonth": 12,
      "pan": "5555555555554444",
      "authMethod": "PAN_ONLY",
      "assuranceDetails": {
        "cardHolderAuthenticated": false,
        "accountVerified": true
      }
    }
  };
};

const sendPaymentDataToServer = async (paymentData) => {
  try {
    console.log("Datos de pago recibidos:", paymentData);

    const tokenData = paymentData.paymentMethodData.tokenizationData.token;

    // Asegúrate de que tokenData sea una cadena
    const tokenString =
      typeof tokenData === "string" ? tokenData : JSON.stringify(tokenData);

    const response = await fetch("/api/decrypt.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tokenData: tokenString }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log("Pago procesado exitosamente:", result);
      decryptedData.value = result.decryptedData || {
        message: "Pago procesado exitosamente",
        transactionId: result.transactionId,
      };
    } else {
      throw new Error(result.message || "Error al procesar el pago");
    }
  } catch (error) {
    console.error("Error al procesar el token:", error);
    decryptedData.value = {
      error: "Error al procesar el token: " + error.message,
    };
  }
};

// const decryptPaymentData = async (encryptedMessage) => {
//   try {
//     console.log(
//       "Token recibido:",
//       encryptedMessage.paymentMethodData.tokenizationData.token
//     );

//     const tokenData = encryptedMessage.paymentMethodData.tokenizationData.token;

//     // Enviar los datos al servidor para su procesamiento
//     const response = await fetch("/api/decrypt.json", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ tokenData }),
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const result = await response.json();

//     if (result.success) {
//       console.log("Pago procesado exitosamente:", result);
//       decryptedData.value = {
//         message: "Pago procesado exitosamente",
//         transactionId: result.transactionId,
//       };
//     } else {
//       throw new Error(result.message || "Error al procesar el pago");
//     }
//   } catch (error) {
//     console.error("Error al procesar el token:", error);
//     decryptedData.value = {
//       error: "Error al procesar el token: " + error.message,
//     };
//   }
// };

// const decryptPaymentData = (encryptedMessage) => {
//   const tinkEncryptionKey = "yqUdlZVpwVBHGfGsHkYnVkylFveEqLNL";
//   const recipientId = "someRecipientId";

//   try {
//     console.log(
//       "Token recibido:",
//       encryptedMessage.paymentMethodData.tokenizationData.token
//     );

//     let token;
//     try {
//       token = JSON.parse(
//         encryptedMessage.paymentMethodData.tokenizationData.token
//       );
//     } catch (parseError) {
//       console.error("Error al parsear el token:", parseError);
//       throw new Error("El token no es un JSON válido");
//     }

//     console.log("Token parseado:", token);

//     if (!token.signedMessage) {
//       throw new Error("El token no contiene el campo 'signedMessage'");
//     }

//     let signedMessage;
//     try {
//       signedMessage = JSON.parse(token.signedMessage);
//     } catch (parseError) {
//       console.error("Error al parsear signedMessage:", parseError);
//       throw new Error("El signedMessage no es un JSON válido");
//     }

//     console.log("Mensaje firmado:", signedMessage);

//     if (
//       !signedMessage.encryptedMessage ||
//       !signedMessage.ephemeralPublicKey ||
//       !signedMessage.tag
//     ) {
//       throw new Error("El mensaje firmado no contiene los campos esperados");
//     }

//     // Aquí es donde normalmente se realizaría la desencriptación.
//     // Sin embargo, dado que esto requiere claves privadas que solo deben estar en el servidor,
//     // vamos a simular la desencriptación para fines de demostración.

//     const simulatedDecryptedData = {
//       cardDetails: {
//         pan: "4111XXXXXXXX1111",
//         expirationMonth: "12",
//         expirationYear: "2025",
//       },
//       billingAddress: {
//         name: "John Doe",
//         address1: "1600 Amphitheatre Parkway",
//         locality: "Mountain View",
//         administrativeArea: "CA",
//         countryCode: "US",
//         postalCode: "94043",
//       },
//     };

//     decryptedData.value = simulatedDecryptedData;
//     console.log("Datos desencriptados (simulados):", simulatedDecryptedData);
//   } catch (error) {
//     console.error("Error al procesar el token:", error);
//     decryptedData.value = {
//       error: "Error al procesar el token: " + error.message,
//     };
//   }
// };
</script>
