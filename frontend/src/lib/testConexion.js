import { supabase } from "./supabase";

export async function probarConexion() {
  const { data: tablas } = await supabase.rpc("pg_tables");
  console.log("LISTA DE TABLAS:", tablas);
}
