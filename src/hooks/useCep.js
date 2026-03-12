import { useState } from "react";

export default function useCep() {
  const [cep, setCep] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepErro, setCepErro] = useState("");

  const buscarCep = async (valor, { onSuccess }) => {
    const cepLimpo = valor.replace(/\D/g, "");
    setCep(valor);
    setCepErro("");

    if (cepLimpo.length !== 8) return;

    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();

      if (data.erro) {
        setCepErro("CEP não encontrado.");
        return;
      }

      onSuccess({
        rua: data.logradouro || "",
        bairroNome: data.bairro || "",
        cidade: data.localidade || "",
        uf: data.uf || "",
      });
    } catch {
      setCepErro("Erro ao buscar CEP. Tente novamente.");
    } finally {
      setLoadingCep(false);
    }
  };

  return { cep, setCep, loadingCep, cepErro, buscarCep };
}