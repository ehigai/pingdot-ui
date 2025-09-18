import Container from "./components/container";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/login";
import PrivateRoute from "./components/PrivateRoute";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./api/client";

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<PrivateRoute />}>
            <Route index element={<Container />} />
          </Route>
        </Routes>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
