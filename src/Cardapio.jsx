import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

import { HiPlus, HiTrash, HiPencil, HiX } from "react-icons/hi";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function Cardapio() {
  const [produtos, setProdutos] = useState([]);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [editarId, setEditarId] = useState(null);
  const [excluirId, setExcluirId] = useState(null);
  const [showModalExcluir, setShowModalExcluir] = useState(false);

  useEffect(() => {
    buscarProdutos();
  }, []);

  async function buscarProdutos() {
    try {
      const produtosCol = collection(db, "produtos");
      const q = query(produtosCol, orderBy("nome"));
      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProdutos(lista);
    } catch (error) {
      console.error("Erro ao buscar produtos: ", error);
    }
  }

  async function adicionarOuEditarProduto(e) {
    e.preventDefault();
    if (!nome.trim() || !preco.trim()) return;

    try {
      if (editarId) {
        // editar
        const produtoDoc = doc(db, "produtos", editarId);
        await updateDoc(produtoDoc, {
          nome,
          preco: parseFloat(preco),
        });
        setEditarId(null);
      } else {
        // adicionar
        await addDoc(collection(db, "produtos"), {
          nome,
          preco: parseFloat(preco),
        });
      }
      setNome("");
      setPreco("");
      buscarProdutos();
    } catch (error) {
      console.error("Erro ao salvar produto: ", error);
    }
  }

  function iniciarEdicao(produto) {
    setEditarId(produto.id);
    setNome(produto.nome);
    setPreco(produto.preco.toString());
  }

  function cancelarEdicao() {
    setEditarId(null);
    setNome("");
    setPreco("");
  }

  function confirmarExclusao(id) {
    setExcluirId(id);
    setShowModalExcluir(true);
  }

  async function apagarProduto() {
    if (!excluirId) return;
    try {
      await deleteDoc(doc(db, "produtos", excluirId));
      setExcluirId(null);
      setShowModalExcluir(false);
      buscarProdutos();
    } catch (error) {
      console.error("Erro ao apagar produto: ", error);
    }
  }

  // Função para gerar o PDF em tabela
  function gerarPDF() {
    const doc = new jsPDF();

    doc.text("Cardápio de Produtos", 14, 20);
    doc.setFontSize(12);

    // Cabeçalho da tabela
    const head = [["Nome do Produto", "Preço (R$)"]];

    // Dados da tabela
    const data = produtos.map((produto) => [
      produto.nome,
      produto.preco.toFixed(2),
    ]);

    // Gerar tabela com plugin autoTable
    autoTable(doc, {
      startY: 30,
      head: head,
      body: data,
      styles: { fontSize: 12 },
      headStyles: { fillColor: [41, 128, 185] }, // azul
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    doc.save("cardapio.pdf");
  }

  return (
    <div className="max-w-lg mx-auto p-4 bg-white rounded shadow-md min-h-screen flex flex-col">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Cardápio</h1>

      {/* Botão para salvar PDF */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={gerarPDF}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
          aria-label="Salvar cardápio em PDF"
        >
          Salvar PDF
        </button>
      </div>

      {/* Formulário - inputs grandes para celular */}
      <form
        onSubmit={adicionarOuEditarProduto}
        className="flex flex-col gap-4 mb-6"
        aria-label={editarId ? "Editar produto" : "Adicionar produto"}
      >
        <input
          type="text"
          placeholder="Nome do produto"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full text-lg border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          aria-label="Nome do produto"
          autoComplete="off"
        />
        <input
          type="number"
          placeholder="Preço"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          className="w-full text-lg border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          min="0"
          step="0.01"
          aria-label="Preço do produto"
        />

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded py-3 flex-grow transition"
            aria-label={editarId ? "Salvar alterações" : "Adicionar produto"}
          >
            <HiPlus size={24} />
            {editarId ? "Salvar" : "Adicionar"}
          </button>
          {editarId && (
            <button
              type="button"
              onClick={cancelarEdicao}
              className="flex items-center justify-center gap-2 bg-gray-400 hover:bg-gray-500 text-white text-lg font-semibold rounded py-3 flex-grow transition"
              aria-label="Cancelar edição"
            >
              <HiX size={24} />
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Lista de produtos */}
      <div className="overflow-auto flex-grow">
        {produtos.length === 0 ? (
          <p className="text-center text-gray-500">Nenhum produto cadastrado.</p>
        ) : (
          <ul className="space-y-4">
            {produtos.map(({ id, nome, preco }) => (
              <motion.li
                key={id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gray-50 p-4 rounded shadow flex flex-col sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 flex-grow">
                  <span className="font-semibold text-lg truncate">{nome}</span>
                  <span className="flex items-center gap-1 text-green-700 font-semibold">
                    R$ {preco.toFixed(2)}
                  </span>
                </div>

                <div className="flex gap-4 mt-3 sm:mt-0">
                  <button
                    onClick={() => iniciarEdicao({ id, nome, preco })}
                    className="p-3 rounded-md bg-yellow-400 hover:bg-yellow-500 text-white transition flex items-center justify-center"
                    aria-label={`Editar produto ${nome}`}
                    style={{ minWidth: 48, minHeight: 48 }}
                  >
                    <HiPencil size={24} />
                  </button>
                  <button
                    onClick={() => confirmarExclusao(id)}
                    className="p-3 rounded-md bg-red-600 hover:bg-red-700 text-white transition flex items-center justify-center"
                    aria-label={`Excluir produto ${nome}`}
                    style={{ minWidth: 48, minHeight: 48 }}
                  >
                    <HiTrash size={24} />
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal exclusão */}
      <AnimatePresence>
        {showModalExcluir && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-modal="true"
            role="dialog"
            aria-labelledby="modal-excluir-titulo"
            aria-describedby="modal-excluir-desc"
          >
            <motion.div
              className="bg-white rounded-lg p-6 max-w-sm w-full"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h2
                id="modal-excluir-titulo"
                className="text-xl font-semibold mb-4 text-center"
              >
                Confirma exclusão?
              </h2>
              <p id="modal-excluir-desc" className="mb-6 text-center text-gray-700">
                Tem certeza que deseja apagar este produto? Essa ação não pode ser
                desfeita.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowModalExcluir(false)}
                  className="px-5 py-3 bg-gray-300 rounded hover:bg-gray-400 transition text-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={apagarProduto}
                  className="px-5 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition text-lg"
                >
                  Apagar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Cardapio;
