import LegalLayout, { SeccionLegal, FechaActualizacion } from "../../components/LegalLayout";

export default function PoliticaDevoluciones() {
  return (
    <LegalLayout
      titulo="Política de Devoluciones"
      resumen="Queremos que tu experiencia de compra sea la mejor. Conoce cómo y en qué casos puedes realizar devoluciones o cambios."
    >
      <FechaActualizacion fecha="1 de septiembre de 2026" />

      <SeccionLegal titulo="1. Plazo para solicitudes">
        <p>
          Dispones de un plazo máximo de <span className="font-semibold text-gray-900">48 horas</span> a
          partir de la entrega del pedido para reportar cualquier novedad (producto incorrecto, en mal estado
          o con problemas de calidad), contactando nuestros canales de atención.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="2. Casos de devolución válidos">
        <p>Podrás solicitar una devolución o cambio cuando:</p>
        <ul className="list-disc list-inside space-y-1.5">
          <li>El producto llegue en mal estado o con deterioro visible.</li>
          <li>El producto no corresponda al solicitado (error en el despacho).</li>
          <li>El producto presente vencimiento cercano o evidencias de manipulación indebida.</li>
          <li>La entrega no se realice de acuerdo con lo pactado.</li>
        </ul>
      </SeccionLegal>

      <SeccionLegal titulo="3. Productos excluidos">
        <p>
          Dadas las características de nuestro catálogo (productos de consumo y perecederos), no se aceptan
          devoluciones por cambio de opinión, gusto personal o cuando el producto haya sido manipulado o
          consumido parcialmente por el cliente.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="4. Procedimiento para solicitar una devolución">
        <p>
          Para reportar una novedad, contáctanos por WhatsApp al{" "}
          <span className="font-semibold text-gray-900">+57 311 786 3431</span> o al correo{" "}
          <span className="font-semibold text-gray-900">contacto@minimarketcafe.com</span> indicando:
        </p>
        <ul className="list-disc list-inside space-y-1.5">
          <li>Número de pedido.</li>
          <li>Descripción del problema.</li>
          <li>Fotografías del producto o del empaque (si aplica).</li>
        </ul>
      </SeccionLegal>

      <SeccionLegal titulo="5. Reembolsos">
        <p>
          Una vez validada la solicitud, el reembolso se realizará por el mismo medio de pago utilizado en la
          compra. Los tiempos de acreditación dependen de la entidad bancaria o de la pasarela de pagos (en
          promedio de 3 a 10 días hábiles).
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="6. Cambios de producto">
        <p>
          Si prefieres un cambio, este estará sujeto a la disponibilidad de existencias. En caso de no
          disponer del producto, se procederá a un reembolso total del valor pagado.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="7. Excepción por garantía de calidad">
        <p>
          Mini Market del Café se compromete con la calidad de sus productos. Si detectas cualquier
          irregularidad fuera de los plazos mencionados, escríbenos y evaluaremos tu caso de manera
          particular.
        </p>
      </SeccionLegal>
    </LegalLayout>
  );
}