/**
 * hooks/usePainel.js
 *
 * Hook genérico que substitui toda a lógica duplicada nos 9 painéis.
 * Lê a config do painel em `lojas/{lojaId}/paineis/{painelId}`
 * e os produtos em `lojas/{lojaId}/opcoes/{config.opcaoId}`.
 */

import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

export function parsePreco(preco) {
  if (typeof preco === "number") return preco;
  if (typeof preco === "string") return parseFloat(preco.replace(",", ".")) || 0;
  return 0;
}

function produtoVazio(config) {
  const base = {
    nome: "",
    name: "",
    description: "",
    image: "",
    preco: "",
    available: true,
    categoria: config?.categorias?.[0] ?? "",
    sizes: [],
    prices: {},
  };

  // Adiciona campos extras com valor vazio
  (config?.camposExtras ?? []).forEach((campo) => {
    base[campo.key] = campo.tipo === "toggle" ? false : "";
  });

  return base;
}

// ─────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────

export function usePainel(lojaId, painelId) {
  const [config, setConfig]     = useState(null);   // doc de paineis/{painelId}
  const [docData, setDocData]   = useState(null);   // doc de opcoes/{opcaoId}
  const [loading, setLoading]   = useState(true);
  const [erro, setErro]         = useState(null);

  // ── Carrega config do painel + dados dos produtos ──
  useEffect(() => {
    if (!lojaId || !painelId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setErro(null);
      try {
        // 1. Busca configuração do painel
        const configRef  = doc(db, "lojas", lojaId, "paineis", painelId);
        const configSnap = await getDoc(configRef);

        if (!configSnap.exists()) {
          throw new Error(`Painel "${painelId}" não encontrado para a loja "${lojaId}".`);
        }

        const configData = configSnap.data();

        // 2. Busca produtos usando opcaoId da config
        const opcaoRef  = doc(db, "lojas", lojaId, "opcoes", configData.opcaoId);
        const opcaoSnap = await getDoc(opcaoRef);

        const opcaoData = opcaoSnap.exists()
          ? opcaoSnap.data()
          : { produtos: [] };

        if (!cancelled) {
          setConfig(configData);
          setDocData(opcaoData);
        }
      } catch (err) {
        if (!cancelled) setErro(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [lojaId, painelId]);

  // ── Salva o doc inteiro em opcoes/{opcaoId} ──
  const saveDocData = useCallback(async (next) => {
    if (!config) return;
    const ref = doc(db, "lojas", lojaId, "opcoes", config.opcaoId);
    await setDoc(ref, next, { merge: true });
    setDocData(next);
  }, [lojaId, config]);

  // ── Adiciona ou atualiza produto ──
  const saveProduto = useCallback(async (produto, editingIdx = null) => {
    if (!docData) return;

    const precoFinal = parsePreco(produto.preco);
    const produtoFinal = {
      ...produto,
      preco: precoFinal,
      id: editingIdx !== null
        ? docData.produtos[editingIdx].id
        : Date.now(),
    };

    const novosProdutos = [...(docData.produtos ?? [])];

    if (editingIdx !== null) {
      novosProdutos[editingIdx] = produtoFinal;
    } else {
      novosProdutos.push(produtoFinal);
    }

    await saveDocData({ ...docData, produtos: novosProdutos });
  }, [docData, saveDocData]);

  // ── Alterna disponibilidade ──
  const toggleProduto = useCallback(async (idx) => {
    if (!docData) return;
    const next = { ...docData };
    next.produtos = [...next.produtos];
    next.produtos[idx] = {
      ...next.produtos[idx],
      available: !next.produtos[idx].available,
    };
    await saveDocData(next);
  }, [docData, saveDocData]);

  // ── Remove produto ──
  const deleteProduto = useCallback(async (id) => {
    if (!docData) return;
    const next = {
      ...docData,
      produtos: docData.produtos.filter((p) => p.id !== id),
    };
    await saveDocData(next);
  }, [docData, saveDocData]);

  // ── Salva uma seção extra (bordas, adicionais, etc.) ──
  const saveExtras = useCallback(async (extraId, items) => {
    if (!docData) return;
    await saveDocData({ ...docData, [extraId]: items });
  }, [docData, saveDocData]);

  // ── Retorna um produto vazio com defaults da config ──
  const getProdutoVazio = useCallback(() => {
    return produtoVazio(config);
  }, [config]);

  return {
    config,
    docData,
    loading,
    erro,
    saveDocData,
    saveProduto,
    toggleProduto,
    deleteProduto,
    saveExtras,
    getProdutoVazio,
  };
}