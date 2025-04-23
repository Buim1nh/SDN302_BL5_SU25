import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  }, []);

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* HEADER + SEARCH */}
      <div className="border-b">
        <nav className="flex items-center justify-between w-full mx-auto max-w-[1200px]">
          <div className="flex items-center w-full bg-white">
            <div className="flex lg:justify-start justify-between gap-10 max-w-[1150px] w-full px-3 py-5 mx-auto">
              <a href="/">
                <img width="120" src="/images/logo.svg" alt="Logo" />
              </a>

              <div className="w-full">
                <div className="relative">
                  <div className="flex items-center w-full">
                    <div className="relative flex items-center border-2 border-gray-900 w-full p-2">
                      <Search size={22} />
                      <input
                        className="w-full placeholder-gray-400 text-sm pl-3 focus:outline-none"
                        placeholder="Search for anything"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  {/* Dropdown search results */}
                  {searchQuery.length > 0 && (
                    <div className="absolute bg-white max-w-[910px] h-auto w-full z-20 left-0 top-12 border p-1">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                          <div key={product._id} className="p-1">
                            <Link
                              to={`/product/${product._id}`}
                              className="flex items-center justify-between w-full cursor-pointer hover:bg-gray-200 p-1 px-2"
                            >
                              <div className="truncate ml-2">{product.title}</div>
                              <div className="truncate">£{(product.price / 100).toFixed(2)}</div>
                            </Link>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-gray-500">No products found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* PRODUCT LIST */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">All Products</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <Link to={`/product/${product._id}`} key={product._id} className="border p-4 rounded hover:shadow-md">
                <img
                  src={product.image || "/placeholder.jpg"}
                  alt={product.title}
                  className="w-full h-40 object-cover mb-2"
                />
                <h2 className="font-semibold text-sm">{product.title}</h2>
                <p className="text-gray-600 text-sm">£{(product.price / 100).toFixed(2)}</p>
                <p className="text-xs text-gray-500">{product.quantity} available</p>
              </Link>
            ))
          ) : (
            <p>No products available</p>
          )}
        </div>
      </div>
    </>
  );
}
