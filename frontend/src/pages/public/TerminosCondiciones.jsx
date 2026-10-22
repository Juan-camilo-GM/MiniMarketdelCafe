import LegalLayout, { SeccionLegal, FechaActualizacion } from "../../components/LegalLayout";

export default function TerminosCondiciones() {
  return (
    <LegalLayout
      titulo="Términos y Condiciones"
      resumen="Las presentes condiciones regulan el uso del portal web y la compra de productos a través de Mini Market Demo (Entorno de Demostración)."
    >
      <FechaActualizacion fecha="1 de septiembre de 2026" />

      <SeccionLegal titulo="1. Aceptación de los términos">
        <p>
          Al acceder a este sitio web y realizar una compra o prueba, el usuario acepta los presentes Términos y
          Condiciones, así como nuestra Política de Privacidad y Política de Devoluciones. Este sitio opera como
          una demostración interactiva de software para portafolio profesional.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="2. Uso del sitio web">
        <p>
          El usuario se compromete a utilizar este sitio web únicamente con fines legítimos y de prueba técnica.
          Queda prohibido cualquier uso abusivo que busque saturar la base de datos o interferir con la experiencia
          de otros visitantes de la demostración.
        </p>
        <p>
          La información de los productos (precios, descripciones e imágenes) se muestra con fines
          demostrativos e ilustrativos. Mini Market Demo mantiene un catálogo de prueba para exhibición de la funcionalidad.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="3. Proceso de compra">
        <p>
          Para simular un pedido, el usuario deberá seleccionar los productos de su interés y completar el
          formulario de checkout en el carrito.
        </p>
        <p>
          El precio de los productos se expresa en pesos colombianos (COP). Los pedidos pueden enviarse a través
          del enlace automatizado de WhatsApp configurado en el panel.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="4. Entrega y simulación">
        <p>
          En este entorno de demostración, las opciones de entrega (domicilio o retiro en tienda) sirven para calcular
          tarifas dinámicas y componer los mensajes de solicitud.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="5. Precios y pagos">
        <p>
          La plataforma permite registrar ventas en efectivo, Nequi y Daviplata. En este entorno demostrativo,
          no se realizan cobros monetarios reales con tarjetas de crédito.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="6. Propiedad intelectual">
        <p>
          El código fuente, arquitectura y diseño de este software son desarrollo de Juan Camilo para su portafolio
          profesional.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="7. Limitación de responsabilidad">
        <p>
          Mini Market Demo es un proyecto de demostración provisto tal cual ("as is") con fines de evaluación técnica.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="8. Contacto">
        <p>
          Para consultas o contacto profesional sobre este proyecto, puedes escribir a{" "}
          <span className="font-semibold text-gray-900">demo@minimarket.com</span>.
        </p>
      </SeccionLegal>
    </LegalLayout>
  );
}
