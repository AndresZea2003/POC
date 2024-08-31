import type { APIContext } from "astro";
import crypto from "crypto";
import pkg from "elliptic";

const { ec } = pkg;
const EC = new ec("p256");

const requestData = {
  apiVersion: 2,
  apiVersionMinor: 0,
  paymentMethodData: {
    description: "Mastercard •••• 7324",
    info: {
      assuranceDetails: {
        accountVerified: true,
        cardHolderAuthenticated: false,
      },
      cardDetails: "7324",
      cardNetwork: "MASTERCARD",
    },
    tokenizationData: {
      token:
        '{"signature":"MEYCIQCUmSMXNUOJdRqOuqBaixW5OU3q+FW0Az+rMKorxIw6+AIhAN9ZBh0AYtDVow1KQx3QvbhsT/eCXjUK1UORICeo42b5","intermediateSigningKey":{"signedKey":"{\\"keyValue\\":\\"MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEDGFIucGhltnkTvKUZUYBRy1cH30Yb92zL2RaeavGtMkLW5ZLj67dqEC+x2bJfQH2kG1PNuNBvqGbDklQkyKDew\\\\u003d\\\\u003d\\",\\"keyExpiration\\":\\"1725733245134\\"}","signatures":["MEUCIDXaseoBP9p4KHIdGyG4pn7C+GwMd7mM/ZcIyZVQEYgbAiEArLA/4jQVjdZBI+FwUpd1vJVdK3bq4hgU1aamzLufiMM\\u003d"]},"protocolVersion":"ECv2","signedMessage":"{\\"encryptedMessage\\":\\"0ghSYNJjBKqukdQ/tceqhsU0E1ObzhdxVR/TBoPjjwK4Qcn63rAh6XCWwbvYqUhNKXEhUvu2KJuw6o4jSR1zYA0Ii5n7yHpFWIkCKlN/5lK8+TqHFboOaWsbao80g7nFw7vM5zx5xTGXziyh9l575tjLBs8t2KSmw+ra983IA1d6dFN4+0bUStbrrSnq3i9RfROPAyu5u7sC9imBlKa657nW5LhHQd32nw3xHxFfWylBQehtHrWdGlZQjMBE108zox7ajoJfE3ny27nPKrKS0oB86txBXqdMKz1HgbBu1WQGCq63biHgHRwORZgJNBKZa0lIAQIaXVk7KPH+9YmZQGR+GRlvh8MCBU0o9oqyUGj4XxNGPJw7m4s90hA9oaUza84dtNBQojIllpE80Zt2r97EoNfd1nVOY2Xvka9E50LPw/Zoonj3RELbiM1ac4YcDVvBsz7xZFNwqQU8a+8SBQT2loUXVwkAAOpEXHb2bl7nzVuPLqOq3NpKB4DhZrUfLL/5Jqb6fpPaNd5TRBNBPnE0STmg7ow80JXDecYh65vxch5d\\",\\"ephemeralPublicKey\\":\\"BMWbjJ835RSJjVJEQmbVBbNeDD6nYfTCsnPIPM2e26WM5layzl6Rmd61q0pr5CkavOxqldvxHV23F97iPPw8y8k\\\\u003d\\",\\"tag\\":\\"YMRbxrCLb54oKm0bX5KUxdc/JeVH+76pXkC91TYP73M\\\\u003d\\"}"}',
      type: "PAYMENT_GATEWAY",
    },
    type: "CARD",
  },
};

export async function POST({ request }: APIContext): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    // Parsear el JSON recibido
    const { paymentMethodData } = await request.json();
    const tokenData = JSON.parse(
      requestData.paymentMethodData.tokenizationData.token
    );
    const { ephemeralPublicKey, encryptedMessage, tag } = JSON.parse(
      tokenData.signedMessage
    );

    console.log("Ephemeral public key:", ephemeralPublicKey);

    // Clave privada (reemplaza esto con la clave privada real que posees)
    const privateKeyPEM = `
    -----BEGIN EC PRIVATE KEY-----
    MHcCAQEEIPq2rvXK5WwpcfBEfbquBTLzvOsojyznzOb+t66lHYvRoAoGCCqGSM49
    AwEHoUQDQgAEUllHEKh5HtNVZXiaKLUH69LyaVsGET15kr6GR2kBJ3YEJ5ItNpnj
    UUOOJQNfPKltH6bSD9GFhPQD/EKaVrrMBA==
    -----END EC PRIVATE KEY-----
    `;

    const privateKey = EC.keyFromPrivate(Buffer.from("", "base64"));

    const ephemeralKey = EC.keyFromPublic(ephemeralPublicKey, "base64");
    const sharedSecret = privateKey.derive(ephemeralKey.getPublic());
    const sharedSecretHex = sharedSecret.toString(16).padStart(64, "0");

    // Separar la clave en dos partes de 256 bits
    const symmetricEncryptionKey = sharedSecretHex.slice(0, 32);
    const macKey = sharedSecretHex.slice(32);

    // Verificar la MAC
    const hmac = crypto.createHmac("sha256", Buffer.from(macKey, "hex"));
    hmac.update(encryptedMessage);
    const expectedTag = hmac.digest("base64");

    const isTagValid = crypto.timingSafeEqual(
      Buffer.from(tag, "base64"),
      Buffer.from(expectedTag, "base64")
    );
    if (!isTagValid) {
      return new Response("Invalid MAC, potential tampering detected.", {
        status: 400,
      });
    }

    // Desencriptar el mensaje
    const cipher = crypto.createDecipheriv(
      "aes-256-ctr",
      Buffer.from(symmetricEncryptionKey, "hex"),
      Buffer.alloc(16, 0)
    );
    let decryptedMessage = cipher.update(encryptedMessage, "base64", "utf-8");
    decryptedMessage += cipher.final("utf-8");

    return new Response(JSON.stringify({ decryptedMessage }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(`Error processing request: ${error.message}`, {
      status: 500,
    });
  }
}
