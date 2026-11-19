import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import type { ExportRow } from "./queries";

export type ExportMeta = {
  teamName: string;
  from: string;
  to: string;
  memberName?: string;
};

const STATUS_LABEL = { todo: "To do", in_progress: "In progress", done: "Done" } as const;

export function formatMs(ms: number): string {
  const minutes = Math.round(ms / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function rangeLabel(meta: ExportMeta): string {
  return meta.from === meta.to ? meta.from : `${meta.from} to ${meta.to}`;
}

export async function buildExcel(rows: ExportRow[], meta: ExportMeta): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();

  const tasks = wb.addWorksheet("Tasks");
  tasks.columns = [
    { header: "Date", key: "day", width: 12 },
    { header: "Team member", key: "member", width: 22 },
    { header: "Task", key: "task", width: 36 },
    { header: "Description", key: "description", width: 40 },
    { header: "Status", key: "status", width: 14 },
    { header: "Time spent (min)", key: "minutes", width: 16 },
    { header: "Session notes", key: "notes", width: 50 },
  ];
  tasks.getRow(1).font = { bold: true };
  tasks.views = [{ state: "frozen", ySplit: 1 }];
  for (const r of rows) {
    tasks.addRow({
      day: r.day,
      member: r.member,
      task: r.task,
      description: r.description,
      status: STATUS_LABEL[r.status],
      minutes: Math.round(r.durationMs / 60000),
      notes: r.notes,
    });
  }
  tasks.eachRow((row) => {
    row.alignment = { vertical: "top", wrapText: true };
  });

  const summary = wb.addWorksheet("Summary");
  summary.addRow([`${meta.teamName} — ${rangeLabel(meta)}`]).font = { bold: true, size: 13 };
  summary.addRow([]);
  summary.addRow(["Team member", "Tasks", "Done", "Time spent (min)"]).font = { bold: true };
  const byMember = new Map<string, { tasks: number; done: number; ms: number }>();
  for (const r of rows) {
    const s = byMember.get(r.member) ?? { tasks: 0, done: 0, ms: 0 };
    s.tasks += 1;
    if (r.status === "done") s.done += 1;
    s.ms += r.durationMs;
    byMember.set(r.member, s);
  }
  for (const [name, s] of byMember) {
    summary.addRow([name, s.tasks, s.done, Math.round(s.ms / 60000)]);
  }
  summary.columns = [{ width: 26 }, { width: 10 }, { width: 10 }, { width: 18 }];

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export function buildPdf(rows: ExportRow[], meta: ExportMeta): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text(`${meta.teamName} — Task report`);
    doc
      .fontSize(11)
      .fillColor("#555")
      .text(
        `${rangeLabel(meta)}${meta.memberName ? ` · ${meta.memberName}` : " · All members"}`,
      );
    doc.moveDown(0.3).text(`Generated ${new Date().toLocaleString()}`);
    doc.fillColor("#000").moveDown();

    if (rows.length === 0) {
      doc.fontSize(12).text("No tasks recorded for this selection.");
      doc.end();
      return;
    }

    const byMember = new Map<string, ExportRow[]>();
    for (const r of rows) byMember.set(r.member, [...(byMember.get(r.member) ?? []), r]);

    for (const [member, list] of byMember) {
      const done = list.filter((r) => r.status === "done").length;
      const total = list.reduce((s, r) => s + r.durationMs, 0);
      if (doc.y > 700) doc.addPage();
      doc.fontSize(15).text(member);
      doc
        .fontSize(10)
        .fillColor("#555")
        .text(`${done} of ${list.length} tasks done · ${formatMs(total)} tracked`)
        .fillColor("#000")
        .moveDown(0.4);

      let day = "";
      for (const r of list) {
        if (doc.y > 740) doc.addPage();
        if (r.day !== day) {
          day = r.day;
          doc.fontSize(11).font("Helvetica-Bold").text(day).font("Helvetica");
        }
        doc
          .fontSize(10)
          .text(`${r.status === "done" ? "[x]" : "[ ]"} ${r.task}  (${STATUS_LABEL[r.status]}, ${formatMs(r.durationMs)})`, {
            indent: 10,
          });
        if (r.description) doc.fillColor("#444").text(r.description, { indent: 24 }).fillColor("#000");
        if (r.notes) doc.fillColor("#444").text(`Notes: ${r.notes}`, { indent: 24 }).fillColor("#000");
      }
      doc.moveDown();
    }
    doc.end();
  });
}
