<!--
  Unified Click to Pay (Cybersource UCTP + modo legacy Visa DPA POC).
  Cybersource: https://developer.cybersource.com/docs/cybs/en-us/unified-click-to-pay/developer/all/rest/unified-click-to-pay/uctp-integration-details/uctp-cs-setup.html
  Env: PUBLIC_VISA_UCTP_CLIENT_LIBRARY, PUBLIC_VISA_UCTP_CLIENT_LIBRARY_INTEGRITY, PUBLIC_VISA_UCTP_CAPTURE_CONTEXT;
  legacy: PUBLIC_VISA_UCTP_DPA_ID, PUBLIC_VISA_UCTP_CARD_BRANDS, PUBLIC_VISA_UCTP_DPA_CLIENT_ID, PUBLIC_VISA_UCTP_USE_PRODUCTION
-->
<template>
  <div class="mx-auto max-w-6xl space-y-6">
    <p
      v-if="configWarning"
      class="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
    >
      {{ configWarning }}
    </p>

    <section class="rounded-xl border border-slate-600 bg-slate-800/40 p-4 md:p-6">
      <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Configuración SDK y transacción
      </h2>
      <p class="mb-4 max-w-3xl text-xs text-slate-500">
        Flujo Cybersource: pega <code class="text-slate-400">clientLibrary</code> y (recomendado)
        <code class="text-slate-400">clientLibraryIntegrity</code> de la respuesta de sesiones, y el JWT de capture context
        para <code class="text-slate-400">initialize()</code>. En producción esto lo debe servir el backend.
        El modo «Visa Checkout Widget» mantiene el POC por URL con DPA sin respuesta de sesiones.
      </p>
      <div class="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label class="flex cursor-pointer items-center gap-2">
          <input v-model="sdkLoadMode" type="radio" value="cybersource" class="border-slate-600" />
          <span class="text-slate-300">Cybersource (clientLibrary + capture context)</span>
        </label>
        <label class="flex cursor-pointer items-center gap-2">
          <input v-model="sdkLoadMode" type="radio" value="visa_dpa" class="border-slate-600" />
          <span class="text-slate-300">Visa Checkout Widget (legacy, DPA en URL)</span>
        </label>
      </div>

      <div v-if="sdkLoadMode === 'cybersource'" class="grid gap-4 md:grid-cols-2">
        <label class="block text-sm md:col-span-2">
          <span class="text-slate-400">clientLibrary (URL del script)</span>
          <input
            v-model="clientLibraryUrl"
            type="url"
            class="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100"
            placeholder="https://..."
          />
        </label>
        <label class="block text-sm md:col-span-2">
          <span class="text-slate-400">clientLibraryIntegrity (SRI; recomendado)</span>
          <input
            v-model="clientLibraryIntegrity"
            type="text"
            class="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100"
            placeholder="sha384-..."
          />
        </label>
        <label class="block text-sm md:col-span-2">
          <span class="text-slate-400">Capture context (JWT) para initialize()</span>
          <textarea
            v-model="captureContextJwt"
            rows="3"
            class="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100"
            placeholder="JWT de capture context"
          />
        </label>
        <p class="text-xs text-slate-500 md:col-span-2">
          <code class="text-slate-400">initialize()</code> debe recibir el objeto
          <code class="text-slate-400">captureContext</code> con
          <code class="text-slate-400">header</code>, <code class="text-slate-400">payload</code> y
          <code class="text-slate-400">raw</code> (y en este POC también se repiten en la raíz como en el ejemplo JS).
          El JWT lleva tres segmentos (<code class="text-slate-400">xx.yy.zz</code>); si falla algo interno («ctx»,
          «find»…), marca «segmentos sin decodificar» o desmarca opciones extra de transacción. En esta llamada no se
          envían <code class="text-slate-400">paymentOptions</code> — solo en <code class="text-slate-400">checkout()</code>.
        </p>
        <label class="flex items-center gap-2 text-sm md:col-span-2">
          <input v-model="initializeJwtSegmentsRaw" type="checkbox" class="rounded border-slate-600" />
          <span class="text-slate-300">initialize: segmentos JWT 1 y 2 sin decodificar (base64url)</span>
        </label>
        <label class="flex items-center gap-2 text-sm md:col-span-2">
          <input v-model="includeDpaInInitialize" type="checkbox" class="rounded border-slate-600" />
          <span class="text-slate-300">Incluir dpaTransactionOptions en initialize()</span>
        </label>
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2">
        <label class="block text-sm">
          <span class="text-slate-400">DPA ID</span>
          <input
            v-model="dpaIdInput"
            type="text"
            class="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
            placeholder="Desde registro Visa / .env"
          />
        </label>
        <label class="block text-sm">
          <span class="text-slate-400">Card brands (multiselect)</span>
          <select
            v-model="selectedCardBrands"
            multiple
            class="mt-1 min-h-24 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
          >
            <option v-for="brand in CARD_BRAND_OPTIONS" :key="brand" :value="brand">
              {{ brand }}
            </option>
          </select>
        </label>
        <label class="block text-sm md:col-span-2">
          <span class="text-slate-400">DPA Client ID (opcional, partner multi-merchant)</span>
          <input
            v-model="dpaClientIdInput"
            type="text"
            class="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
          />
        </label>
        <label class="flex items-center gap-2 text-sm md:col-span-2">
          <input v-model="useProduction" type="checkbox" class="rounded border-slate-600" />
          <span class="text-slate-300">Usar URL de producción del SDK (sin sandbox)</span>
        </label>
      </div>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <label class="block text-sm">
          <span class="text-slate-400">Email (consumer identity)</span>
          <input
            v-model="consumerEmail"
            type="email"
            class="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
            placeholder="usuario@ejemplo.com"
          />
        </label>
        <label class="block text-sm">
          <span class="text-slate-400">Merchant order ID</span>
          <input
            v-model="merchantOrderId"
            type="text"
            class="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
          />
        </label>
        <label class="block text-sm">
          <span class="text-slate-400">Monto</span>
          <input
            v-model="transactionAmount"
            type="text"
            class="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
          />
        </label>
        <label class="block text-sm">
          <span class="text-slate-400">Moneda (ISO)</span>
          <select
            v-model="transactionCurrencyCode"
            class="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
          >
            <option v-for="currency in CURRENCY_OPTIONS" :key="currency" :value="currency">
              {{ currency }}
            </option>
          </select>
        </label>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-500 disabled:opacity-50"
          :disabled="loadingSdk || !canLoadSdk"
          @click="loadSdk"
        >
          {{ sdkReady ? 'SDK cargado' : loadingSdk ? 'Cargando SDK…' : 'Cargar SDK' }}
        </button>
        <button
          type="button"
          class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          :disabled="!sdkReady || initializing"
          @click="runInitialize"
        >
          {{ initializing ? 'initialize()…' : 'initialize()' }}
        </button>
        <button
          type="button"
          class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          :disabled="!initialized || gettingCards"
          @click="runGetCards"
        >
          {{ gettingCards ? 'getCards()…' : 'getCards()' }}
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-500 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          :disabled="!vsdk || !initialized || unbinding"
          @click="runUnbindAppInstance"
        >
          {{ unbinding ? 'unbindAppInstance()…' : 'unbindAppInstance()' }}
        </button>
      </div>
      <p class="mt-2 text-xs text-slate-500">
        Orden: cargar SDK → initialize() → getCards(). Si getCards devuelve PENDING_CONSUMER_IDV, introduce el OTP y
        vuelve a pulsar getCards() (o usa initiateIdentityValidation con consumerIdentity). Verificación de JWT de
        checkout y MLE van en backend (no en este POC).
      </p>
    </section>

    <!-- PENDING_CONSUMER_IDV -->
    <section
      v-if="lastCardsResponse && lastActionCode === 'PENDING_CONSUMER_IDV'"
      class="rounded-xl border border-cyan-600/50 bg-cyan-950/30 p-4 md:p-6"
    >
      <h2 class="mb-2 text-sm font-semibold text-cyan-300">Identidad pendiente (PENDING_CONSUMER_IDV)</h2>
      <p v-if="maskedValidationChannel" class="mb-2 text-sm text-slate-300">
        Canal enmascarado: {{ maskedValidationChannel }}
      </p>
      <div v-if="supportedChannels.length" class="mb-3 text-sm text-slate-400">
        <span>Canales soportados (initiateIdentityValidation):</span>
        <ul class="mt-1 list-inside list-disc">
          <li v-for="(ch, i) in supportedChannels" :key="i">{{ JSON.stringify(ch) }}</li>
        </ul>
      </div>
      <label class="block text-sm">
        <span class="text-slate-400">OTP / validationData</span>
        <input
          v-model="validationOtp"
          type="text"
          class="mt-1 w-full max-w-md rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
          placeholder="Código recibido"
        />
      </label>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
          :disabled="!initialized || gettingCards || !validationOtp.trim()"
          @click="runGetCardsWithOtp"
        >
          getCards() con validationData
        </button>
        <button
          type="button"
          class="rounded-lg border border-cyan-500/60 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-900/40 disabled:opacity-50"
          :disabled="!vsdk || initiatingIdv"
          @click="runInitiateIdentityValidation"
        >
          {{ initiatingIdv ? 'initiateIdentityValidation()…' : 'initiateIdentityValidation()' }}
        </button>
      </div>
      <label v-if="supportedChannels.length" class="mt-3 block text-sm">
        <span class="text-slate-400">requestedValidationChannelId (opcional)</span>
        <input
          v-model="requestedValidationChannelId"
          type="text"
          class="mt-1 w-full max-w-md rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
        />
      </label>
    </section>

    <!-- SUCCESS: card list -->
    <section
      v-if="lastActionCode === 'SUCCESS' && flatMaskedCards.length"
      class="rounded-xl border border-emerald-600/50 bg-emerald-950/20 p-4 md:p-6"
    >
      <h2 class="mb-4 text-sm font-semibold text-emerald-300">Tarjetas (SUCCESS)</h2>
      <ul class="space-y-3">
        <li
          v-for="card in flatMaskedCards"
          :key="card.srcDigitalCardId"
          class="flex flex-wrap items-stretch justify-between gap-3 rounded-xl border border-slate-600/80 bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-3 shadow-lg shadow-black/20 ring-1 ring-white/5 transition hover:border-emerald-500/30"
        >
          <div class="flex min-w-0 flex-1 items-center gap-4">
            <div
              class="relative h-[3.25rem] w-[5.2rem] shrink-0 overflow-hidden rounded-lg bg-slate-800 shadow-md ring-1 ring-slate-600/80"
            >
              <img
                v-if="card.artUri && !failedCardArt[card.srcDigitalCardId]"
                :src="card.artUri"
                :alt="cardAltText(card)"
                class="h-full w-full object-cover"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                @error="onCardArtError(card.srcDigitalCardId)"
              />
              <div
                v-else
                class="flex h-full w-full flex-col items-center justify-center bg-slate-800 px-1 text-center"
              >
                <span class="text-[10px] font-semibold uppercase leading-tight text-slate-400">
                  {{ cardNetworkLabel(card) }}
                </span>
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-semibold text-slate-100">
                {{ card.descriptorName || card.presentationName || 'Tarjeta' }}
              </div>
              <div class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
                <span class="font-mono tracking-wide text-slate-300">···· {{ card.panLastFour }}</span>
                <span v-if="cardExpLabel(card)" class="text-slate-500">Cad. {{ cardExpLabel(card) }}</span>
                <span
                  v-if="card.paymentCardType"
                  class="rounded bg-slate-700/80 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-300"
                >
                  {{ card.paymentCardType }}
                </span>
                <span v-if="card.countryCode" class="text-slate-500">{{ card.countryCode }}</span>
              </div>
              <div v-if="card.tokenLastFour && card.tokenLastFour !== card.panLastFour" class="mt-1 text-[11px] text-slate-500">
                Token ···· {{ card.tokenLastFour }}
              </div>
              <div
                v-if="card.pendingEvents?.length"
                class="mt-1 flex flex-wrap gap-1"
              >
                <span
                  v-for="ev in card.pendingEvents"
                  :key="ev"
                  class="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-200/90"
                >
                  {{ ev }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex shrink-0 items-center">
            <button
              type="button"
              class="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500 disabled:opacity-50"
              :disabled="checkingOut"
              @click="runCheckout(card.srcDigitalCardId)"
            >
              checkout()
            </button>
          </div>
        </li>
      </ul>
      <p class="mt-4 text-xs text-slate-500">
        El enrolamiento / CVM de Visa se abre siempre en ventana emergente (<code class="text-slate-400">windowRef</code>).
        El resultado operativo lo devuelve la promesa de <code class="text-slate-400">checkout()</code>.
      </p>
      <label class="mt-2 flex items-center gap-2 text-sm">
        <span class="text-slate-400">payloadTypeIndicatorCheckout</span>
        <select
          v-model="payloadTypeIndicatorCheckout"
          class="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-slate-100"
        >
          <option value="FULL">FULL</option>
          <option value="SUMMARY">SUMMARY</option>
        </select>
      </label>
    </section>

    <!-- ADD_CARD -->
    <section
      v-if="lastActionCode === 'ADD_CARD'"
      class="rounded-xl border border-orange-600/50 bg-orange-950/20 p-4 md:p-6"
    >
      <h2 class="mb-2 text-sm font-semibold text-orange-300">Alta de tarjeta (ADD_CARD)</h2>
      <p class="mb-3 text-sm text-slate-400">
        checkout() requiere <code class="text-orange-200">encryptedCard</code> (JWE) y normalmente consumer/compliance
        según onboarding. Pega un JWE generado en tu entorno certificado o backend.
      </p>
      <label class="block text-sm">
        <span class="text-slate-400">encryptedCard (JWE string)</span>
        <textarea
          v-model="encryptedCardJwe"
          rows="4"
          class="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100"
        />
      </label>
      <p class="mb-2 text-xs text-slate-500">
        Misma lógica de <code class="text-slate-400">windowRef</code> en pop-up que en tarjetas guardadas.
      </p>
      <button
        type="button"
        class="mt-3 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50"
        :disabled="checkingOut || !encryptedCardJwe.trim() || !initialized"
        @click="runCheckoutAddCard"
      >
        checkout() con encryptedCard
      </button>
    </section>

    <!-- ERROR from getCards -->
    <section
      v-if="lastActionCode === 'ERROR'"
      class="rounded-xl border border-red-600/50 bg-red-950/20 p-4 md:p-6"
    >
      <h2 class="mb-2 text-sm font-semibold text-red-300">Error en getCards</h2>
      <pre class="overflow-x-auto text-xs text-slate-300">{{ JSON.stringify(lastCardsResponse, null, 2) }}</pre>
    </section>

    <section
      v-if="lastCheckoutDisplay"
      class="rounded-xl border border-blue-500/40 bg-slate-800/60 p-4 md:p-6"
    >
      <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-300">Último resultado de checkout()</h2>
      <p class="mb-3 text-xs text-slate-400">
        Respuesta del SDK en el cliente (<code class="text-slate-300">actionCode</code>,
        <code class="text-slate-300">checkoutResponse</code>, <code class="text-slate-300">bindingStatus</code>). El
        registro detallado sigue abajo en «Registro API».
      </p>
      <div
        v-if="lastCheckoutDisplay.error"
        class="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-200"
      >
        <span class="font-semibold">{{ lastCheckoutDisplay.method }}</span> — {{ lastCheckoutDisplay.error }}
      </div>
      <pre
        v-else
        class="max-h-64 overflow-auto rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200"
      >{{ lastCheckoutDisplay.body }}</pre>
      <p class="mt-2 text-[11px] text-slate-500">{{ lastCheckoutDisplay.timestamp }}</p>
    </section>

    <section class="rounded-xl border border-slate-600 bg-slate-800/40 p-4 md:p-6">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Registro API (request / response)</h2>
      <div class="max-h-96 overflow-y-auto rounded border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-300">
        <div v-if="!apiLog.length" class="text-slate-500">Sin llamadas aún.</div>
        <div v-for="(entry, idx) in apiLog" :key="idx" class="mb-4 border-b border-slate-800 pb-4 last:mb-0 last:border-0 last:pb-0">
          <div class="font-semibold text-cyan-400">{{ entry.method }}</div>
          <div class="mt-1 text-slate-500">Request</div>
          <pre class="whitespace-pre-wrap break-all">{{ entry.request }}</pre>
          <div v-if="entry.error" class="mt-2 text-red-400">Error: {{ entry.error }}</div>
          <template v-else>
            <div class="mt-2 text-slate-500">Response</div>
            <pre class="whitespace-pre-wrap break-all">{{ entry.response }}</pre>
          </template>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const env = import.meta.env;

/** DPA de ejemplo en documentación Visa sandbox (puedes sobrescribir con PUBLIC_VISA_UCTP_DPA_ID). */
const DEFAULT_DPA_ID = 'JRG47J3KFNIQ7ASQN5DB21NO7TV3uh8_vx1lvzm7Kh8jQahhw';
const DEFAULT_EMAIL = 'juanpapabon@gmail.com';
const CARD_BRAND_OPTIONS = ['visa', 'mastercard', 'amex', 'discover'] as const;
const CURRENCY_OPTIONS = ['USD', 'EUR', 'COP', 'MXN', 'AUD'] as const;
const DEFAULT_AMOUNT_BY_CURRENCY: Record<string, string> = {
  USD: '99.95',
  EUR: '89.95',
  COP: '400000',
  MXN: '1800',
  AUD: '149.95',
};

const dpaIdInput = ref(env.PUBLIC_VISA_UCTP_DPA_ID?.trim() || DEFAULT_DPA_ID);
const selectedCardBrands = ref<string[]>(
  (env.PUBLIC_VISA_UCTP_CARD_BRANDS ?? 'visa,mastercard')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter((v) => CARD_BRAND_OPTIONS.includes(v as (typeof CARD_BRAND_OPTIONS)[number])),
);
const dpaClientIdInput = ref(env.PUBLIC_VISA_UCTP_DPA_CLIENT_ID ?? '');
const useProduction = ref(env.PUBLIC_VISA_UCTP_USE_PRODUCTION === 'true');

type SdkLoadMode = 'cybersource' | 'visa_dpa';
const sdkLoadMode = ref<SdkLoadMode>('cybersource');
const clientLibraryUrl = ref((env.PUBLIC_VISA_UCTP_CLIENT_LIBRARY ?? '').trim());
const clientLibraryIntegrity = ref((env.PUBLIC_VISA_UCTP_CLIENT_LIBRARY_INTEGRITY ?? '').trim());
const captureContextJwt = ref((env.PUBLIC_VISA_UCTP_CAPTURE_CONTEXT ?? '').trim());
const includeDpaInInitialize = ref(true);
const initializeJwtSegmentsRaw = ref(false);

const consumerEmail = ref(DEFAULT_EMAIL);
const merchantOrderId = ref(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
const transactionCurrencyCode = ref('USD');
const transactionAmount = ref(DEFAULT_AMOUNT_BY_CURRENCY[transactionCurrencyCode.value] ?? '99.95');

const loadingSdk = ref(false);
const sdkReady = ref(false);
const initializing = ref(false);
const initialized = ref(false);
const gettingCards = ref(false);
const initiatingIdv = ref(false);
const checkingOut = ref(false);
const unbinding = ref(false);

const validationOtp = ref('');
const requestedValidationChannelId = ref('');
const encryptedCardJwe = ref('');
const payloadTypeIndicatorCheckout = ref<'FULL' | 'SUMMARY'>('FULL');

/** Imágenes de card art que fallan al cargar (CORS u origen). */
const failedCardArt = ref<Record<string, boolean>>({});

const UCTP_CHECKOUT_POPUP_NAME = 'VisaUctpCheckout';

const lastCardsResponse = ref<Record<string, unknown> | null>(null);
const apiLog = ref<{ method: string; request: string; response?: string; error?: string }[]>([]);

type LastCheckoutDisplay = {
  method: string;
  timestamp: string;
  body: string;
  error?: string;
};

const lastCheckoutDisplay = ref<LastCheckoutDisplay | null>(null);

watch(lastCardsResponse, () => {
  failedCardArt.value = {};
});
watch(transactionCurrencyCode, (currency) => {
  transactionAmount.value = DEFAULT_AMOUNT_BY_CURRENCY[currency] ?? '99.95';
});

let sdkScriptSrc = '';
let sdkScriptIntegrity = '';

const configWarning = computed(() => {
  if (sdkLoadMode.value === 'cybersource') {
    if (!clientLibraryUrl.value.trim()) {
      return 'Indica clientLibrary (URL del script) desde la API de sesiones Cybersource o PUBLIC_VISA_UCTP_CLIENT_LIBRARY.';
    }
    return '';
  }
  if (!dpaIdInput.value.trim()) {
    return 'Configura PUBLIC_VISA_UCTP_DPA_ID en .env o introduce DPA ID arriba para cargar el SDK.';
  }
  return '';
});

const canLoadSdk = computed(() => {
  if (sdkLoadMode.value === 'cybersource') {
    return Boolean(clientLibraryUrl.value.trim());
  }
  return Boolean(dpaIdInput.value.trim() && selectedCardBrands.value.length);
});

const vsdk = computed(() => (typeof window !== 'undefined' ? window.VSDK : undefined));

const lastActionCode = computed(() => {
  const r = lastCardsResponse.value;
  if (!r || typeof r.actionCode !== 'string') return null;
  return r.actionCode;
});

const maskedValidationChannel = computed(() => {
  const r = lastCardsResponse.value;
  if (!r) return '';
  const m = r.maskedValidationChannel;
  return typeof m === 'string' ? m : '';
});

const supportedChannels = computed(() => {
  const r = lastCardsResponse.value;
  if (!r || !Array.isArray(r.supportedValidationChannels)) return [];
  return r.supportedValidationChannels as unknown[];
});

type FlatCard = {
  srcDigitalCardId: string;
  panLastFour?: string;
  descriptorName?: string;
  presentationName?: string;
  artUri?: string;
  paymentCardDescriptor?: string;
  paymentCardType?: string;
  panExpirationMonth?: string;
  panExpirationYear?: string;
  tokenLastFour?: string;
  countryCode?: string;
  pendingEvents?: string[];
};

function onCardArtError(srcDigitalCardId: string): void {
  failedCardArt.value = { ...failedCardArt.value, [srcDigitalCardId]: true };
}

function cardAltText(card: FlatCard): string {
  const name = card.descriptorName || card.presentationName || 'Tarjeta';
  return `${name} ····${card.panLastFour || ''}`;
}

function cardExpLabel(card: FlatCard): string {
  const m = card.panExpirationMonth;
  const y = card.panExpirationYear;
  if (!m || !y) return '';
  const yy = y.length === 4 ? y.slice(-2) : y;
  return `${m.padStart(2, '0')}/${yy}`;
}

function cardNetworkLabel(card: FlatCard): string {
  const d = (card.paymentCardDescriptor || '').toLowerCase();
  if (d.includes('visa')) return 'Visa';
  if (d.includes('master')) return 'MC';
  if (d.includes('amex')) return 'Amex';
  return d ? d.slice(0, 8) : 'CARD';
}

const flatMaskedCards = computed((): FlatCard[] => {
  const r = lastCardsResponse.value;
  if (!r || !Array.isArray(r.profiles)) return [];
  const out: FlatCard[] = [];
  for (const p of r.profiles as Record<string, unknown>[]) {
    const masked = p?.maskedCards;
    if (!Array.isArray(masked)) continue;
    for (const c of masked as Record<string, unknown>[]) {
      const id = c?.srcDigitalCardId;
      if (typeof id !== 'string') continue;
      const digital = c?.digitalCardData as Record<string, unknown> | undefined;
      const descriptorName =
        typeof digital?.descriptorName === 'string' ? digital.descriptorName : undefined;
      const presentationName =
        typeof digital?.presentationName === 'string' ? digital.presentationName : undefined;
      const artUri = typeof digital?.artUri === 'string' ? digital.artUri : undefined;
      const pending = digital?.pendingEvents;
      const pendingEvents = Array.isArray(pending)
        ? pending.filter((x): x is string => typeof x === 'string')
        : undefined;
      out.push({
        srcDigitalCardId: id,
        panLastFour: typeof c.panLastFour === 'string' ? c.panLastFour : undefined,
        descriptorName,
        presentationName,
        artUri,
        paymentCardDescriptor:
          typeof c.paymentCardDescriptor === 'string' ? c.paymentCardDescriptor : undefined,
        paymentCardType: typeof c.paymentCardType === 'string' ? c.paymentCardType : undefined,
        panExpirationMonth:
          typeof c.panExpirationMonth === 'string' ? c.panExpirationMonth : undefined,
        panExpirationYear: typeof c.panExpirationYear === 'string' ? c.panExpirationYear : undefined,
        tokenLastFour: typeof c.tokenLastFour === 'string' ? c.tokenLastFour : undefined,
        countryCode: typeof c.countryCode === 'string' ? c.countryCode : undefined,
        pendingEvents,
      });
    }
  }
  return out;
});

/**
 * Evita pasar referencias `Window` (sobre todo pop-up ya navegado a otro origen) a `JSON.stringify`:
 * el motor puede intentar leer `toJSON` y lanzar SecurityError, rompiendo `pushLog` y el log de checkout.
 */
function sanitizeForApiLog(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (typeof Window !== 'undefined') {
    try {
      if (value instanceof Window) {
        return typeof window !== 'undefined' && value === window ? '[Window:main]' : '[Window:popup]';
      }
    } catch {
      return '[Window]';
    }
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeForApiLog);
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    try {
      if (typeof Window !== 'undefined') {
        try {
          if (v instanceof Window) {
            out[k] = typeof window !== 'undefined' && v === window ? '[Window:main]' : '[Window:popup]';
            continue;
          }
        } catch {
          out[k] = '[Window]';
          continue;
        }
      }
      out[k] = sanitizeForApiLog(v);
    } catch {
      out[k] = '[unserializable]';
    }
  }
  return out;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(sanitizeForApiLog(value), null, 2);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return `{"_serializeError":${JSON.stringify(msg)}}`;
  }
}

