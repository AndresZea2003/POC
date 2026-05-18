<!--
  Unified Click to Pay (Cybersource UCTP POC). Redes: Visa + Mastercard (AMEX fuera de alcance por ahora).
  Cybersource: https://developer.cybersource.com/docs/cybs/en-us/unified-click-to-pay/developer/all/rest/unified-click-to-pay/uctp-integration-details/uctp-cs-setup.html
  Env: PUBLIC_VISA_UCTP_CLIENT_LIBRARY, PUBLIC_VISA_UCTP_CLIENT_LIBRARY_INTEGRITY, PUBLIC_VISA_UCTP_CAPTURE_CONTEXT;
-->
<template>
  <div class="mx-auto max-w-6xl space-y-6">
    <p
      v-if="configWarning"
      class="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
    >
      {{ configWarning }}
    </p>
    <p
      v-if="uctpJwtPayloadWarning"
      class="rounded-lg border border-amber-600/40 bg-amber-950/40 px-4 py-3 text-sm text-amber-100/95"
    >
      {{ uctpJwtPayloadWarning }}
    </p>

    <section class="rounded-xl border border-slate-600 bg-slate-800/40 p-4 md:p-6">
      <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Configuración SDK y transacción
      </h2>
      <p class="mb-4 max-w-3xl text-xs text-slate-500">
        Flujo Cybersource: pega <code class="text-slate-400">clientLibrary</code> y (recomendado)
        <code class="text-slate-400">clientLibraryIntegrity</code> del JSON de
        <code class="text-slate-400">POST …/uctp/v1/sessions</code>, más el JWT de esa <strong>misma</strong> respuesta.
        Mezclar un JWT de otro request o de otro producto (Flex/CTP) suele provocar fallos internos del SDK
        (<code class="text-slate-400">reading 'find'</code>, etc.).
      </p>
      <div class="grid gap-4 md:grid-cols-2">
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
        <ul class="mb-3 max-w-3xl list-inside list-disc text-xs text-slate-500">
          <li>
            Misma llamada backend <code class="text-slate-400">POST …/uctp/v1/sessions</code> → copia literal
            <code class="text-slate-400">clientLibrary</code>,
            <code class="text-slate-400">clientLibraryIntegrity</code> y el JWT de capture context de esa respuesta.
          </li>
          <li>No reutilizar script/JWT cruzados entre sesiones ni mezclas con otros productos (Flex / CTP clásico).</li>
          <li>
            El JWT de UCTP lleva en el payload (segmento central) un arreglo
            <code class="text-slate-400">ctx</code>; si falta o no es lista, el SDK lanza
            «<code class="text-slate-400">reading 'ctx'</code>».
          </li>
          <li>
            <code class="text-slate-400">initialize()</code> recibe
            <code class="text-slate-400">header</code>, <code class="text-slate-400">payload</code> (objeto JSON con
            <code class="text-slate-400">ctx</code>) y <code class="text-slate-400">raw</code> en la raíz; el SDK v0.6.0
            usa <code class="text-slate-400">payload.ctx.find(...)</code> y falla si payload es solo string.
          </li>
          <li>
            Redes UCTP activas: Visa y Mastercard (<code class="text-slate-400">SRCVISA</code>,
            <code class="text-slate-400">SRCMASTERCARD</code>). AMEX no está en alcance: al incluirla en
            <code class="text-slate-400">allowedCardNetworks</code> el JWT trae <code class="text-slate-400">SRCAMEX</code>
            y el SDK exige <code class="text-slate-400">transactionAmount</code> en todas las redes.
          </li>
        </ul>
        <label class="flex items-start gap-2 text-sm md:col-span-2">
          <input v-model="initializeIncludeDpaOptions" type="checkbox" class="mt-1 rounded border-slate-600" />
          <span class="text-slate-400">
            Incluir <code class="text-slate-300">dpaTransactionOptions</code> en
            <code class="text-slate-300">initialize()</code>
            <span class="text-slate-500"> (opcional; marcar si el JWT no trae monto o al reactivar AMEX más adelante).</span>
          </span>
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
        Con tarjeta guardada, <code class="text-slate-400">checkout()</code> sigue el
        <a
          class="text-sky-400 underline"
          href="https://developer.cybersource.com/docs/cybs/en-us/unified-click-to-pay/developer/all/rest/unified-click-to-pay/uctp-getting-started/uctp-get-started-checkout.html"
          target="_blank"
          rel="noopener noreferrer"
        >ejemplo Cybersource</a>
        (sin <code class="text-slate-400">windowRef</code>). Si el SDK pide CVM en pop-up, marca la opción de abajo.
      </p>
      <label class="mt-2 flex items-start gap-2 text-sm">
        <input v-model="checkoutUseWindowRefPopup" type="checkbox" class="mt-1 rounded border-slate-600" />
        <span class="text-slate-400">
          Abrir pop-up y pasar <code class="text-slate-300">windowRef</code> (no enumerable: el SDK hace
          <code class="text-slate-300">JSON.stringify</code> del request y falla si <code class="text-slate-300">windowRef</code>
          es propiedad enumerable).
        </span>
      </label>
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

    <!-- ADD_CARD / enrolamiento nueva tarjeta (siempre visible tras initialize(); combina con lista SUCCESS). -->
    <section
      v-if="showAddCardEnrollmentSection"
      class="rounded-xl border border-orange-600/50 bg-orange-950/20 p-4 md:p-6"
    >
      <h2 class="mb-2 text-sm font-semibold text-orange-300">Alta de tarjeta (encryptedCard)</h2>
      <p
        v-if="getCardsEnrollmentAddCardHint && lastCardsResponse"
        class="mb-3 rounded-lg border border-cyan-600/35 bg-cyan-950/30 px-3 py-2 text-sm text-cyan-100/95"
      >
        <strong>getCards()</strong> indica enrolamiento: perfil nuevo o sin tarjetas en Click to Pay
        (<code class="text-cyan-200">ADD_CARD</code>). Usa el formulario siguiente; no es un error técnico del SDK.
      </p>
      <p class="mb-2 text-xs text-slate-500">
        Los datos sensibles se cifran en el navegador (Web Crypto: RSA-OAEP-256 + A256GCM) con la
        <code class="text-slate-400">panEncryptionKey</code> del JWT de sesiones.
        Ver
        <a
          class="text-sky-400 underline"
          href="https://developer.cybersource.com/docs/cybs/en-us/unified-click-to-pay/developer/all/rest/unified-click-to-pay/uctp-appendix-intro/uctp-keys/uctp-keys-pan-enc-keys.html"
          target="_blank"
          rel="noopener noreferrer"
        >Client-Side PAN Encryption Keys</a>.
        Claves cargadas tras <code class="text-slate-400">initialize()</code>:
        <span class="font-mono text-slate-400">{{ panEncryptionKeysLoadedLabel }}</span>
      </p>
      <p class="mb-3 text-sm text-slate-400">
        Completa el formulario y pulsa <strong class="text-orange-200">Cifrar y hacer checkout()</strong>.
        El enrolamiento usa pop-up con <code class="text-orange-200">windowRef</code> no enumerable.
      </p>

      <div class="mb-3 flex flex-wrap items-center gap-2">
        <span class="text-xs text-slate-500">Red por BIN:</span>
        <span
          class="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          :class="
            addCardDetectedNetwork === 'SRCVISA'
              ? 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/40'
              : addCardDetectedNetwork === 'SRCMASTERCARD'
                ? 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/40'
                : 'bg-amber-500/15 text-amber-200/90 ring-1 ring-amber-500/30'
          "
        >
          {{ addCardNetworkBadgeLabel }}
        </span>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <label class="block text-sm md:col-span-2">
          <span class="text-slate-400">Número de tarjeta (PAN)</span>
          <input
            v-model="newCardPan"
            type="text"
            inputmode="numeric"
            autocomplete="cc-number"
            maxlength="19"
            class="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100"
            placeholder="4111 …"
          />
        </label>
        <label class="block text-sm">
          <span class="text-slate-400">Mes cad. (MM)</span>
          <input
            v-model="newCardExpMonth"
            type="text"
            inputmode="numeric"
            autocomplete="cc-exp-month"
            maxlength="2"
            class="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100"
            placeholder="12"
          />
        </label>
        <label class="block text-sm">
          <span class="text-slate-400">Año cad. (YYYY)</span>
          <input
            v-model="newCardExpYear"
            type="text"
            inputmode="numeric"
            autocomplete="cc-exp-year"
            maxlength="4"
            class="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100"
            placeholder="2030"
          />
        </label>
        <label class="block text-sm">
          <span class="text-slate-400">CVV</span>
          <input
            v-model="newCardCvv"
            type="password"
            inputmode="numeric"
            autocomplete="cc-csc"
            maxlength="4"
            class="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100"
          />
        </label>
        <label class="block text-sm md:col-span-2">
          <span class="text-slate-400">Titular (opcional)</span>
          <input
            v-model="newCardName"
            type="text"
            autocomplete="cc-name"
            class="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
        </label>
      </div>

      <p v-if="jweError" class="mt-3 rounded border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
        {{ jweError }}
      </p>

      <label class="mt-4 block text-sm">
        <span class="text-slate-400">encryptedCard (JWE compact — solo lectura tras cifrar)</span>
        <textarea
          v-model="encryptedCardJwe"
          readonly
          rows="4"
          class="mt-1 w-full cursor-default rounded border border-slate-600 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-400"
        />
      </label>

      <details class="mt-4 rounded-lg border border-slate-700/80 bg-slate-900/50 px-3 py-2">
        <summary class="cursor-pointer text-xs font-medium text-slate-400">Opcional: complianceSettings (JSON)</summary>
        <p class="mt-2 text-[11px] text-slate-500">
          Si el Business Center exige aceptación de términos, pega aquí el objeto con
          <code class="text-slate-400">complianceResources</code> (ver API Checkout — ComplianceSettings). Si aparece
          <code class="text-amber-200">CARD_ADD_FAILED</code>, suele bastar pasar también
          <code class="text-slate-400">consumer</code>; si no, configurar compliance en Cybersource o este JSON de prueba.
        </p>
        <textarea
          v-model="addCardComplianceSettingsJson"
          rows="5"
          class="mt-2 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1.5 font-mono text-[11px] text-slate-300"
          placeholder='{"complianceResources":[{"complianceType":"TERMS_AND_CONDITIONS","uri":"https://...","version":"1"}]}'
        />
      </details>

      <button
        type="button"
        class="mt-3 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50"
        :disabled="checkingOut || buildingJwe || !initialized || !canSubmitAddCardCheckout"
        @click="runBuildAndCheckout"
      >
        {{
          buildingJwe
            ? 'Cifrando…'
            : checkingOut
              ? 'checkout()…'
              : 'Cifrar y hacer checkout()'
        }}
      </button>
    </section>

    <!-- ERROR from getCards (excluye respuesta esperada enrolamiento ADD_CARD como ERROR). -->
    <section
      v-if="lastActionCode === 'ERROR' && !getCardsEnrollmentAddCardHint"
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

