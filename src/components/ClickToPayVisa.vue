<template>
  <button id="visa-click-to-pay-button"></button>
</template>

<script setup>
import { onMounted } from 'vue';

const loadVisaClickToPay = () => {
  console.log('Cargando script de VISA Click to Pay...');
  const script = document.createElement('script');
  script.src = 'https://sandbox-assets.secure.checkout.visa.com/checkout-widget/resources/js/integration/v1/sdk.js';
  script.async = true;
  script.onload = onVisaClickToPayLoaded;
  script.onerror = function() {
    console.error('Error al cargar el script de VISA Click to Pay.');
  };
  document.head.appendChild(script);
};

const onVisaClickToPayLoaded = () => {
  console.log('Script de VISA Click to Pay cargado.');
  // Configuración de VISA Click to Pay
  const visaCheckoutSettings = {
    apikey: 'YOUR_API_KEY',
    encryptionKey: 'YOUR_ENCRYPTION_KEY',
    paymentRequest: {
      currencyCode: 'USD',
      subtotal: '10.00'
    }
  };

  V.init(visaCheckoutSettings);

  V.on("payment.success", function(payment) {
    console.log("Pago exitoso:", payment);
  });

  V.on("payment.error", function(error) {
    console.error("Error en el pago:", error);
  });

  const buttonContainer = document.getElementById('visa-click-to-pay-button');
  if (buttonContainer) {
    V.init({
      apikey: visaCheckoutSettings.apikey,
      encryptionKey: visaCheckoutSettings.encryptionKey
    });
    V.on("payment.success", function(payment) {
      console.log("Pago exitoso:", payment);
    });
    V.on("payment.error", function(error) {
      console.error("Error en el pago:", error);
    });
    buttonContainer.innerHTML = '<button id="v-button">Pagar con VISA Click to Pay</button>';
    document.getElementById('v-button').addEventListener('click', function() {
      V.on("payment.success", function(payment) {
        console.log("Pago exitoso:", payment);
      });
      V.on("payment.error", function(error) {
        console.error("Error en el pago:", error);
      });
    });
    console.log('Botón de VISA Click to Pay añadido al DOM.');
  } else {
    console.error('No se encontró el contenedor para el botón de VISA Click to Pay.');
  }
};

onMounted(() => {
  loadVisaClickToPay();
});
</script>

<style scoped>
</style>