/**
 * Ventana dedicada para checkout (windowRef). Sin noopener: el SDK debe poder usar la referencia.
 * @see https://developer.visa.com/capabilities/visa-secure-remote-commerce/docs-visa-digital-terminal-js-reference — checkout windowRef
 */
function openUctpCheckoutPopup(): Window | null {
  const w = Math.min(640, window.screen.availWidth - 80);
  const h = Math.min(800, window.screen.availHeight - 80);
  const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
  const features = `popup=yes,width=${w},height=${h},left=${Math.round(left)},top=${Math.round(top)},scrollbars=yes,resizable=yes`;
  const popup = window.open('about:blank', UCTP_CHECKOUT_POPUP_NAME, features);
  if (popup) {
    try {
      popup.document.title = 'Click to Pay';
      popup.focus();
    } catch {
      /* cross-origin or restricted */
    }
  }
  return popup;
}

/**
 * Resuelve windowRef para checkout. Si abrimos pop-up propio, devolvemos esa ventana en `popupToClose`.
 * La respuesta de negocio llega siempre vía la promesa de `checkout()`, no leyendo el DOM del pop-up.
 */
function resolveCheckoutWindowRef(): {
  extras: Record<string, unknown>;
  popupToClose: Window | null;
} {
  const popup = openUctpCheckoutPopup();
  if (!popup) {
    throw new Error('No se pudo abrir la ventana emergente (pop-up bloqueado). Permite pop-ups para este sitio.');
  }
  return { extras: { windowRef: popup }, popupToClose: popup };
}

