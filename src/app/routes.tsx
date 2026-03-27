import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Products } from "./pages/Products";
import { ProductDetail } from "./pages/ProductDetail";
import { Admin } from "./pages/Admin";
import { Cart } from "./pages/Cart";
import { Offers } from "./pages/Offers";
import { Checkout } from "./pages/Checkout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "products", Component: Products },
      { path: "offers", Component: Offers },
      { path: "about", Component: About },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      { path: "cart", Component: Cart },
      { path: "checkout", Component: Checkout },

    ],
  },
  {
    path: "/products/:id",
    Component: Layout,
    children: [
      { index: true, Component: ProductDetail },
    ],
  },
  {
    path: "/admin",
    Component: Admin,
  }
]);