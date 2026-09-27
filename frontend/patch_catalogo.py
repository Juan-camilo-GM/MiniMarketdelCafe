import re

with open("src/pages/public/Catalogo.jsx", "r") as f:
    content = f.read()

# The part to replace starts exactly at "return (\n    <div className=\"bg-gray-50/50 min-h-screen pb-20\">\n"
# and ends at "const enCarrito = carrito.find((item) => item.id === producto.id);"

pattern = r'return \(\s*<div className="bg-gray-50/50 min-h-screen pb-20">.*?(?=const enCarrito = carrito\.find\(\(item\) => item\.id === producto\.id\);)'

replacement = """return (
    <div className="bg-gray-50/50 min-h-screen pb-20">
      <div className="max-w-[1600px] mx-auto w-full pt-4 md:pt-8 px-4 md:px-8 lg:px-12">
        
        {/* Layout Flex: Sidebar + Main */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          
          {/* Sidebar Categorías Desktop */}
          <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
            <div className="sticky top-28 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4 text-lg px-2">Categorías</h3>
              <nav className="space-y-1">
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete("categoria");
                    setSearchParams(newParams);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer ${!categoriaUrl ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  🎉 Ver Todo
                </button>
                {categorias.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set("categoria", cat.id);
                      setSearchParams(newParams);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer ${categoriaUrl === cat.id.toString() ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {cat.nombre}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Breadcrumb Mobile & Desktop */}
            <div className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 w-fit">
                {categoriaUrl && catMap[categoriaUrl] ? (
                  <>
                    <span>Catálogo</span>
                    <span className="text-gray-300">/</span>
                    <span className="font-bold text-indigo-600">{catMap[categoriaUrl]}</span>
                    <button
                      onClick={() => {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete("categoria");
                        setSearchParams(newParams);
                      }}
                      className="ml-2 text-red-500 hover:text-red-600 text-xs font-bold hover:underline cursor-pointer"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <span className="font-bold text-gray-900">Todos los productos</span>
                )}
              </div>
            </div>

            {/* Contenedor del Grid */}
            <div id="catalogo" className={`w-full ${categoriaUrl ? 'pt-2' : 'pt-2'}`}>
              
              {/* Banner de Ofertas */}
              {!cargando && !categoriaUrl && !busqueda && productos.some(p => p.is_featured) && (
                <div className="mb-8">
                  <BannerOfertas productos={productos} agregarAlCarrito={agregarAlCarrito} />
                </div>
              )}

              {cargando ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-5">
                  {[...Array(10)].map((_, i) => (
                    <ProductoSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {productosVisibles.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-5">
                      {productosVisibles.map((producto) => {
                        """

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open("src/pages/public/Catalogo.jsx", "w") as f:
    f.write(new_content)

