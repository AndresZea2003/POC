<template>
  <div class="flex justify-center">
    <div class="space-y-2">

      <div class="fixed overflow-auto h-[300px] w-[420px] top-0 text-sm mt-4 bg-stone-900 border-stone-700 border-4 p-2 rounded">
        <span class="text-yellow-400">Request utilizado para Google Pay</span>
        <pre class="text-white">{{ request }}</pre>
      </div>

      <div class="bg-gray-800 w-[420px] space-y-4 p-2 rounded ">
        <div class="font-semibold text-white flex items-center gap-x-2 justify-center">
          Libreria de Google:
          <div class="checkbox-wrapper-10">
            <input :checked="status.script" type="checkbox" id="cb5" class="tgl tgl-flip">
            <label for="cb5" data-tg-on="Ok" data-tg-off="Nope" class="tgl-btn"></label>
          </div>
        </div>

        <div class="font-semibold text-white flex items-center gap-x-2 justify-center">
          Navegador compatible:
          <div class="checkbox-wrapper-10">
            <input :checked="status.script" type="checkbox" id="cb6" class="tgl tgl-flip">
            <label for="cb6" data-tg-on="Sipi" data-tg-off="Nope" class="tgl-btn"></label>
          </div>
        </div>

        <div class="font-semibold text-white flex items-center gap-x-2 justify-center">
          Entorno:
          <div class="checkbox-wrapper-10">
            <input :checked="status.environment" type="checkbox" id="cb7" class="tgl tgl-flip">
            <label for="cb7" data-tg-on="Test" data-tg-off="Prod" class="tgl-btn"></label>
          </div>
        </div>

        <div class="font-semibold text-white flex items-center gap-x-2 justify-center">
          Creacion de boton:
          <div class="checkbox-wrapper-10">
            <input :checked="status.button" type="checkbox" id="cb8" class="tgl tgl-flip">
            <label for="cb8" data-tg-on="Ok" data-tg-off="Fallo" class="tgl-btn"></label>
          </div>
        </div>

      </div>

      <div class="flex justify-center mt-6">
        <button id="google-pay-button"></button>
      </div>

      <div class="fixed overflow-auto h-[300px] w-[420px] button-0 text-sm mb-6 bg-stone-900 border-stone-700 border-4 p-2 rounded">
        <span class="text-yellow-400">Respuesta del Servicio Google Pay</span>
        <pre class="text-white">{{ response ? response : 'Realiza un pago para ver la respuesta del servicio' }}</pre>
      </div>
    </div>
  </div>

</template>

<script setup>
import {onMounted, ref} from 'vue';

const request = ref();
const response = ref(null);
const supported = ref(false);
const status = ref({
  script: false,
  payment: false,
  browser: true,
  button: false,
  environment: 'TEST'
});


const loadGooglePay = () => {
  console.log('Cargando script de Google Pay...');
  const script = document.createElement('script');
  script.src = 'https://pay.google.com/gp/p/js/pay.js';
  script.async = true;
  script.onload = onGooglePayLoaded;
  script.onerror = function () {
    console.error('Error al cargar el script de Google Pay.');
  };
  document.head.appendChild(script);
};

const onGooglePayLoaded = () => {
  console.log('Script de Google Pay cargado.');
  status.value.script = true;
  if (window.google && window.google.payments && window.google.payments.api) {
    const paymentsClient = new google.payments.api.PaymentsClient({environment: status.value.environment});

    const paymentDataRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [{
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          allowedCardNetworks: ['AMEX', 'DISCOVER', 'MASTERCARD', 'VISA']
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            gateway: 'example',
            gatewayMerchantId: 'exampleMerchantId'
          }
        }
      }],
      merchantInfo: {
        merchantId: 'BCR2DN4T6M3Y5S4P',
        merchantName: 'Example Merchant'
      },
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPrice: '10.00',
        currencyCode: 'USD',
        countryCode: 'US'
      }
    };

    request.value = paymentDataRequest;

    const button = paymentsClient.createButton({
      onClick: () => onGooglePayButtonClicked(paymentsClient, paymentDataRequest)
    });

    const buttonContainer = document.getElementById('google-pay-button');
    if (buttonContainer) {
      buttonContainer.appendChild(button);
      console.log('Botón de Google Pay añadido al DOM.');
      status.value.button = true;
    } else {
      console.error('No se encontró el contenedor para el botón de Google Pay.');
      status.value.button = false;
    }
  } else {
    status.value.browser = false;
    console.error('Google Pay no está disponible.');
  }
};

