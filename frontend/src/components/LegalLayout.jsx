import { Link } from "react-router-dom";
import { IoChevronBack, IoDocumentText } from "react-icons/io5";

export default function LegalLayout({ titulo, resumen, children }) {
  return (
    <div className="bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm font-medium transition-colors"
          >
            <IoChevronBack className="text-lg" />
            Volver al catálogo
          </Link>

          <div className="mt-6 flex items-start gap-5">
            <div className="hidden sm:flex w-14 h-14 shrink-0 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 items-center justify-center text-white shadow-lg">
              <IoDocumentText className="text-3xl" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                {titulo}
              </h1>
              {resumen && (
                <p className="mt-2 text-indigo-100 max-w-2xl text-sm sm:text-base">
                  {resumen}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/50 ring-1 ring-gray-100 px-5 sm:px-8 md:px-12 py-8 sm:py-12 space-y-8">
          {children}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8 font-medium">
          Mini Market del Café · Armenia, Quindío — Colombia
        </p>
      </div>
    </div>
  );
}

export function SeccionLegal({ titulo, children }) {
  return (
    <section>
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 flex items-center gap-2.5">
        <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-purple-600 to-indigo-600 inline-block"></span>
        {titulo}
      </h2>
      <div className="text-sm leading-relaxed text-slate-600 space-y-3 ml-4">
        {children}
      </div>
    </section>
  );
}

export function FechaActualizacion({ fecha }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500 bg-indigo-50 rounded-xl px-4 py-2.5 w-fit">
      <IoDocumentText className="text-base" />
      Última actualización: {fecha}
    </div>
  );
}