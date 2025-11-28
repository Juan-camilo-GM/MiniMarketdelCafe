// Spinner SVG simple y elegante
const BrandSpinner = (props) => (
  <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export default function SessionLoader({ message = "Comprobando sesión..." }) {
  return (
    // Contenedor principal: Fondo oscuro con desenfoque para una experiencia inmersiva.
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-900/80 backdrop-blur-md z-50 fixed inset-0">
      
      {/* Tarjeta de carga con estilo urbano y oscuro, con bordes sutiles */}
      <div className="flex flex-col items-center bg-gray-800 p-8 sm:p-10 rounded-xl shadow-2xl transition-all duration-300 transform scale-100 max-w-sm w-full 
                    border border-indigo-700/50 relative overflow-hidden">
        
        {/* Detalle de "neón" o brillo en la esquina, ahora con tus colores */}
        <div className="absolute top-0 left-0 w-1/4 h-1/4 bg-indigo-500 opacity-20 filter blur-xl"></div>
        
        {/* Spinner animado con el degradado azul-morado de tu marca */}
        <div className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 mb-5">
          {/* El spinner ahora usa el color del texto (el gradiente azul-morado) */}
          <BrandSpinner className="w-12 h-12 text-indigo-500 drop-shadow-lg" />
        </div>

        {/* Mensaje principal */}
        <h2 className="text-2xl font-extrabold text-white tracking-wide mb-2 uppercase">
          Acceso Seguro
        </h2>
        <p className="text-base text-gray-400 font-mono text-center">
          {message}
        </p>

        {/* Barra de progreso de carga con el degradado azul-morado */}
        <div className="mt-8 w-full h-2 bg-gray-700 rounded-full overflow-hidden shadow-inner">
            <div 
                // Degradado de la marca en la barra de progreso con un brillo sutil
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse transition-all duration-1000" 
                style={{ width: '50%', boxShadow: '0 0 8px rgba(99, 102, 241, 0.7)' }} // Brillo azul-morado
            ></div>
        </div>
      </div>
    </div>
  );
}