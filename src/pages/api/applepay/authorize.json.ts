import type { APIContext } from 'astro';

// En producción, aquí recibes el token/`payment.token` (PaymentData) y lo envías
// al procesador/pasarela para autorización/captura. Aquí simulamos el flujo.

export async function POST({ request }: APIContext): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { payment } = await request.json();
    if (!payment) {
      return new Response(JSON.stringify({ message: 'Objeto payment requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // payment.token: contiene el payload cifrado que debe enviarse al gateway
    const processedData = {
      status: 'approved',
      reference: 'TEST-APPLEPAY-12345',
      amount: '10.00',
      currency: 'USD',
      // Nunca registres datos sensibles. Esto es una simulación.
      tokenSummary: payment?.token ? 'token recibido' : 'sin token',
      payer: {
        name: payment?.billingContact?.givenName || 'N/A',
        email: payment?.billingContact?.emailAddress || 'N/A',
      },
    };

    return new Response(
      JSON.stringify({ ok: true, processedData }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Error en autorización', error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


