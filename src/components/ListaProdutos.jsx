import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function ListaProdutos({ docData, setDocData, saveDocData, handleEditProduct, handleDeleteProduct, toggleAvailability }) {
  async function handleDragEnd(result) {
    if (!result.destination) return;
    const reordered = Array.from(docData.produtos || []);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    const withOrder = reordered.map((p, i) => ({ ...p, ordem: i + 1 }));
    const next = { ...docData, produtos: withOrder };
    await saveDocData(next);
    setDocData(next);
  }

  return (
    <section className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-xl font-bold mb-4">📦 Itens da Categoria</h2>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="produtos">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
              {(docData.produtos || []).map((p, index) => (
                <Draggable key={p.id || String(index)} draggableId={p.id || String(index)} index={index}>
                  {(provided2) => (
                    <div
                      ref={provided2.innerRef}
                      {...provided2.draggableProps}
                      {...provided2.dragHandleProps}
                      className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border rounded-lg bg-[#F5F6FA] hover:shadow"
                    >
                      <div className="flex items-center gap-4">
                        {p.image && <img src={p.image} alt={p.name} className="w-16 h-16 object-cover rounded-lg border" />}
                        <div>
                          <h3 className="font-semibold text-[#0C2340]">{p.name}</h3>
                          <p className="text-xs text-gray-500">{p.description}</p>
                          {(p.sizes?.length ?? 0) > 0 && (
                            <p className="text-xs mt-1">
                              <strong>Tamanhos:</strong> {p.sizes.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleEditProduct(p, index)} className="px-3 py-1 rounded-lg bg-yellow-400 text-white text-sm hover:opacity-90">
                          Editar
                        </button>
                        <button type="button" onClick={() => handleDeleteProduct(index)} className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:opacity-90">
                          Excluir
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleAvailability(index)}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            p.available !== false ? "bg-green-600 text-white" : "bg-gray-500 text-white"
                          }`}
                        >
                          {p.available !== false ? "Disponível" : "Indisp."}
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </section>
  );
}
