import React, { useState, useEffect } from "react";
import Clientes from "./Clientes";
import Cardapio from "./Cardapio";

function App() {
  const [tela, setTela] = useState("clientes");
  const [darkMode, setDarkMode] = useState(false);

  // Efeito para adicionar/remover classe dark no html
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <nav className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded ${
              tela === "clientes"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
            }`}
            onClick={() => setTela("clientes")}
          >
            Clientes
          </button>
          <button
            className={`px-4 py-2 rounded ${
              tela === "cardapio"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
            }`}
            onClick={() => setTela("cardapio")}
          >
            Cardápio
          </button>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 dark:text-gray-200 transition-colors"
          aria-label="Alternar modo escuro"
        >
          {darkMode ? "☀️ Claro" : "🌙 Escuro"}
        </button>
      </nav>

      {tela === "clientes" && <Clientes />}
      {tela === "cardapio" && <Cardapio />}
    </div>
  );
}

export default App;