const DEFAULT_EMAIL = 'juanpapabon@gmail.com';
const CURRENCY_OPTIONS = ['USD', 'EUR', 'COP', 'MXN', 'AUD'] as const;
const DEFAULT_AMOUNT_BY_CURRENCY: Record<string, string> = {
  USD: '99.95',
  EUR: '89.95',
  COP: '20000',
  MXN: '1800',
  AUD: '149.95',
};

const clientLibraryUrl = ref((env.PUBLIC_VISA_UCTP_CLIENT_LIBRARY ?? '').trim());
const clientLibraryIntegrity = ref((env.PUBLIC_VISA_UCTP_CLIENT_LIBRARY_INTEGRITY ?? '').trim());
const captureContextJwt = ref((env.PUBLIC_VISA_UCTP_CAPTURE_CONTEXT ?? '').trim());
/** Redes SRC consideradas en el POC (AMEX excluida hasta habilitar DPA + allowedCardNetworks en backend). */
const UCTP_ACTIVE_SRC_NETWORKS = ['SRCVISA', 'SRCMASTERCARD'] as const;

/** Incluir dpaTransactionOptions en initialize() (opcional con JWT solo Visa/MC). */
const initializeIncludeDpaOptions = ref(false);

const consumerEmail = ref(DEFAULT_EMAIL);
const merchantOrderId = ref(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
const transactionCurrencyCode = ref('COP');
const transactionAmount = ref(DEFAULT_AMOUNT_BY_CURRENCY[transactionCurrencyCode.value] ?? '20000');

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
/** Formulario ADD_CARD → JWE client-side (Web Crypto; doc pan encryption keys). */
const newCardPan = ref('');
const newCardExpMonth = ref('');
const newCardExpYear = ref('');
const newCardCvv = ref('');
const newCardName = ref('');
const buildingJwe = ref(false);
const jweError = ref('');
/** JSON opcional para checkout().complianceSettings (TERMS_AND_CONDITIONS, PRIVACY_POLICY, …). */
const addCardComplianceSettingsJson = ref('');
const payloadTypeIndicatorCheckout = ref<'FULL' | 'SUMMARY'>('FULL');
/** Pop-up + windowRef solo si el flujo lo exige (p. ej. CVM); por defecto off en tarjeta guardada. */
const checkoutUseWindowRefPopup = ref(false);

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
  transactionAmount.value = DEFAULT_AMOUNT_BY_CURRENCY[currency] ?? '20000';
});

