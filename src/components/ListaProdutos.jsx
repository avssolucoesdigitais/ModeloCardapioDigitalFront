import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState } from "react";

export default function ListaProdutos({
  docData,
  setDocData,
  saveDocData,
  handleEditProduct,
  handleDeleteProduct,
  toggleAvailability,
}) {
  const [draggingId, setDraggingId] = useState(null);

  async function handleDragEnd(result) {
    setDraggingId(null);
    if (!result.destination) return;

    const reordered = Array.from(docData.produtos || []);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    const withOrder = reordered.map((p, i) => ({ ...p, ordem: i + 1 }));
    const next = { ...docData, produtos: withOrder };

    await saveDocData(next);
    setDocData(next);
  }

  function handleDragStart(start) {
    setDraggingId(start.draggableId);
  }

  return (
    <section
      className="bg-white rounded-2xl shadow-md p-6 sm:p-8 space-y-6 max-w-screen-lg mx-auto"
      aria-label="Lista de produtos da categoria"
    >
      <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-gray-900">
        📦 Itens da Categoria
      </h2>

      {(docData.produtos || []).length === 0 ? (
        <p className="text-gray-500 text-center italic">
          Nenhum produto cadastrado ainda.
        </p>
      ) : (
        <DragDropContext
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
        >
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
                    {(provided2, snapshot) => {
                      const isDragging = draggingId === (p.id || String(index));
                      return (
                        <div
                          ref={provided2.innerRef}
                          {...provided2.draggableProps}
                          {...provided2.dragHandleProps}
                          aria-grabbed={snapshot.isDragging}
                          aria-label={`Produto ${p.name}`}
                          tabIndex={0}
                          className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border rounded-xl bg-gray-50 focus:outline-none transition-all ${
                            isDragging
                              ? "ring-2 ring-blue-400 shadow-lg scale-[1.02]"
                              : "hover:shadow-md"
                          }`}
                        >
                          {/* Informações do Produto */}
                          <div className="flex items-start gap-4 flex-1 w-full">
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={`Imagem de ${p.name}`}
                                className="w-16 h-16 object-cover rounded-lg border"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-lg border bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                                sem img
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight">
                                {p.name}
                              </h3>
                              {p.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {p.description}
                                </p>
                              )}
                              {p.sizes?.length > 0 && (
                                <p className="text-xs mt-1 text-gray-700">
                                  <strong>Tamanhos:</strong>{" "}
                                  {p.sizes.join(", ")}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Botões de Ação */}
                          <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full md:w-auto">
                            <button
                              type="button"
                              onClick={() => handleEditProduct(p, index)}
                              className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-yellow-500 text-white text-sm font-semibold hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 transition active:scale-95"
                              aria-label={`Editar ${p.name}`}
                            >
                              ✏️ Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(index)}
                              className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:ring-offset-1 transition active:scale-95"
                              aria-label={`Excluir ${p.name}`}
                            >
                              🗑️ Excluir
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleAvailability(index)}
                              className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-offset-1 active:scale-95 transition ${
                                p.available !== false
                                  ? "bg-green-600 text-white hover:bg-green-700 focus:ring-green-400"
                                  : "bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-400"
                              }`}
                              aria-label={`Marcar ${p.name} como ${
                                p.available !== false
                                  ? "indisponível"
                                  : "disponível"
                              }`}
                            >
                              {p.available !== false
                                ? "✅ Disponível"
                                : "🚫 Indisponível"}
                            </button>
                          </div>
                        </div>
                      );
                    }}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </section>
  );
}