function tryCloseCheckoutPopup(popup: Window | null): void {
  if (!popup) return;
  try {
    if (!popup.closed) {
      popup.close();
    }
  } catch {
    /* ignore — políticas del navegador o origen cruzado */
  }
}

function pushLog(method: string, request: unknown, response?: unknown, error?: string) {
  try {
    apiLog.value = [
      {
        method,
        request: typeof request === 'string' ? request : safeStringify(request),
        response: error ? undefined : response === undefined ? undefined : safeStringify(response),
        error,
      },
      ...apiLog.value,
    ].slice(0, 40);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    apiLog.value = [
      {
        method,
        request: typeof request === 'string' ? request : '[request: error al serializar]',
        response: undefined,
        error: `pushLog: ${msg}`,
      },
      ...apiLog.value,
    ].slice(0, 40);
  }
}

function buildSdkUrl(): string {
  const dpaId = encodeURIComponent(dpaIdInput.value.trim());
  const cardBrands = encodeURIComponent(selectedCardBrands.value.join(','));
  const base = useProduction.value
    ? 'https://secure.checkout.visa.com/checkout-widget/resources/js/integration/v2/sdk.js'
    : 'https://sandbox.secure.checkout.visa.com/checkout-widget/resources/js/integration/v2/sdk.js';
  let url = `${base}?dpaId=${dpaId}&cardBrands=${cardBrands}`;
  if (dpaClientIdInput.value.trim()) {
    url += `&dpaClientId=${encodeURIComponent(dpaClientIdInput.value.trim())}`;
  }
  return url;
}

