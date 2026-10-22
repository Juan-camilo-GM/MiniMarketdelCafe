import { Link } from "react-router-dom";
import { IoLogoInstagram, IoLogoFacebook, IoLogoWhatsapp, IoLocation, IoMail, IoCall } from "react-icons/io5";

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

                    {/* Columna 1: Brand */}
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black text-white tracking-tight">
                            Mini Market <span className="text-indigo-400">Demo</span>
                        </h3>
                        <p className="text-sm leading-relaxed opacity-80">
                            Aplicación web de comercio electrónico y gestión integral de minimercado (caja, pedidos, fiados y proveedores).
                        </p>
                        <div className="flex gap-4 pt-2">
                            <span className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all duration-300 cursor-pointer">
                                <IoLogoInstagram size={20} />
                            </span>
                            <span className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300 cursor-pointer">
                                <IoLogoFacebook size={20} />
                            </span>
                            <span className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all duration-300 cursor-pointer">
                                <IoLogoWhatsapp size={20} />
                            </span>
                        </div>
                    </div>

                    {/* Columna 2: Enlaces */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Enlaces Rápidos</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/catalogo" className="hover:text-indigo-400 transition-colors">Catálogo</Link></li>
                            <li><Link to="/admin/login" className="hover:text-indigo-400 transition-colors">Panel Admin (Demo)</Link></li>
                            <li><Link to="/terminos-y-condiciones" className="hover:text-indigo-400 transition-colors">Términos y Condiciones</Link></li>
                        </ul>
                    </div>

                    {/* Columna 3: Legal */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Legal</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/terminos-y-condiciones" className="hover:text-indigo-400 transition-colors">Términos y Condiciones</Link></li>
                            <li><Link to="/politica-de-privacidad" className="hover:text-indigo-400 transition-colors">Política de Privacidad</Link></li>
                            <li><Link to="/politica-de-devoluciones" className="hover:text-indigo-400 transition-colors">Política de Devoluciones</Link></li>
                        </ul>
                    </div>

                    {/* Columna 4: Contacto */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Información Demo</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <IoLocation className="text-indigo-500 text-lg shrink-0 mt-0.5" />
                                <span>Entorno de demostración técnica<br />Portafolio Juan Camilo</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <IoCall className="text-indigo-500 text-lg shrink-0" />
                                <span>+57 300 000 0000</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <IoMail className="text-indigo-500 text-lg shrink-0" />
                                <span>demo@minimarket.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium opacity-60">
                    <p>© {new Date().getFullYear()} Mini Market Demo. Proyecto de demostración para portafolio.</p>
                    <p></p>
                </div>
            </div>
        </footer>
    );
}
