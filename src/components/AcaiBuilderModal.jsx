import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function AcaiBuilderModal({ open, onClose, lojaId = "daypizza", onAdd }) {
  const [bases, setBases] = useState([]);
  const [complementos, setComplementos] = useState({});
  const [combos, setCombos] = useState([]);

  const [selectedBase, setSelectedBase] = useState(null);
  const [selectedComplementos, setSelectedComplementos] = useState({});
  const [selectedCombo, setSelectedCombo] = useState(null);

  // carregar dados configurados pelo admin
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const ref = doc(db, "lojas", lojaId, "opcoes", "Acai");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setBases(data.bases || []);
        setComplementos(data.complementos || {});
        setCombos(data.combos || []);
      }
    };
    load();
    // reset ao abrir
    setSelectedBase(null);
    setSelectedComplementos({});
    setSelectedCombo(null);
  }, [open, lojaId]);

  const toggleComplemento = (grupo, item) => {
    const current = selectedComplementos[grupo] || [];
    const exists = current.find((c) => c.nome === item.nome);
    const next = exists
      ? current.filter((c) => c.nome !== item.nome)
      : [...current, item];
    setSelectedComplementos({ ...selectedComplementos, [grupo]: next });
  };

  const handleConfirm = () => {
    if (!selectedBase && !selectedCombo) {
      alert("Selecione um tamanho ou combo!");
      return;
    }

    let preco = 0;
    let descricao = "";

    if (selectedCombo) {
      preco = selectedCombo.preco;
      descricao = selectedCombo.descricao || "";
    } else if (selectedBase) {
      preco = selectedBase.preco;
      descricao =
        Object.values(selectedComplementos)
          .flat()
          .map((c) => c.nome)
          .join(", ") || "Sem complementos";
    }

    onAdd({
      id: Date.now().toString(),
      name: "Açaí",
      category: "Acai",
      description: descricao,
      size: selectedCombo ? "Combo" : selectedBase?.nome,
      price: preco + Object.values(selectedComplementos).flat().reduce((a, c) => a + (c.preco || 0), 0),
      image: "🍧",
      qty: 1,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">🍧 Monte seu Açaí</h2>

        {/* Combos */}
        {combos.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Combos</h3>
            <div className="space-y-2">
              {combos.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedCombo(c)}
                  className={`w-full p-3 rounded border ${
                    selectedCombo?.nome === c.nome ? "bg-purple-600 text-white" : "bg-gray-100"
                  }`}
                >
                  <div className="font-medium">{c.nome}</div>
                  <div className="text-sm">{c.descricao}</div>
                  <div className="text-sm font-bold">R$ {c.preco.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bases */}
        {bases.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Tamanhos</h3>
            <div className="flex flex-wrap gap-2">
              {bases.map((b, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedBase(b);
                    setSelectedCombo(null); // desmarcar combo
                  }}
                  className={`px-3 py-2 rounded border ${
                    selectedBase?.nome === b.nome ? "bg-purple-600 text-white" : "bg-gray-100"
                  }`}
                >
                  {b.nome} - R$ {b.preco.toFixed(2)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Complementos */}
        {Object.keys(complementos).length > 0 && selectedBase && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Complementos</h3>
            {Object.entries(complementos).map(([grupo, itens]) => (
              <div key={grupo} className="mb-3">
                <h4 className="capitalize font-medium">{grupo}</h4>
                <div className="flex flex-wrap gap-2">
                  {itens.map((item, i) => {
                    const ativo = (selectedComplementos[grupo] || []).find((c) => c.nome === item.nome);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleComplemento(grupo, item)}
                        className={`px-3 py-1 rounded border text-sm ${
                          ativo ? "bg-green-600 text-white" : "bg-gray-100"
                        }`}
                      >
                        {item.nome} (+R$ {item.preco.toFixed(2)})
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-between mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
            Cancelar
          </button>
          <button onClick={handleConfirm} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
}
