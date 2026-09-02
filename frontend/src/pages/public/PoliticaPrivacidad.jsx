import LegalLayout, { SeccionLegal, FechaActualizacion } from "../../components/LegalLayout";

export default function PoliticaPrivacidad() {
  return (
    <LegalLayout
      titulo="Política de Privacidad"
      resumen="En Mini Market del Café tratamos tus datos personales con transparencia y seguridad, cumpliendo con la normativa colombiana de protección de datos."
    >
      <FechaActualizacion fecha="1 de septiembre de 2026" />

      <SeccionLegal titulo="1. Responsable del tratamiento">
        <p>
          El responsable del tratamiento de los datos personales es Mini Market del Café, con domicilio en
          Armenia, Quindío (Parque Residencial del Café, Bloque 8 Apto 802). Para cualquier consulta
          relacionada con el tratamiento de tus datos, puedes escribirnos a{" "}
          <span className="font-semibold text-gray-900">contacto@minimarketcafe.com</span>.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="2. Datos que recopilamos">
        <p>
          Recopilamos la información necesaria para atender tus pedidos, entre la cual se incluye: nombre,
          teléfono, dirección de entrega, correo electrónico y el historial de compras. También podemos
          recopilar información técnica de navegación (como cookies) para mejorar tu experiencia en el sitio.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="3. Finalidad del tratamiento">
        <p>Usamos tus datos personales para:</p>
        <ul className="list-disc list-inside space-y-1.5">
          <li>Procesar, gestionar y entregar pedidos.</li>
          <li>Atender solicitudes de devolución o garantía.</li>
          <li>Comunicarnos contigo sobre el estado de tus compras.</li>
          <li>Enviar información de ofertas, siempre que hayas dado tu consentimiento.</li>
          <li>Cumplir obligaciones legales y tributarias.</li>
        </ul>
      </SeccionLegal>

      <SeccionLegal titulo="4. Almacenamiento y seguridad">
        <p>
          Implementamos medidas técnicas, administrativas y físicas razonables para proteger tus datos
          frente a pérdida, acceso no autorizado o uso indebido. Solo el personal autorizado tiene acceso a
          la información necesaria para prestar el servicio.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="5. Compartir información">
        <p>
          No vendemos ni alquilamos tus datos personales a terceros. Podemos compartirlos exclusivamente con
          proveedores necesarios para la operación del servicio (como pasarelas de pago o servicios de
          mensajería), siempre bajo acuerdos de confidencialidad y únicamente para cumplir la finalidad
          autorizada.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="6. Cookiess y navegación">
        <p>
          Este sitio puede usar cookies para recordar preferencias y analizar el tráfico. Puedes configurar
          tu navegador para rechazarlas; sin embargo, algunas funcionalidades del sitio podrían verse
          afectadas.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="7. Derechos del titular">
        <p>
          De acuerdo con la Ley 1581 de 2012, tienes derecho a conocer, actualizar, rectificar y suprimir tus
          datos, así como a revocar la autorización de su tratamiento. Puedes ejercer estos derechos
          escribiéndonos a{" "}
          <span className="font-semibold text-gray-900">contacto@minimarketcafe.com</span>.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="8. Vigencia">
        <p>
          Los datos personales se conservarán únicamente durante el tiempo que sea necesario para cumplir con
          las finalidades del tratamiento y las obligaciones legales aplicables.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="9. Cambios en la política">
        <p>
          Nos reservamos el derecho de actualizar esta Política de Privacidad. Los cambios serán publicados en
          esta página, indicando la fecha de la última actualización.
        </p>
      </SeccionLegal>
    </LegalLayout>
  );
}