let sdkScriptSrc = '';
let sdkScriptIntegrity = '';

const configWarning = computed(() => {
  if (!clientLibraryUrl.value.trim()) {
    return 'Indica clientLibrary (URL del script) desde la API de sesiones Cybersource o PUBLIC_VISA_UCTP_CLIENT_LIBRARY.';
  }
  return null;
});

const canLoadSdk = computed(() => Boolean(clientLibraryUrl.value.trim()));

const vsdk = computed(() => (typeof window !== 'undefined' ? window.VSDK : undefined));

const lastActionCode = computed(() => {
  const r = lastCardsResponse.value;
  if (!r || typeof r.actionCode !== 'string') return null;
  return r.actionCode;
});

/** Perfil nuevo / sin tarjetas C2P: getCards devuelve ADD_CARD o ERROR con error ADD_CARD — no es fallo técnico. */
const getCardsEnrollmentAddCardHint = computed((): boolean => {
  const r = lastCardsResponse.value;
  if (!r || typeof r.actionCode !== 'string') return false;
  if (r.actionCode === 'ADD_CARD') return true;
  if (r.actionCode === 'ERROR') {
    const e = r.error;
    if (typeof e !== 'string') return false;
    return e === 'ADD_CARD' || e.toUpperCase() === 'ADD_CARD';
  }
  return false;
});

