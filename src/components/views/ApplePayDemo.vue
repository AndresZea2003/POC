<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div class="w-full max-w-3xl bg-white rounded-lg shadow-xl overflow-hidden">
      <div class="p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Apple Pay Demo</h2>
        <p class="text-gray-600 mb-6">
          Prueba de concepto para integración de Apple Pay (flujo web con validación de comercio y autorización)
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
              <label class="block text-sm font-medium text-gray-700 mb-2">Solicitud de Pago:</label>
              <pre class="bg-gray-100 p-4 rounded-md overflow-auto text-sm h-[50vh]">{{ JSON.stringify(paymentRequest, null, 2) }}</pre>
            </div>

            <div v-if="currentTab === 'response'">
              <label class="block text-sm font-medium text-gray-700 mb-2">Respuesta / Token:</label>
              <pre class="bg-gray-100 p-4 rounded-md overflow-auto text-sm h-[50vh]">{{
                paymentResponse
                  ? JSON.stringify(paymentResponse, null, 2)
                  : 'No hay respuesta aún'
              }}</pre>
            </div>

            <div v-if="currentTab === 'decrypted'">
              <label class="block text-sm font-medium text-gray-700 mb-2">Datos Procesados (Simulados):</label>
              <pre class="bg-gray-100 p-4 rounded-md overflow-auto text-sm h-[50vh]">{{
                processedData
                  ? JSON.stringify(processedData, null, 2)
                  : 'No hay datos procesados aún'
              }}</pre>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center justify-center gap-3">
          <apple-pay-button
            id="apple-pay-button"
            buttonstyle="black"
            type="buy"
            locale="es-CO"
            @click="beginApplePaySession"
            style="--apple-pay-button-width: 240px; --apple-pay-button-height: 44px; --apple-pay-button-border-radius: 8px;"
          ></apple-pay-button>
          <div class="text-xs text-gray-500">Si tu navegador no soporta Apple Pay, Apple mostrará un flujo alterno (QR en iPhone con iOS 18+).</div>
        </div>

        <div v-if="status.message" class="mt-4 text-center text-sm" :class="status.ok ? 'text-green-700' : 'text-red-700'">
          {{ status.message }}
        </div>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { onMounted, ref } from 'vue';

const isApplePayAvailable = ref(false);
const paymentRequest = ref({});
const paymentResponse = ref(null);
const processedData = ref(null);
const currentTab = ref('request');
const status = ref({ ok: false, message: '' });

const tabs = [
  { label: 'Solicitud', value: 'request' },
  { label: 'Respuesta', value: 'response' },
  { label: 'Datos Procesados', value: 'decrypted' },
];

onMounted(async () => {
  // Mostrar siempre el botón. El SDK maneja los casos alternos (QR) donde aplican.
  try {
    if (typeof window !== 'undefined' && 'ApplePaySession' in window) {
      const canMakePayments = await window.ApplePaySession.canMakePayments();
      isApplePayAvailable.value = !!canMakePayments;
      status.value = canMakePayments
        ? { ok: true, message: 'Apple Pay disponible.' }
        : { ok: false, message: 'Apple Pay no disponible para pagos.' };
    } else {
      // No ocultamos el botón: lo dejamos para que el SDK maneje el fallback donde aplique
      isApplePayAvailable.value = true;
      status.value = { ok: false, message: 'SDK cargado, esperando soporte del navegador.' };
    }
  } catch (e) {
    isApplePayAvailable.value = true;
    status.value = { ok: false, message: 'No se pudo verificar soporte; intentando flujo estándar.' };
  }
});

const buildPaymentRequest = () => {
  const req = {
    countryCode: 'US',
    currencyCode: 'USD',
    supportedNetworks: ['visa', 'masterCard', 'amex'],
    merchantCapabilities: ['supports3DS', 'supportsCredit', 'supportsDebit'],
    total: { label: 'Example Merchant', amount: '10.00', type: 'final' },
    requiredBillingContactFields: ['postalAddress', 'name', 'email'],
    requiredShippingContactFields: ['postalAddress', 'name', 'email'],
  };
  paymentRequest.value = req;
  return req;
};

const beginApplePaySession = async () => {
  try {
    const requestObject = buildPaymentRequest();
    const session = new window.ApplePaySession(3, requestObject);

    session.onvalidatemerchant = async (event) => {
      try {
        const merchantSession = await validateMerchant(event.validationURL);
        session.completeMerchantValidation(merchantSession);
      } catch (err) {
        status.value = { ok: false, message: 'Fallo validación de comercio.' };
        session.abort();
      }
    };

    session.onpaymentauthorized = async (event) => {
      try {
        const result = await authorizePayment(event.payment);
        paymentResponse.value = result;
        processedData.value = result.processedData || null;
        currentTab.value = 'response';
        session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
        status.value = { ok: true, message: 'Pago autorizado (simulado).' };
      } catch (err) {
        session.completePayment(window.ApplePaySession.STATUS_FAILURE);
        status.value = { ok: false, message: 'Fallo al autorizar pago.' };
      }
    };

    session.oncancel = () => {
      status.value = { ok: false, message: 'Pago cancelado por el usuario.' };
    };

    session.begin();
  } catch (e) {
    status.value = { ok: false, message: 'No fue posible iniciar Apple Pay.' };
  }
};

const validateMerchant = async (validationURL) => {
  const res = await fetch('/api/applepay/validate.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ validationURL }),
  });
  if (!res.ok) throw new Error('Merchant validation failed');
  return res.json();
};

const authorizePayment = async (payment) => {
  const res = await fetch('/api/applepay/authorize.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment }),
  });
  if (!res.ok) throw new Error('Authorization failed');
  return res.json();
};
</script>

<style scoped>
/* Sin estilos: usamos el web component oficial <apple-pay-button> */
</style>


