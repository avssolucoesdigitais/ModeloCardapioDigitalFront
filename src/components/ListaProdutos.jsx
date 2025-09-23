import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function ListaProdutos({
  docData,
  setDocData,
  saveDocData,
  handleEditProduct,
  handleDeleteProduct,
  toggleAvailability,
}) {
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
    <section className="bg-white rounded-xl shadow-md p-6 space-y-6">
      <h2 className="text-lg font-bold flex items-center gap-2">
        📦 Itens da Categoria
      </h2>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="produtos">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-3"
            >
              {(docData.produtos || []).map((p, index) => (
                <Draggable
                  key={p.id || String(index)}
                  draggableId={p.id || String(index)}
                  index={index}
                >
                  {(provided2) => (
                    <div
                      ref={provided2.innerRef}
                      {...provided2.draggableProps}
                      {...provided2.dragHandleProps}
                      className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border rounded-lg bg-gray-50 hover:shadow-md transition"
                    >
                      {/* Info do Produto */}
                      <div className="flex items-start gap-4 flex-1">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg border bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                            sem img
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {p.name}
                          </h3>
                          {p.description && (
                            <p className="text-xs text-gray-600">
                              {p.description}
                            </p>
                          )}
                          {p.sizes?.length > 0 && (
                            <p className="text-xs mt-1 text-gray-700">
                              <strong>Tamanhos:</strong> {p.sizes.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Botões */}
                      <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <button
                          type="button"
                          onClick={() => handleEditProduct(p, index)}
                          className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-yellow-500 text-white text-sm font-semibold hover:bg-yellow-600 transition"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(index)}
                          className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition"
                        >
                          🗑️ Excluir
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleAvailability(index)}
                          className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-sm font-semibold transition ${
                            p.available !== false
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-gray-500 text-white hover:bg-gray-600"
                          }`}
                        >
                          {p.available !== false
                            ? "✅ Disponível"
                            : "🚫 Indisp."}
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