/** Alta de tarjeta (PAN → JWE) visible tras initialize(); la lista SUCCESS puede coexistir. */
const showAddCardEnrollmentSection = computed(() => initialized.value);

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
 * windowRef no puede ser enumerable: VSDK clona/loguea el request con JSON.stringify y Window es circular.
 */
function attachNonEnumerableWindowRef(target: Record<string, unknown>, win: Window): void {
  const existing = Object.getOwnPropertyDescriptor(target, 'windowRef');
  if (existing?.configurable) {
    Reflect.deleteProperty(target, 'windowRef');
  }
  Object.defineProperty(target, 'windowRef', {
    value: win,
    enumerable: false,
    configurable: true,
  });
}

function checkoutLogPayload(req: Record<string, unknown>): Record<string, unknown> {
  const logReq = { ...req };
  const desc = Object.getOwnPropertyDescriptor(req, 'windowRef');
  if (desc?.value && typeof Window !== 'undefined') {
    try {
      if (desc.value instanceof Window) {
        logReq.windowRef = '[Window:popup — propiedad no enumerable]';
      }
    } catch {
      logReq.windowRef = '[Window]';
    }
  }
  return logReq;
}

type CheckoutWindowRefMode = 'omit' | 'popup';

async function invokeVsdkCheckout(
  sdkReq: Record<string, unknown>,
  windowRefMode: CheckoutWindowRefMode,
): Promise<Record<string, unknown>> {
  const V = window.VSDK;
  if (!V) throw new Error('VSDK no cargado');

  let popupToClose: Window | null = null;
  if (windowRefMode === 'popup') {
    const popup = openUctpCheckoutPopup();
    if (!popup) {
      throw new Error('No se pudo abrir la ventana emergente (pop-up bloqueado). Permite pop-ups para este sitio.');
    }
    popupToClose = popup;
    attachNonEnumerableWindowRef(sdkReq, popup);
  }

  try {
    return (await V.checkout(sdkReq)) as Record<string, unknown>;
  } finally {
    tryCloseCheckoutPopup(popupToClose);
  }
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
  const consolePayload = { request, response, error };
  if (error) {
    console.error(`[UCTP] ${method}`, consolePayload);
  } else {
    console.info(`[UCTP] ${method}`, consolePayload);
  }
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

/**
 * Opciones para VSDK checkout/getCards típicos — incluye `paymentOptions`.
 * Intenta usar defaults derivados del JWT de capture context para mantener compatibilidad
 * con la misma sesión generada por backend/integración.
 */
type DerivedDpaDefaults = {
  transactionAmount?: { transactionAmount: string; transactionCurrencyCode: string };
  dpaBillingPreference?: string;
  dpaAcceptedBillingCountries?: string[];
  consumerNationalIdentifierRequested?: boolean;
  merchantCountryCode?: string;
  dpaLocale?: string;
  paymentOptions?: Array<Record<string, unknown>>;
};

const derivedDpaDefaults = ref<DerivedDpaDefaults | null>(null);

/** RSA JWK por red para PAN encryption (JWT payload.ctx[].data.paymentConfigurations). */
type PanEncryptionKeys = Partial<Record<(typeof UCTP_ACTIVE_SRC_NETWORKS)[number], Record<string, unknown>>>;
const panEncryptionKeys = ref<PanEncryptionKeys>({});

function extractPanEncryptionKeys(payload: Record<string, unknown>): PanEncryptionKeys {
  const keys: PanEncryptionKeys = {};
  const ctx = Array.isArray(payload.ctx) ? payload.ctx : [];
  for (const entry of ctx) {
    if (!entry || typeof entry !== 'object') continue;
    const data = (entry as Record<string, unknown>).data;
    if (!data || typeof data !== 'object') continue;
    const paymentConfigurations = (data as Record<string, unknown>).paymentConfigurations;
    if (!paymentConfigurations || typeof paymentConfigurations !== 'object') continue;
    const pc = paymentConfigurations as Record<string, unknown>;
    for (const network of UCTP_ACTIVE_SRC_NETWORKS) {
      const cfg = pc[network];
      if (!cfg || typeof cfg !== 'object') continue;
      const rawKey = (cfg as Record<string, unknown>).panEncryptionKey;
      if (rawKey && typeof rawKey === 'object' && !Array.isArray(rawKey)) {
        keys[network] = rawKey as Record<string, unknown>;
      }
    }
  }
  return keys;
}

function normalizePaymentOptions(raw: unknown): Array<Record<string, unknown>> | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) {
    return raw.filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === 'object'));
  }
  if (typeof raw === 'object') {
    return [raw as Record<string, unknown>];
  }
  return undefined;
}

