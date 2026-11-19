export type ExportFormat = "pdf" | "xlsx";

/** Fetches a generated report from the API and saves it as a file. */
export async function downloadReport(
  path: string,
  params: Record<string, string | undefined>,
  filename: string,
): Promise<void> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const response = await fetch(`/api${path}?${query}`, { credentials: "include" });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "Download failed");
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
