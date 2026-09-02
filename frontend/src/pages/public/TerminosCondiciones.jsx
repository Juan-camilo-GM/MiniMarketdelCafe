import LegalLayout, { SeccionLegal, FechaActualizacion } from "../../components/LegalLayout";

export default function TerminosCondiciones() {
  return (
    <LegalLayout
      titulo="Términos y Condiciones"
      resumen="Las presentes condiciones regulan el uso del portal web y la compra de productos a través de Mini Market del Café."
    >
      <FechaActualizacion fecha="1 de septiembre de 2026" />

      <SeccionLegal titulo="1. Aceptación de los términos">
        <p>
          Al acceder a este sitio web y realizar una compra, el usuario acepta los presentes Términos y
          Condiciones, así como nuestra Política de Privacidad y Política de Devoluciones. Si no está de
          acuerdo con alguna de ellas, le solicitamos abstenerse de usar nuestros servicios.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="2. Uso del sitio web">
        <p>
          El usuario se compromete a utilizar este sitio web únicamente con fines legales y de acuerdo con
          lo establecido en estos términos. Queda prohibido cualquier uso que pueda dañar, sobrecargar o
          interferir con el funcionamiento normal de la plataforma.
        </p>
        <p>
          La información de los productos (precios, descripciones e imágenes) se muestra con fines
          informativos y puede variar sin previo aviso. Mini Market del Café hará todo lo posible por
          mantenerla actualizada, pero no garantiza su total exactitud.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="3. Proceso de compra">
        <p>
          Para realizar un pedido, el usuario deberá seleccionar los productos de su interés y completar el
          proceso indicado en el sitio. Todos los pedidos están sujetos a la disponibilidad de existencias.
        </p>
        <p>
          El precio de los productos es el exhibido al momento de la compra, expresado en pesos colombianos
          (COP). Mini Market del Café se reserva el derecho de rechazar o cancelar pedidos cuando se
          detecten errores en los precios, en los datos de envío o en el stock disponible.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="4. Entrega">
        <p>
          Los horarios y las zonas de entrega serán informados durante el proceso de compra o a través de
          nuestros canales de contacto. El usuario es responsable de proporcionar una dirección de entrega
          válida y de estar disponible para recibir el pedido.
        </p>
        <p>
          Una vez entregado el pedido, la responsabilidad sobre el producto pasa al cliente. Cualquier
          novedad relacionada con la entrega deberá reportarse dentro de las 24 horas siguientes.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="5. Precios y pagos">
        <p>
          Los pagos se aceptan según los medios de pago habilitados por la plataforma. Al confirmar su
          pedido, el usuario autoriza el cobro del valor total, incluidos impuestos y costos de envío si los
          hubiera.
        </p>
        <p>
          Mini Market del Café no almacena ni procesa directamente datos bancarios; estos son gestionados a
          través de pasarelas de pago seguras autorizadas.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="6. Propiedad intelectual">
        <p>
          Todos los contenidos del sitio web, incluidos textos, logos, marcas, imágenes y diseño, son
          propiedad de Mini Market del Café o de sus respectivos titulares. Queda prohibida su reproducción
          o uso sin autorización previa y por escrito.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="7. Limitación de responsabilidad">
        <p>
          Mini Market del Café no será responsable por daños indirectos o incidentales derivados del uso del
          sitio web o de la imposibilidad de completar una compra, salvo en los casos exigidos por la ley
          colombiana vigente.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="8. Ley aplicable">
        <p>
          Estos Términos y Condiciones se rigen por las leyes de la República de Colombia. Cualquier
          controversia será sometida a los jueces competentes de la ciudad de Armenia, Quindío.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="9. Contacto">
        <p>
          Para consultas relacionadas con estos términos, puede escribirnos a{" "}
          <span className="font-semibold text-gray-900">contacto@minimarketcafe.com</span> o llamar al{" "}
          <span className="font-semibold text-gray-900">+57 311 786 3431</span>.
        </p>
      </SeccionLegal>
    </LegalLayout>
  );
}