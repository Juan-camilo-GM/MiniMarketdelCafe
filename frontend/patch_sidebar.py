import re

with open("src/pages/public/Catalogo.jsx", "r") as f:
    content = f.read()

pattern = r'<aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0">.*?</aside>'

replacement = """<aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
            <div className="sticky top-28">
              <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                    <IoGrid className="text-indigo-500 text-lg" />
                    Categorías
                  </h3>
                </div>
                <nav className="p-3 space-y-1">
                  <button
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.delete("categoria");
                      setSearchParams(newParams);
                    }}
                    className={`group w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer ${!categoriaUrl ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                  >
                    <span className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${!categoriaUrl ? 'bg-white' : 'bg-slate-300 group-hover:bg-indigo-400'} transition-colors`} />
                      Todos los productos
                    </span>
                    {!categoriaUrl && <IoChevronForward className="text-white opacity-80" />}
                  </button>
                  {categorias.map(cat => {
                    const isActive = categoriaUrl === cat.id.toString();
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          const newParams = new URLSearchParams(searchParams);
                          newParams.set("categoria", cat.id);
                          setSearchParams(newParams);
                        }}
                        className={`group w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                      >
                        <span className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-slate-300 group-hover:bg-indigo-400'} transition-colors`} />
                          {cat.nombre}
                        </span>
                        {isActive && <IoChevronForward className="text-white opacity-80" />}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>"""

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open("src/pages/public/Catalogo.jsx", "w") as f:
    f.write(new_content)
