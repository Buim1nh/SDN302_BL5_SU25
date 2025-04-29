"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainHeader from "../../components/MainHeader";
import TopMenu from "../../components/TopMenu";
import SubMenu from "../../components/SubMenu";
import {
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaTrashAlt,
  FaGavel
} from "react-icons/fa";

const SellerProducts = () => {
  const navigate = useNavigate();
  const [productsDetails, setProductsDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("title");
  const [sortDirection, setSortDirection] = useState("asc");

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !currentUser.id) {
        setError("Vui lòng đăng nhập để xem sản phẩm của bạn.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/api/products/seller/${currentUser.id}/on-sale`
        );
        if (!response.ok) {
          throw new Error("Không thể lấy danh sách sản phẩm của người bán.");
        }
        const data = await response.json();
        setProductsDetails(data);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);
  const handleDeleteProduct = async (idProduct) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${idProduct}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Không thể xóa sản phẩm.");

      // Xóa sản phẩm khỏi danh sách hiển thị
      setProductsDetails(
        productsDetails.filter((product) => product._id !== idProduct)
      );
      alert("Sản phẩm đã được xóa thành công.");
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Không thể xóa sản phẩm: " + err.message);
    }
  };
  const handleToggleAuction = async (idProduct, currentAuctionStatus) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn ${
          currentAuctionStatus ? "tắt" : "bật"
        } đấu giá cho sản phẩm này không?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${idProduct}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isAuction: !currentAuctionStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Không thể cập nhật trạng thái đấu giá.");
      }

      // Cập nhật trạng thái đấu giá trong danh sách sản phẩm
      setProductsDetails((prevProducts) =>
        prevProducts.map((product) =>
          product._id === idProduct
            ? { ...product, isAuction: !currentAuctionStatus }
            : product
        )
      );

      alert(`Đã ${currentAuctionStatus ? "tắt" : "bật"} đấu giá cho sản phẩm.`);
    } catch (err) {
      console.error("Toggle Auction Error:", err);
      alert("Không thể thay đổi trạng thái đấu giá: " + err.message);
    }
  };

  const handleSort = (field) => {
    const newDirection =
      field === sortField && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
  };

  const getSortIcon = (field) => {
    if (field !== sortField) return <FaSort className="inline ml-1" />;
    return sortDirection === "asc" ? (
      <FaSortUp className="inline ml-1" />
    ) : (
      <FaSortDown className="inline ml-1" />
    );
  };

  const filteredProducts = productsDetails.filter((product) => {
    return (
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let valueA = a[sortField] || "";
    let valueB = b[sortField] || "";

    if (sortField === "price" || sortField === "quantity") {
      valueA = parseFloat(valueA);
      valueB = parseFloat(valueB);
    }

    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  if (!currentUser || !currentUser.id) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Chưa đăng nhập
          </h2>
          <p className="text-gray-600 mb-6">
            Vui lòng đăng nhập để quản lý sản phẩm của bạn.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Đã xảy ra lỗi
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div>
        <TopMenu />
        <MainHeader />
        <SubMenu />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Quản lý sản phẩm
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Danh sách sản phẩm của bạn
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm sản phẩm..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Hình ảnh
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("title")}
                  >
                    Tên sản phẩm {getSortIcon("title")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Mô tả
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("price")}
                  >
                    Giá (£) {getSortIcon("price")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("quantity")}
                  >
                    Số lượng {getSortIcon("quantity")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Đấu giá
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      {searchTerm
                        ? "Không tìm thấy sản phẩm phù hợp."
                        : "Chưa có sản phẩm nào."}
                    </td>
                  </tr>
                ) : (
                  sortedProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-16 h-16 object-cover rounded-md border border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                            N/A
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {product.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        £{product.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {product.isAuction ? (
                          <span className="text-green-600 font-semibold">
                            Đang đấu giá
                          </span>
                        ) : (
                          <span className="text-red-600 font-semibold">
                            Không
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Xóa sản phẩm"
                        >
                          <FaTrashAlt className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() =>
                            handleToggleAuction(product._id, product.isAuction)
                          }
                          className={`${
                            product.isAuction
                              ? "text-yellow-600 hover:text-yellow-900"
                              : "text-gray-600 hover:text-gray-900"
                          } transition-colors`}
                          title={
                            product.isAuction ? "Tắt đấu giá" : "Bật đấu giá"
                          }
                        >
                          <FaGavel className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProducts;
