import { IoLogoInstagram, IoLogoFacebook, IoLogoWhatsapp, IoLocation, IoMail, IoCall } from "react-icons/io5";

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

                    {/* Columna 1: Brand */}
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black text-white tracking-tight">
                            Mini Market <span className="text-indigo-400">del Café</span>
                        </h3>
                        <p className="text-sm leading-relaxed opacity-80">
                            Tu tienda de confianza con los productos más frescos y la mejor atención.
                            Calidad y precio justo en cada compra.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all duration-300">
                                <IoLogoInstagram size={20} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300">
                                <IoLogoFacebook size={20} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all duration-300">
                                <IoLogoWhatsapp size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Columna 2: Enlaces */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Enlaces Rápidos</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Inicio</a></li>
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Catálogo</a></li>
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Ofertas</a></li>
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Contacto</a></li>
                        </ul>
                    </div>

                    {/* Columna 3: Legal */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Legal</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Términos y Condiciones</a></li>
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Política de Privacidad</a></li>
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Política de Devoluciones</a></li>
                        </ul>
                    </div>

                    {/* Columna 4: Contacto */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Contáctanos</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <IoLocation className="text-indigo-500 text-lg shrink-0" />
                                <span>Armenia, Quindío <br />Parque Residencial del Café <br />Bloque 8 Apto 802</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <IoCall className="text-indigo-500 text-lg shrink-0" />
                                <span>+57 300 123 4567</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <IoMail className="text-indigo-500 text-lg shrink-0" />
                                <span>contacto@minimarketcafe.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium opacity-60">
                    <p>© {new Date().getFullYear()} Mini Market del Café. Todos los derechos reservados.</p>
                    <p></p>
                </div>
            </div>
        </footer>
    );
}