function deriveDpaDefaultsFromDecodedPayload(payload: Record<string, unknown>): DerivedDpaDefaults | null {
  try {
    const parsed = payload;
    const ctx = Array.isArray(parsed.ctx) ? parsed.ctx : [];
    const first = (ctx[0] ?? {}) as Record<string, unknown>;
    const data = (first.data ?? {}) as Record<string, unknown>;
    const paymentConfigurations = (data.paymentConfigurations ?? {}) as Record<string, unknown>;
    const preferredOrder = [...UCTP_ACTIVE_SRC_NETWORKS];
    let selected: Record<string, unknown> | null = null;
    for (const network of preferredOrder) {
      const cfg = paymentConfigurations[network];
      if (cfg && typeof cfg === 'object') {
        selected = cfg as Record<string, unknown>;
        break;
      }
    }
    if (!selected) return null;
    const parameters = (selected.parameters ?? {}) as Record<string, unknown>;
    const dto = (parameters.dpaTransactionOptions ?? {}) as Record<string, unknown>;
    const transactionAmountRaw = dto.transactionAmount as Record<string, unknown> | undefined;
    const amount =
      transactionAmountRaw &&
      typeof transactionAmountRaw.transactionAmount === 'string' &&
      typeof transactionAmountRaw.transactionCurrencyCode === 'string'
        ? {
            transactionAmount: transactionAmountRaw.transactionAmount,
            transactionCurrencyCode: transactionAmountRaw.transactionCurrencyCode,
          }
        : undefined;

    return {
      transactionAmount: amount,
      dpaBillingPreference: typeof dto.dpaBillingPreference === 'string' ? dto.dpaBillingPreference : undefined,
      dpaAcceptedBillingCountries: Array.isArray(dto.dpaAcceptedBillingCountries)
        ? dto.dpaAcceptedBillingCountries.filter((x): x is string => typeof x === 'string')
        : undefined,
      consumerNationalIdentifierRequested:
        typeof dto.consumerNationalIdentifierRequested === 'boolean' ? dto.consumerNationalIdentifierRequested : undefined,
      merchantCountryCode: typeof dto.merchantCountryCode === 'string' ? dto.merchantCountryCode : undefined,
      dpaLocale: typeof dto.dpaLocale === 'string' ? dto.dpaLocale : undefined,
      paymentOptions: normalizePaymentOptions(dto.paymentOptions),
    };
  } catch {
    return null;
  }
}

function buildDpaTransactionOptions(includePaymentOptions = true): Record<string, unknown> {
  const defaults = derivedDpaDefaults.value;
  const options: Record<string, unknown> = {
    transactionAmount:
      defaults?.transactionAmount ?? {
        transactionAmount: transactionAmount.value,
        transactionCurrencyCode: transactionCurrencyCode.value,
      },
    dpaBillingPreference: defaults?.dpaBillingPreference ?? 'NONE',
    dpaAcceptedBillingCountries: defaults?.dpaAcceptedBillingCountries ?? [],
    consumerNationalIdentifierRequested: defaults?.consumerNationalIdentifierRequested ?? false,
    merchantCategoryCode: '4829',
    merchantCountryCode: defaults?.merchantCountryCode ?? 'CO',
    merchantOrderId: merchantOrderId.value,
    dpaLocale: defaults?.dpaLocale ?? 'es_CO',
  };
  if (includePaymentOptions) {
    options.paymentOptions =
      defaults?.paymentOptions ?? [
        {
          dpaDynamicDataTtlMinutes: 15,
          dynamicDataType: 'CARD_APPLICATION_CRYPTOGRAM_LONG_FORM',
        },
      ];
  }
  return options;
}

function buildConsumerIdentity(): Record<string, unknown> {
  return {
    identityProvider: 'SRC',
    identityType: 'EMAIL_ADDRESS',
    identityValue: consumerEmail.value.trim(),
  };
}

/** Consumer en checkout(encryptedCard): debe enlazar la misma identidad que en getCards() (CyberSource Checkout API). */
function buildCheckoutConsumerForEncryptedCard(): Record<string, unknown> {
  const email = consumerEmail.value.trim();
  if (!email) {
    throw new Error('Indica el email (consumer identity) antes del checkout de alta de tarjeta.');
  }
  return {
    consumerIdentity: buildConsumerIdentity(),
    emailAddress: email,
  };
}