/**
 * Opciones para VSDK checkout/getCards típicos — incluye `paymentOptions`.
 * Para `initialize()` en flujo CyberSource suele mejor **no** incluir paymentOptions para evitar
 * rutas internas que esperan listas desde el JWT (errores tipo «reading 'find'»).
 */
function buildDpaTransactionOptions(includePaymentOptions = true): Record<string, unknown> {
  const options: Record<string, unknown> = {
    transactionAmount: {
      transactionAmount: transactionAmount.value,
      transactionCurrencyCode: transactionCurrencyCode.value,
    },
    dpaBillingPreference: 'NONE',
    dpaAcceptedBillingCountries: ['US', 'CA'],
    consumerNationalIdentifierRequested: false,
    merchantCategoryCode: '4829',
    merchantCountryCode: 'US',
    merchantOrderId: merchantOrderId.value,
    dpaLocale: 'en_US',
  };
  if (includePaymentOptions) {
    options.paymentOptions = [
      {
        dpaDynamicDataTtlMinutes: 2,
        dynamicDataType: 'CARD_APPLICATION_CRYPTOGRAM_LONG_FORM',
      },
    ];
  }
  return options;
}

function buildConsumerIdentity(): Record<string, string> {
  return {
    identityProvider: 'SRC',
    identityType: 'EMAIL_ADDRESS',
    identityValue: consumerEmail.value.trim(),
  };
}

