import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";

import {
  HiCurrencyDollar,
  HiTrash,
  HiCheck,
  HiPlus,
  HiX,
  HiPencil,
  HiCheckCircle,
  HiDownload,
} from "react-icons/hi";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [excluirId, setExcluirId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [editValores, setEditValores] = useState({});
  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    const clientesCol = collection(db, "clientes");
    const q = query(clientesCol, orderBy("nome"), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClientes(lista);
      setEditandoId(null);
      setEditValores({});
    });

    return () => unsubscribe();
  }, []);

  async function adicionarCliente(e) {
    e.preventDefault();
    if (!nome.trim() || !valor.trim()) return;

    try {
      await addDoc(collection(db, "clientes"), {
        nome,
        valor: parseFloat(valor),
        quitado: parseFloat(valor) === 0, // já define quitado se valor for 0
      });
      setNome("");
      setValor("");
    } catch (error) {
      console.error("Erro ao adicionar cliente: ", error);
    }
  }

  async function quitarCliente(id, quitado) {
    try {
      const clienteDoc = doc(db, "clientes", id);
      await updateDoc(clienteDoc, {
        quitado: !quitado,
        valor: !quitado ? 0 : undefined, // se marcar quitado, zera valor, senão mantém
      });
    } catch (error) {
      console.error("Erro ao quitar cliente: ", error);
    }
  }

  async function confirmarExclusao(id) {
    setExcluirId(id);
    setShowModal(true);
  }

  async function apagarCliente() {
    if (!excluirId) return;
    try {
      await deleteDoc(doc(db, "clientes", excluirId));
      setExcluirId(null);
      setShowModal(false);
    } catch (error) {
      console.error("Erro ao apagar cliente: ", error);
    }
  }

  async function salvarValorEditado(id) {
    const novoValor = parseFloat(editValores[id]);
    if (isNaN(novoValor) || novoValor < 0) return;

    try {
      const clienteDoc = doc(db, "clientes", id);
      await updateDoc(clienteDoc, {
        valor: novoValor,
        quitado: novoValor === 0, // atualiza quitado conforme valor
      });
      setEditandoId(null);
      setEditValores((prev) => {
        const novo = { ...prev };
        delete novo[id];
        return novo;
      });
    } catch (error) {
      console.error("Erro ao atualizar valor: ", error);
    }
  }

  const clientesFiltrados = clientes.filter((cliente) => {
    if (filtro === "quitado") return cliente.quitado;
    if (filtro === "devedor") return !cliente.quitado;
    return true;
  });

  function gerarPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(
      "Lista de Clientes - " +
        (filtro === "todos"
          ? "Todos"
          : filtro === "quitado"
          ? "Quitados"
          : "Devedores"),
      14,
      22
    );

    doc.setFontSize(12);
    let y = 30;

    if (clientesFiltrados.length === 0) {
      doc.text("Nenhum cliente encontrado.", 14, y);
    } else {
      clientesFiltrados.forEach((cliente, index) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(
          `${index + 1}. ${cliente.nome} - R$ ${cliente.valor.toFixed(2)} - ${
            cliente.quitado ? "Quitado" : "Devedor"
          }`,
          14,
          y
        );
        y += 10;
      });
    }
    doc.save(`clientes_${filtro}.pdf`);
  }

  return (
    <div className="max-w-lg mx-auto p-4 bg-white rounded shadow-md min-h-screen flex flex-col">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
        Controle de Clientes
      </h1>

      <form onSubmit={adicionarCliente} className="flex flex-col gap-4 mb-6">
        <input
          type="text"
          placeholder="Nome do cliente"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full text-lg border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          aria-label="Nome do cliente"
          autoComplete="off"
        />
        <input
          type="number"
          placeholder="Valor devido"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-full text-lg border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          min="0"
          step="0.01"
          aria-label="Valor devido"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded py-3 transition"
          aria-label="Adicionar cliente"
        >
          <HiPlus size={24} />
          Adicionar
        </button>
      </form>

      <div className="flex justify-center gap-3 mb-4 flex-wrap">
        {["todos", "quitado", "devedor"].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-5 py-2 rounded text-sm font-medium min-w-[80px] transition ${
              filtro === f
                ? f === "quitado"
                  ? "bg-green-600 text-white"
                  : f === "devedor"
                  ? "bg-red-600 text-white"
                  : "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            aria-pressed={filtro === f}
            aria-label={`Filtrar ${f}`}
          >
            {f === "todos"
              ? "Todos"
              : f === "quitado"
              ? "Quitados"
              : "Devedores"}
          </button>
        ))}

        <button
          onClick={gerarPDF}
          className="ml-4 flex items-center gap-2 px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
          aria-label={`Salvar lista ${filtro} em PDF`}
        >
          <HiDownload size={20} />
          Salvar PDF
        </button>
      </div>

      <div className="overflow-auto flex-grow">
        {clientesFiltrados.length === 0 ? (
          <p className="text-center text-gray-500">Nenhum cliente encontrado.</p>
        ) : (
          <ul className="space-y-4">
            {clientesFiltrados.map(({ id, nome, valor, quitado }) => (
              <motion.li
                key={id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gray-50 p-4 rounded shadow flex flex-col sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 flex-grow">
                  <span className="font-semibold text-lg truncate">{nome}</span>

                  {editandoId === id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        salvarValorEditado(id);
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          editValores[id] !== undefined
                            ? editValores[id]
                            : valor.toFixed(2)
                        }
                        onChange={(e) =>
                          setEditValores((prev) => ({
                            ...prev,
                            [id]: e.target.value,
                          }))
                        }
                        className="w-24 text-lg border border-gray-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Editar valor de dívida do cliente ${nome}`}
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="p-2 bg-green-600 hover:bg-green-700 rounded text-white flex items-center justify-center"
                        aria-label="Salvar valor"
                      >
                        <HiCheckCircle size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditandoId(null);
                          setEditValores((prev) => {
                            const novo = { ...prev };
                            delete novo[id];
                            return novo;
                          });
                        }}
                        className="p-2 bg-gray-400 hover:bg-gray-500 rounded text-white flex items-center justify-center"
                        aria-label="Cancelar edição"
                      >
                        <HiX size={20} />
                      </button>
                    </form>
                  ) : (
                    <span className="flex items-center gap-1 text-green-700 font-semibold cursor-pointer select-none">
                      <HiCurrencyDollar />
                      {valor.toFixed(2)}
                      <button
                        onClick={() => setEditandoId(id)}
                        className="ml-2 p-1 bg-blue-500 hover:bg-blue-600 rounded text-white flex items-center justify-center"
                        aria-label={`Editar valor do cliente ${nome}`}
                      >
                        <HiPencil size={16} />
                      </button>
                    </span>
                  )}

                  <span
                    className={`text-sm font-medium rounded px-2 py-1 w-fit ${
                      quitado
                        ? "bg-green-200 text-green-800"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    {quitado ? "Quitado" : "Devedor"}
                  </span>
                </div>

                <div className="flex gap-4 mt-3 sm:mt-0">
                  <button
                    onClick={() => quitarCliente(id, quitado)}
                    className={`p-3 rounded-md flex items-center justify-center ${
                      quitado
                        ? "bg-yellow-400 hover:bg-yellow-500"
                        : "bg-green-600 hover:bg-green-700"
                    } text-white transition`}
                    aria-label={quitado ? "Desmarcar quitado" : "Marcar como quitado"}
                    style={{ minWidth: 48, minHeight: 48 }}
                  >
                    {quitado ? <HiX size={24} /> : <HiCheck size={24} />}
                  </button>
                  <button
                    onClick={() => confirmarExclusao(id)}
                    className="p-3 rounded-md bg-red-600 hover:bg-red-700 text-white transition flex items-center justify-center"
                    aria-label="Excluir cliente"
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

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-modal="true"
            role="dialog"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
          >
            <motion.div
              className="bg-white rounded-lg p-6 max-w-sm w-full"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h2
                id="modal-title"
                className="text-xl font-semibold mb-4 text-center"
              >
                Confirma exclusão?
              </h2>
              <p id="modal-description" className="mb-6 text-center text-gray-700">
                Tem certeza que deseja apagar este cliente? Essa ação não pode ser
                desfeita.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={apagarCliente}
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white transition"
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

export default Clientes;