/** complianceSettings opcional desde JSON (URLs de términos/privacidad del Business Center). */
function parseOptionalCheckoutComplianceJson(): Record<string, unknown> | undefined {
  const raw = addCardComplianceSettingsJson.value.trim();
  if (!raw) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('complianceSettings: JSON inválido.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('complianceSettings: debe ser un objeto.');
  }
  const o = parsed as Record<string, unknown>;
  if (!Array.isArray(o.complianceResources)) {
    throw new Error('complianceSettings debe incluir complianceResources[].');
  }
  return o;
}

/** Cybersource UCTP — Client-Side PAN Encryption (RSA-OAEP-256 + A256GCM, RFC 7516). */
function base64UrlEncode(data: Uint8Array): string {
  let binary = '';
  for (const byte of data) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlEncodeString(str: string): string {
  return base64UrlEncode(new TextEncoder().encode(str));
}

async function jweEncrypt(plaintext: string, jwk: Record<string, unknown>): Promise<string> {
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    jwk as JsonWebKey,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['wrapKey'],
  );

  const cek = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);

  const wrappedKey = new Uint8Array(await crypto.subtle.wrapKey('raw', cek, publicKey, { name: 'RSA-OAEP' }));

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const header: Record<string, string> = { alg: 'RSA-OAEP-256', enc: 'A256GCM' };
  const kid = jwk.kid;
  if (typeof kid === 'string' && kid.length > 0) {
    header.kid = kid;
  }
  const encodedHeader = base64UrlEncodeString(JSON.stringify(header));
  const aad = new TextEncoder().encode(encodedHeader);

  const plaintextBytes = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 },
    cek,
    plaintextBytes,
  );

  const encryptedArray = new Uint8Array(encrypted);
  const ciphertext = encryptedArray.slice(0, encryptedArray.length - 16);
  const authTag = encryptedArray.slice(encryptedArray.length - 16);

  return [
    encodedHeader,
    base64UrlEncode(wrappedKey),
    base64UrlEncode(iv),
    base64UrlEncode(ciphertext),
    base64UrlEncode(authTag),
  ].join('.');
}

/** BIN → red SRC según doc Cybersource (Visa / Mastercard). */
function detectNetworkByPan(panDigits: string): 'SRCVISA' | 'SRCMASTERCARD' | null {
  const d = panDigits.replace(/\D/g, '');
  if (d.length < 9) return null;
  if (/^4/.test(d)) return 'SRCVISA';
  const prefix4 = Number.parseInt(d.slice(0, 4), 10);
  const prefix2 = Number.parseInt(d.slice(0, 2), 10);
  if (!Number.isNaN(prefix2) && prefix2 >= 51 && prefix2 <= 55) return 'SRCMASTERCARD';
  if (!Number.isNaN(prefix4) && prefix4 >= 2221 && prefix4 <= 2720) return 'SRCMASTERCARD';
  return null;
}

async function buildEncryptedCard(): Promise<string> {
  if (!crypto?.subtle) {
    throw new Error('Web Crypto API no disponible (HTTPS o contexto seguro requerido).');
  }
  const pan = newCardPan.value.replace(/\s/g, '').replace(/\D/g, '');
  const network = detectNetworkByPan(pan);
  if (!network) {
    throw new Error('BIN no reconocido (solo Visa / Mastercard en este POC).');
  }
  const jwk = panEncryptionKeys.value[network];
  if (!jwk) {
    throw new Error(`panEncryptionKey no disponible para ${network}; reinicia initialize() con un JWT válido.`);
  }
  const mm = newCardExpMonth.value.trim().padStart(2, '0');
  const yyyy = newCardExpYear.value.trim();
  if (!/^\d{2}$/.test(mm) || mm === '00') {
    throw new Error('Mes de expiración inválido (MM).');
  }
  if (!/^\d{4}$/.test(yyyy)) {
    throw new Error('Año de expiración inválido (YYYY).');
  }
  const cvv = newCardCvv.value.trim();
  if (!cvv) {
    throw new Error('CVV requerido.');
  }
  const name = newCardName.value.trim();
  const cardPayload = {
    card: {
      primaryAccountNumber: pan,
      panExpirationMonth: mm,
      panExpirationYear: yyyy,
      cardSecurityCode: cvv,
      ...(name ? { cardholderFullName: name } : {}),
    },
  };
  return jweEncrypt(JSON.stringify(cardPayload), jwk);
}

const addCardDetectedNetwork = computed(() => detectNetworkByPan(newCardPan.value.replace(/\s/g, '')));

const addCardNetworkBadgeLabel = computed((): string => {
  const raw = newCardPan.value.replace(/\s/g, '').replace(/\D/g, '');
  const n = addCardDetectedNetwork.value;
  if (n === 'SRCVISA') return 'SRCVISA';
  if (n === 'SRCMASTERCARD') return 'SRCMASTERCARD';
  if (raw.length >= 9) return 'BIN no reconocido';
  return 'Introduce PAN (≥9 dígitos)';
});

