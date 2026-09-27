import CartLoader from "./ui/CartLoader";
export default function SessionLoader({ message = "Comprobando sesión..." }) {
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-white fixed inset-0 z-50">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner simple y limpio */}
        <CartLoader size="large" />
        
        {/* Mensaje */}
        <p className="text-gray-600 font-medium">
          {message}
        </p>
      </div>
    </div>
  );
}