/** Base64url JWT segment → UTF-8 string (CyberSource suele esperar header/payload decodificados). */
function decodeJwtSegment(segment: string): string {
  const pad = '='.repeat((4 - (segment.length % 4)) % 4);
  const b64 = segment.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

/**
 * Construye el objeto que documenta CyberSource/VSDK para initialize():
 * `{ header, payload, raw }` con `raw` = JWT completo.
 */
function buildCybersourceInitializeFromJwt(trimmedJwt: string): { header: string; payload: string; raw: string } {
  const parts = trimmedJwt.split('.').filter(Boolean);
  if (parts.length < 3) {
    throw new Error(`JWT inválido: esperados al menos 3 segmentos (.), encontrados ${parts.length}.`);
  }
  const raw = trimmedJwt;
  if (initializeJwtSegmentsRaw.value) {
    return { header: parts[0], payload: parts[1], raw };
  }
  try {
    return {
      header: decodeJwtSegment(parts[0]),
      payload: decodeJwtSegment(parts[1]),
      raw,
    };
  } catch (e: unknown) {
    const hint = e instanceof Error ? e.message : String(e);
    throw new Error(`Error decodificando header/payload del JWT: ${hint}`);
  }
}

function loadSdk(): void {
  if (!canLoadSdk.value || loadingSdk.value) return;

  if (sdkLoadMode.value === 'cybersource') {
    const url = clientLibraryUrl.value.trim();
    const integrity = clientLibraryIntegrity.value.trim();
    if (sdkScriptSrc === url && sdkScriptIntegrity === integrity && window.VSDK) {
      sdkReady.value = true;
      return;
    }
    loadingSdk.value = true;
    sdkScriptSrc = url;
    sdkScriptIntegrity = integrity;
    const existing = document.querySelector(`script[data-visa-uctp-sdk="1"]`);
    if (existing) existing.remove();
    delete window.VSDK;
    sdkReady.value = false;
    initialized.value = false;

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.crossOrigin = 'anonymous';
    if (integrity) {
      script.integrity = integrity;
    }
    script.dataset.visaUctpSdk = '1';
    script.onload = () => {
      loadingSdk.value = false;
      sdkReady.value = Boolean(window.VSDK);
      if (!window.VSDK) {
        pushLog('loadSdk', { url, integritySet: Boolean(integrity) }, undefined, 'VSDK no disponible tras cargar el script');
      } else {
        pushLog('loadSdk', { url, integritySet: Boolean(integrity) }, { ok: true, note: 'window.VSDK listo' });
      }
    };
    script.onerror = () => {
      loadingSdk.value = false;
      sdkReady.value = false;
      pushLog('loadSdk', { url, integritySet: Boolean(integrity) }, undefined, 'Error cargando script SDK');
    };
    document.head.appendChild(script);
    return;
  }

  const url = buildSdkUrl();
  if (sdkScriptSrc === url && sdkScriptIntegrity === '' && window.VSDK) {
    sdkReady.value = true;
    return;
  }
  loadingSdk.value = true;
  sdkScriptSrc = url;
  sdkScriptIntegrity = '';
  const existing = document.querySelector(`script[data-visa-uctp-sdk="1"]`);
  if (existing) existing.remove();
  delete window.VSDK;
  sdkReady.value = false;
  initialized.value = false;

  const script = document.createElement('script');
  script.src = url;
  script.async = true;
  script.dataset.visaUctpSdk = '1';
  script.onload = () => {
    loadingSdk.value = false;
    sdkReady.value = Boolean(window.VSDK);
    if (!window.VSDK) pushLog('loadSdk', { url }, undefined, 'VSDK no disponible tras cargar el script');
    else pushLog('loadSdk', { url }, { ok: true, note: 'window.VSDK listo' });
  };
  script.onerror = () => {
    loadingSdk.value = false;
    sdkReady.value = false;
    pushLog('loadSdk', { url }, undefined, 'Error cargando script SDK');
  };
  document.head.appendChild(script);
}

async function runInitialize(): Promise<void> {
  const V = window.VSDK;
  if (!V) return;
  initializing.value = true;

  if (sdkLoadMode.value === 'cybersource') {
    const jwt = captureContextJwt.value.trim();
    if (!jwt) {
      initializing.value = false;
      const msg = 'Falta el JWT de capture context (textarea o PUBLIC_VISA_UCTP_CAPTURE_CONTEXT).';
      pushLog('initialize', { mode: 'cybersource' }, undefined, msg);
      return;
    }
    let initParts: { header: string; payload: string; raw: string };
    try {
      initParts = buildCybersourceInitializeFromJwt(jwt);
    } catch (e: unknown) {
      initializing.value = false;
      const msg = e instanceof Error ? e.message : String(e);
      pushLog('initialize', { mode: 'cybersource', parseError: true }, undefined, msg);
      return;
    }
    const captureCtx = {
      header: initParts.header,
      payload: initParts.payload,
      raw: initParts.raw,
    };
    /**
     * Algunos builds leen sólo `captureContext` (Java API spec); otros el ejemplo JS en raíz
     * (`header` / `payload` / `raw`). Enviamos ambos sin duplicar referencias nuevas.
     */
    const req: Record<string, unknown> = {
      captureContext: captureCtx,
      header: captureCtx.header,
      payload: captureCtx.payload,
      raw: captureCtx.raw,
    };
    if (includeDpaInInitialize.value) {
      req.dpaTransactionOptions = buildDpaTransactionOptions(false);
    }
    const logSafe: Record<string, unknown> = {
      captureContext: {
        header: '[redacted]',
        payload: '[redacted]',
        raw: '[JWT redacted]',
      },
      header: '[redacted]',
      payload: '[redacted]',
      raw: '[JWT redacted]',
    };
    if (includeDpaInInitialize.value) {
      logSafe.dpaTransactionOptions = buildDpaTransactionOptions(false);
    }
    logSafe.segmentFormat = initializeJwtSegmentsRaw.value ? 'base64url_sin_decodificar' : 'decoded_utf8';
    try {
      await V.initialize(req);
      initialized.value = true;
      pushLog('initialize', logSafe, { ok: true });
    } catch (e: unknown) {
      initialized.value = false;
      const msg = e instanceof Error ? e.message : String(e);
      pushLog('initialize', logSafe, undefined, msg);
    } finally {
      initializing.value = false;
    }
    return;
  }

  const req = { dpaTransactionOptions: buildDpaTransactionOptions() };
  try {
    await V.initialize(req);
    initialized.value = true;
    pushLog('initialize', req, { ok: true });
  } catch (e: unknown) {
    initialized.value = false;
    const msg = e instanceof Error ? e.message : String(e);
    pushLog('initialize', req, undefined, msg);
  } finally {
    initializing.value = false;
  }
}

async function runGetCards(): Promise<void> {
  const V = window.VSDK;
  if (!V || !initialized.value) return;
  gettingCards.value = true;
  const consumerIdentity = buildConsumerIdentity();
  const req = { consumerIdentity };
  try {
    const res = await V.getCards(req);
    lastCardsResponse.value = res as Record<string, unknown>;
    pushLog('getCards', req, res);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    lastCardsResponse.value = { actionCode: 'ERROR', error: msg };
    pushLog('getCards', req, undefined, msg);
  } finally {
    gettingCards.value = false;
  }
}

async function runGetCardsWithOtp(): Promise<void> {
  const V = window.VSDK;
  if (!V || !initialized.value) return;
  gettingCards.value = true;
  const consumerIdentity = buildConsumerIdentity();
  const req = { consumerIdentity, validationData: validationOtp.value.trim() };
  try {
    const res = await V.getCards(req);
    lastCardsResponse.value = res as Record<string, unknown>;
    pushLog('getCards (con validationData)', req, res);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    lastCardsResponse.value = { actionCode: 'ERROR', error: msg };
    pushLog('getCards (con validationData)', req, undefined, msg);
  } finally {
    gettingCards.value = false;
  }
}

async function runInitiateIdentityValidation(): Promise<void> {
  const V = window.VSDK;
  if (!V?.initiateIdentityValidation) {
    pushLog('initiateIdentityValidation', {}, undefined, 'Método no disponible en este SDK');
    return;
  }
  initiatingIdv.value = true;
  const consumerIdentity = buildConsumerIdentity();
  const req: Record<string, unknown> = { consumerIdentity };
  if (requestedValidationChannelId.value.trim()) {
    req.requestedValidationChannelId = requestedValidationChannelId.value.trim();
  }
  try {
    const res = await V.initiateIdentityValidation(req);
    pushLog('initiateIdentityValidation', req, res);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    pushLog('initiateIdentityValidation', req, undefined, msg);
  } finally {
    initiatingIdv.value = false;
  }
}

async function runUnbindAppInstance(): Promise<void> {
  const V = window.VSDK;
  if (!V?.unbindAppInstance) {
    pushLog('unbindAppInstance', {}, undefined, 'Método no disponible en este SDK');
    return;
  }
  unbinding.value = true;
  try {
    const res = await V.unbindAppInstance();
    pushLog('unbindAppInstance', {}, res ?? { ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    pushLog('unbindAppInstance', {}, undefined, msg);
  } finally {
    unbinding.value = false;
  }
}

function setLastCheckoutPanel(method: string, res: unknown, err?: string): void {
  const ts = new Date().toISOString();
  if (err) {
    lastCheckoutDisplay.value = { method, timestamp: ts, body: '', error: err };
    return;
  }
  lastCheckoutDisplay.value = {
    method,
    timestamp: ts,
    body: safeStringify(res),
  };
}

async function runCheckout(srcDigitalCardId: string): Promise<void> {
  const V = window.VSDK;
  if (!V || !initialized.value) return;
  checkingOut.value = true;
  lastCheckoutDisplay.value = null;
  const req: Record<string, unknown> = {
    srcDigitalCardId,
    dpaTransactionOptions: buildDpaTransactionOptions(),
    payloadTypeIndicatorCheckout: payloadTypeIndicatorCheckout.value,
  };
  let popupToClose: Window | null = null;
  try {
    const { extras, popupToClose: p } = resolveCheckoutWindowRef();
    popupToClose = p;
    Object.assign(req, extras);
    const res = await V.checkout(req);
    pushLog('checkout', { ...req }, res);
    setLastCheckoutPanel('checkout', res);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    pushLog('checkout', { ...req }, undefined, msg);
    setLastCheckoutPanel('checkout', null, msg);
  } finally {
    tryCloseCheckoutPopup(popupToClose);
    checkingOut.value = false;
  }
}

async function runCheckoutAddCard(): Promise<void> {
  const V = window.VSDK;
  if (!V || !initialized.value) return;
  checkingOut.value = true;
  lastCheckoutDisplay.value = null;
  const req: Record<string, unknown> = {
    encryptedCard: encryptedCardJwe.value.trim(),
    dpaTransactionOptions: buildDpaTransactionOptions(),
    payloadTypeIndicatorCheckout: payloadTypeIndicatorCheckout.value,
  };
  let popupToClose: Window | null = null;
  try {
    const { extras, popupToClose: p } = resolveCheckoutWindowRef();
    popupToClose = p;
    Object.assign(req, extras);
    const res = await V.checkout(req);
    pushLog('checkout (ADD_CARD / encryptedCard)', { ...req }, res);
    setLastCheckoutPanel('checkout (ADD_CARD / encryptedCard)', res);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    pushLog('checkout (ADD_CARD / encryptedCard)', { ...req }, undefined, msg);
    setLastCheckoutPanel('checkout (ADD_CARD / encryptedCard)', null, msg);
  } finally {
    tryCloseCheckoutPopup(popupToClose);
    checkingOut.value = false;
  }
}

</script>