const panEncryptionKeysLoadedLabel = computed((): string => {
  const k = panEncryptionKeys.value;
  const parts: string[] = [];
  if (k.SRCVISA) parts.push('SRCVISA');
  if (k.SRCMASTERCARD) parts.push('SRCMASTERCARD');
  return parts.length ? parts.join(', ') : 'ninguna (JWT sin panEncryptionKey)';
});

const canSubmitAddCardCheckout = computed((): boolean => {
  const pan = newCardPan.value.replace(/\s/g, '').replace(/\D/g, '');
  return (
    pan.length >= 9 &&
    Boolean(newCardExpMonth.value.trim()) &&
    Boolean(newCardExpYear.value.trim()) &&
    Boolean(newCardCvv.value.trim()) &&
    addCardDetectedNetwork.value !== null
  );
});

/** Base64url JWT segment → UTF-8 string (CyberSource suele esperar header/payload decodificados). */
function decodeJwtSegment(segment: string): string {
  const pad = '='.repeat((4 - (segment.length % 4)) % 4);
  const b64 = segment.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

function parseJwtSegmentJson(segment: string, segmentName: string): Record<string, unknown> {
  const utf8 = decodeJwtSegment(segment);
  try {
    const parsed = JSON.parse(utf8) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`se esperaba un objeto JSON en ${segmentName}`);
    }
    return parsed as Record<string, unknown>;
  } catch (e: unknown) {
    const hint = e instanceof Error ? e.message : String(e);
    throw new Error(`Error parseando ${segmentName} del JWT: ${hint}`);
  }
}

/**
 * JWT → header/payload como objetos (SDK UCTP v0.6.0 usa payload.ctx.find) + raw string.
 */
function buildCybersourceInitializeFromJwt(trimmedJwt: string): {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  raw: string;
} {
  const parts = trimmedJwt.split('.').filter(Boolean);
  if (parts.length < 3) {
    throw new Error(`JWT inválido: esperados al menos 3 segmentos (.), encontrados ${parts.length}.`);
  }
  try {
    return {
      header: parseJwtSegmentJson(parts[0], 'header'),
      payload: parseJwtSegmentJson(parts[1], 'payload'),
      raw: trimmedJwt,
    };
  } catch (e: unknown) {
    const hint = e instanceof Error ? e.message : String(e);
    throw new Error(`Error decodificando header/payload del JWT: ${hint}`);
  }
}

/** Valida payload parseado del JWT de capture context (`POST /uctp/v1/sessions`). Vacío ⇒ OK. */
function validateUctpSessionsCaptureJwtDecodedPayload(payload: Record<string, unknown>): string {
  const o = payload;
  if (!Object.prototype.hasOwnProperty.call(o, 'ctx')) {
    return 'Falta `ctx` en el payload JSON. Suele aparecer «reading \'ctx\'» en initialize() si pegas otro JWT (p. ej. Microform/Flex, token de campo equivocado del JSON). Usa literalmente el capture context JWT de esa misma respuesta `/uctp/v1/sessions`.';
  }
  const ctx = o.ctx;
  if (!Array.isArray(ctx)) {
    return `\`ctx\` debe ser un arreglo (documentación UCTP CyberSource); ahora es ${typeof ctx}. Revisa que el texto pegado sea el JWT correcto del endpoint de sesiones.`;
  }
  if (ctx.length === 0) {
    return '`ctx` está vacío ([]); no es un capture context válido para el SDK.';
  }
  return '';
}

const uctpJwtPayloadWarning = computed((): string => {
  const jwt = captureContextJwt.value.trim();
  if (!jwt) return '';
  const parts = jwt.split('.').filter(Boolean);
  if (parts.length < 3) return 'El JWT debería tener 3 segmentos separados por puntos.';
  try {
    const payload = parseJwtSegmentJson(parts[1], 'payload');
    return validateUctpSessionsCaptureJwtDecodedPayload(payload);
  } catch {
    return '';
  }
});

function loadSdk(): void {
  if (!canLoadSdk.value || loadingSdk.value) return;
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
      pushLog(
        'loadSdk',
        {
          url,
          integritySet: Boolean(integrity),
          note: 'JWT + esta URL (+ integrity): misma respuesta POST /uctp/v1/sessions; script y contexto sin mezclar sesiones.',
        },
        undefined,
        'VSDK no disponible tras cargar el script',
      );
    } else {
      pushLog(
        'loadSdk',
        {
          url,
          integritySet: Boolean(integrity),
          note: 'Empareja esta URL con JWT y integrity de la misma respuesta POST /uctp/v1/sessions.',
        },
        { ok: true, note: 'window.VSDK listo' },
      );
    }
  };
  script.onerror = () => {
    loadingSdk.value = false;
    sdkReady.value = false;
    pushLog('loadSdk', { url, integritySet: Boolean(integrity) }, undefined, 'Error cargando script SDK');
  };
  document.head.appendChild(script);
}

