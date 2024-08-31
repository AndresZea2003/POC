import crypto from "crypto";

// Clave privada (asegúrate de que esté en el formato correcto)
const privateKeyPem = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg+rau9crlbClx8ER9
uq4FMvO86yiPLOfM5v63rqUdi9GhRANCAARSWUcQqHke01VleJootQfr0vJpWwYR
PXmSvoZHaQEndgQnki02meNRQ44lA188qW0fptIP0YWE9AP8QppWuswE
-----END PRIVATE KEY-----
`;

const privateKey = crypto.createPrivateKey({
  key: privateKeyPem,
  format: "pem",
});

// EphemeralPublicKey en formato Base64
const ephemeralPublicKeyBase64 =
  "BMWbjJ835RSJjVJEQmbVBbNeDD6nYfTCsnPIPM2e26WM5layzl6Rmd61q0pr5CkavOxqldvxHV23F97iPPw8y8k=";
const ephemeralPublicKey = Buffer.from(ephemeralPublicKeyBase64, "base64");

// Crear un objeto ECDH y generar la clave compartida
const ecdh = crypto.createECDH("prime256v1");
ecdh.setPrivateKey(
  privateKey.export({ format: "der", type: "pkcs8" }).slice(-32)
);

console.log("Clave privada:", ecdh.getPrivateKey().toString("hex"));
// MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg+rau9crlbClx8ER9uq4FMvO86yiPLOfM5v63rqUdi9GhRANCAARSWUcQqHke01VleJootQfr0vJpWwYRPXmSvoZHaQEndgQnki02meNRQ44lA188qW0fptIP0YWE9AP8QppWuswE
const sharedSecret = ecdh.computeSecret(ephemeralPublicKey);

console.log("Clave compartida:", sharedSecret.toString("hex"));

// Función para derivar claves usando HKDF
function hkdfDerive(secret, salt, info, length) {
  const prk = crypto.createHmac("sha256", salt).update(secret).digest();
  let okm = Buffer.alloc(0);
  let t = Buffer.alloc(0);
  let i = 0;

  while (okm.length < length) {
    i++;
    t = crypto
      .createHmac("sha256", prk)
      .update(Buffer.concat([t, info, Buffer.from([i])]))
      .digest();
    okm = Buffer.concat([okm, t]);
  }

  return okm.slice(0, length);
}

// Derivar symmetricEncryptionKey y macKey
const salt = Buffer.alloc(0); // Sin sal
const info = Buffer.from("Google"); // Info específica de Google Pay
const derivedKey = hkdfDerive(sharedSecret, salt, info, 64);
const symmetricEncryptionKey = derivedKey.slice(0, 32);
const macKey = derivedKey.slice(32, 64);

console.log("symmetricEncryptionKey:", symmetricEncryptionKey.toString("hex"));
console.log("macKey:", macKey.toString("hex"));

// Verificar el tag utilizando HMAC-SHA256
const encryptedMessageBase64 =
  "0ghSYNJjBKqukdQ/tceqhsU0E1ObzhdxVR/TBoPjjwK4Qcn63rAh6XCWwbvYqUhNKXEhUvu2KJuw6o4jSR1zYA0Ii5n7yHpFWIkCKlN/5lK8+TqHFboOaWsbao80g7nFw7vM5zx5xTGXziyh9l575tjLBs8t2KSmw+ra983IA1d6dFN4+0bUStbrrSnq3i9RfROPAyu5u7sC9imBlKa657nW5LhHQd32nw3xHxFfWylBQehtHrWdGlZQjMBE108zox7ajoJfE3ny27nPKrKS0oB86txBXqdMKz1HgbBu1WQGCq63biHgHRwORZgJNBKZa0lIAQIaXVk7KPH+9YmZQGR+GRlvh8MCBU0o9oqyUGj4XxNGPJw7m4s90hA9oaUza84dtNBQojIllpE80Zt2r97EoNfd1nVOY2Xvka9E50LPw/Zoonj3RELbiM1ac4YcDVvBsz7xZFNwqQU8a+8SBQT2loUXVwkAAOpEXHb2bl7nzVuPLqOq3NpKB4DhZrUfLL/5Jqb6fpPaNd5TRBNBPnE0STmg7ow80JXDecYh65vxch5d";
const tagBase64 = "YMRbxrCLb54oKm0bX5KUxdc/JeVH+76pXkC91TYP73M=";

const encryptedMessage = Buffer.from(encryptedMessageBase64, "base64");
const tag = Buffer.from(tagBase64, "base64");

// Verificar el HMAC calculado
const hmac = crypto.createHmac("sha256", macKey);
hmac.update(encryptedMessage);
const calculatedTag = hmac.digest();

console.log("HMAC calculado:", calculatedTag.toString("hex"));
console.log("HMAC recibido:", tag.toString("hex"));

// Comparación de tiempo constante
const isTagValid = crypto.timingSafeEqual(tag, calculatedTag);

if (!isTagValid) {
  throw new Error(
    "El tag no es válido, los datos pueden haber sido manipulados."
  );
}

// Desencriptar el mensaje usando AES-256-CTR
const decipher = crypto.createDecipheriv(
  "aes-256-ctr",
  symmetricEncryptionKey,
  Buffer.alloc(16, 0) // IV de 16 bytes de ceros
);
const decryptedMessage = Buffer.concat([
  decipher.update(encryptedMessage),
  decipher.final(),
]);

console.log("Mensaje desencriptado:", decryptedMessage.toString("utf8"));