const onGooglePayButtonClicked = (paymentsClient, paymentDataRequest) => {
  paymentsClient.loadPaymentData(paymentDataRequest).then(function (paymentData) {
    console.log('Respuesta del pago:', paymentData);
    response.value = JSON.stringify(paymentData, null, 2);
  }).catch(function (err) {
    console.error('Error al cargar los datos de pago:', err);
  });
};

onMounted(() => {
  loadGooglePay();
});
</script>
<style scoped>
/* From Uiverse.io by Dev-MdTuhin */
.checkbox-wrapper-10 .tgl {
  display: none;
}

.checkbox-wrapper-10 .tgl,
.checkbox-wrapper-10 .tgl:after,
.checkbox-wrapper-10 .tgl:before,
.checkbox-wrapper-10 .tgl *,
.checkbox-wrapper-10 .tgl *:after,
.checkbox-wrapper-10 .tgl *:before,
.checkbox-wrapper-10 .tgl + .tgl-btn {
  box-sizing: border-box;
}

.checkbox-wrapper-10 .tgl::-moz-selection,
.checkbox-wrapper-10 .tgl:after::-moz-selection,
.checkbox-wrapper-10 .tgl:before::-moz-selection,
.checkbox-wrapper-10 .tgl *::-moz-selection,
.checkbox-wrapper-10 .tgl *:after::-moz-selection,
.checkbox-wrapper-10 .tgl *:before::-moz-selection,
.checkbox-wrapper-10 .tgl + .tgl-btn::-moz-selection,
.checkbox-wrapper-10 .tgl::selection,
.checkbox-wrapper-10 .tgl:after::selection,
.checkbox-wrapper-10 .tgl:before::selection,
.checkbox-wrapper-10 .tgl *::selection,
.checkbox-wrapper-10 .tgl *:after::selection,
.checkbox-wrapper-10 .tgl *:before::selection,
.checkbox-wrapper-10 .tgl + .tgl-btn::selection {
  background: none;
}

.checkbox-wrapper-10 .tgl + .tgl-btn {
  outline: 0;
  display: block;
  width: 4em;
  height: 2em;
  position: relative;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.checkbox-wrapper-10 .tgl + .tgl-btn:after,
.checkbox-wrapper-10 .tgl + .tgl-btn:before {
  position: relative;
  display: block;
  content: "";
  width: 50%;
  height: 100%;
}

.checkbox-wrapper-10 .tgl + .tgl-btn:after {
  left: 0;
}

.checkbox-wrapper-10 .tgl + .tgl-btn:before {
  display: none;
}

.checkbox-wrapper-10 .tgl:checked + .tgl-btn:after {
  left: 50%;
}

.checkbox-wrapper-10 .tgl-flip + .tgl-btn {
  padding: 2px;
  transition: all 0.2s ease;
  font-family: sans-serif;
  perspective: 100px;
}

.checkbox-wrapper-10 .tgl-flip + .tgl-btn:after,
.checkbox-wrapper-10 .tgl-flip + .tgl-btn:before {
  display: inline-block;
  transition: all 0.4s ease;
  width: 100%;
  text-align: center;
  position: absolute;
  line-height: 2em;
  font-weight: bold;
  color: #fff;
  position: absolute;
  top: 0;
  left: 0;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border-radius: 4px;
}

.checkbox-wrapper-10 .tgl-flip + .tgl-btn:after {
  content: attr(data-tg-on);
  background: #02C66F;
  transform: rotateY(-180deg);
}

.checkbox-wrapper-10 .tgl-flip + .tgl-btn:before {
  background: #FF3A19;
  content: attr(data-tg-off);
}

.checkbox-wrapper-10 .tgl-flip + .tgl-btn:active:before {
  transform: rotateY(-20deg);
}

.checkbox-wrapper-10 .tgl-flip:checked + .tgl-btn:before {
  transform: rotateY(180deg);
}

.checkbox-wrapper-10 .tgl-flip:checked + .tgl-btn:after {
  transform: rotateY(0);
  left: 0;
  background: #7FC6A6;
}

.checkbox-wrapper-10 .tgl-flip:checked + .tgl-btn:active:after {
  transform: rotateY(20deg);
}
</style>