async function runInitialize(): Promise<void> {
  const V = window.VSDK;
  if (!V) return;
  initializing.value = true;

  const jwt = captureContextJwt.value.trim();
  if (!jwt) {
    initializing.value = false;
    const msg = 'Falta el JWT de capture context (textarea o PUBLIC_VISA_UCTP_CAPTURE_CONTEXT).';
    pushLog('initialize', {}, undefined, msg);
    return;
  }
  let initParts: { header: Record<string, unknown>; payload: Record<string, unknown>; raw: string };
  try {
    initParts = buildCybersourceInitializeFromJwt(jwt);
  } catch (e: unknown) {
    initializing.value = false;
    const msg = e instanceof Error ? e.message : String(e);
    pushLog('initialize', { parseError: true }, undefined, msg);
    return;
  }
  const core = {
    header: initParts.header,
    payload: initParts.payload,
    raw: initParts.raw,
  };
  const payloadShapeError = validateUctpSessionsCaptureJwtDecodedPayload(initParts.payload);
  if (payloadShapeError) {
    initializing.value = false;
    pushLog(
      'initialize',
      {
        abortedBeforeSdkCall: true,
        reason: 'capture_context_payload_shape',
        shapeHint: 'El JWT UCTP válido lleva payload.ctx como arreglo (doc. extractPanEncryptionKeys / initialize).',
      },
      undefined,
      payloadShapeError,
    );
    return;
  }
  derivedDpaDefaults.value = deriveDpaDefaultsFromDecodedPayload(initParts.payload);
  panEncryptionKeys.value = extractPanEncryptionKeys(initParts.payload);
  const initOptions = initializeIncludeDpaOptions.value
    ? { dpaTransactionOptions: buildDpaTransactionOptions(false) }
    : undefined;
  const logRequest: Record<string, unknown> = {
    ...core,
    ...(initOptions ?? {}),
    pairingReminder: 'JWT + clientLibrary (+ integrity) del mismo POST /uctp/v1/sessions',
    defaultsFromJwt: Boolean(derivedDpaDefaults.value),
    payloadParsedAsObject: true,
  };
  try {
    await V.initialize(core, initOptions);
    initialized.value = true;
    pushLog('initialize', logRequest, { ok: true });
  } catch (e: unknown) {
    initialized.value = false;
    const msg = e instanceof Error ? e.message : String(e);
    pushLog('initialize', logRequest, undefined, msg);
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
  if (!window.VSDK || !initialized.value) return;
  checkingOut.value = true;
  lastCheckoutDisplay.value = null;
  const req: Record<string, unknown> = {
    srcDigitalCardId,
    dpaTransactionOptions: buildDpaTransactionOptions(),
    payloadTypeIndicatorCheckout: payloadTypeIndicatorCheckout.value,
  };
  const windowRefMode: CheckoutWindowRefMode = checkoutUseWindowRefPopup.value ? 'popup' : 'omit';
  try {
    const res = await invokeVsdkCheckout(req, windowRefMode);
    pushLog('checkout', checkoutLogPayload(req), res);
    setLastCheckoutPanel('checkout', res);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    pushLog('checkout', checkoutLogPayload(req), undefined, msg);
    setLastCheckoutPanel('checkout', null, msg);
  } finally {
    checkingOut.value = false;
  }
}

async function runBuildAndCheckout(): Promise<void> {
  buildingJwe.value = true;
  jweError.value = '';
  try {
    encryptedCardJwe.value = await buildEncryptedCard();
    await runCheckoutAddCard();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    jweError.value = msg;
  } finally {
    buildingJwe.value = false;
  }
}

async function runCheckoutAddCard(): Promise<void> {
  if (!window.VSDK || !initialized.value) {
    throw new Error('Inicializa el SDK (initialize()) antes de checkout ADD_CARD.');
  }
  checkingOut.value = true;
  lastCheckoutDisplay.value = null;
  const req: Record<string, unknown> = {
    encryptedCard: encryptedCardJwe.value.trim(),
    consumer: buildCheckoutConsumerForEncryptedCard(),
    dpaTransactionOptions: buildDpaTransactionOptions(),
    payloadTypeIndicatorCheckout: payloadTypeIndicatorCheckout.value,
  };
  const compliance = parseOptionalCheckoutComplianceJson();
  if (compliance) {
    req.complianceSettings = compliance;
  }
  try {
    const res = await invokeVsdkCheckout(req, 'popup');
    pushLog('checkout (ADD_CARD / encryptedCard)', checkoutLogPayload(req), res);
    setLastCheckoutPanel('checkout (ADD_CARD / encryptedCard)', res);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    pushLog('checkout (ADD_CARD / encryptedCard)', checkoutLogPayload(req), undefined, msg);
    setLastCheckoutPanel('checkout (ADD_CARD / encryptedCard)', null, msg);
    throw e;
  } finally {
    checkingOut.value = false;
  }
}

</script>
