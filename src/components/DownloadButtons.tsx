import { useState } from "react";
import { downloadReport, type ExportFormat } from "../lib/download";

type Props = {
  path: string;
  params: Record<string, string | undefined>;
  filenameBase: string;
};

export function DownloadButtons({ path, params, filenameBase }: Props) {
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(format: ExportFormat) {
    setBusy(format);
    setError(null);
    try {
      await downloadReport(path, { ...params, format }, `${filenameBase}.${format}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="action-row no-print">
        <button type="button" className="btn btn--ghost" disabled={busy !== null} onClick={() => void run("pdf")}>
          {busy === "pdf" ? "Preparing…" : "Download PDF"}
        </button>
        <button type="button" className="btn btn--ghost" disabled={busy !== null} onClick={() => void run("xlsx")}>
          {busy === "xlsx" ? "Preparing…" : "Download Excel"}
        </button>
      </div>
      {error ? <p className="banner banner--error">{error}</p> : null}
    </>
  );
}
