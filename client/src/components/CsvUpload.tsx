import Papa from "papaparse";
import { uploadShopeeVendas } from "@/hooks/useUploadShopee";
import { format } from "date-fns";

export function CsvUpload() {
  const handleFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const hoje = format(new Date(), "yyyy-MM-dd");

        const rows = (result.data as any[])
          .map((row) => {
            const id = String(row["ID do pedido"] || "").trim();
            if (!id) return null;

            const receita = Number(
              String(row["Comissão líquida do afiliado(R$)"] || "0")
                .replace("R$", "")
                .replace(/\./g, "")
                .replace(",", ".")
            );

            return {
              id,
              nome: row["Nome do Item"] || "Produto sem nome",
              sub_id: row["Sub_id1"] || null,
              receita: isNaN(receita) ? 0 : receita,
              data: hoje,
            };
          })
          .filter(Boolean);

        try {
          await uploadShopeeVendas(rows as any);
          alert("Upload concluído!");
        } catch (error) {
          alert("Erro no upload: " + (error instanceof Error ? error.message : "Erro desconhecido"));
        }
      },
    });
  };

  return (
    <input
      type="file"
      accept=".csv"
      onChange={(e) => e.target.files && handleFile(e.target.files[0])}
    />
  );
}
