import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // intentamos login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message || "Error al iniciar sesión");
      setLoading(false);
      return;
    }

    // si hay sesión, verificamos que sea admin (tabla admins)
    const user = data?.user;
    if (!user) {
      alert("No se pudo obtener información del usuario.");
      setLoading(false);
      return;
    }

    const { data: admins, error: errAdm } = await supabase
      .from("admins")
      .select("id,user_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (errAdm) {
      console.error(errAdm);
      alert("Error verificando permisos de admin.");
      setLoading(false);
      return;
    }

    if (!admins) {
      // no es admin
      alert("Este usuario no tiene permisos de administrador.");
      // opcional: cerrar sesión
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // ok — redirigir al panel admin
    navigate("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Ingreso administrador</h2>
        <label className="block mb-2">
          <span className="text-sm">Email</span>
          <input
            className="mt-1 w-full border p-2 rounded"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block mb-4">
          <span className="text-sm">Contraseña</span>
          <input
            className="mt-1 w-full border p-2 rounded"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </form>
    </div>
  );
}
