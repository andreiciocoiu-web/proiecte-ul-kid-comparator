import { createServerFn } from "@tanstack/react-start";
import { DRIVE_FOLDER_NAME } from "@/data/catalog";

export type DriveFile = {
  id: string;
  name: string;
  link: string | null;
  mime: string | null;
};

export type DriveState = {
  ok: boolean;
  pending?: boolean;
  loginRequired?: boolean;
  loginUrl?: string;
  error?: string;
  folderId?: string;
  folderLink?: string;
  created?: boolean;
  files?: DriveFile[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function collect(value: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 5 || value == null) return [];
  if (Array.isArray(value)) return value.flatMap((item) => collect(item, depth + 1));
  const record = asRecord(value);
  if (!record) return [];
  const nested = ["files", "items", "results", "data", "folders"].flatMap((key) =>
    collect(record[key], depth + 1),
  );
  const id = record.id ?? record.file_id ?? record.folder_id;
  return typeof id === "string" ? [record, ...nested] : nested;
}

function toFile(record: Record<string, unknown>): DriveFile | null {
  const id = record.id ?? record.file_id ?? record.folder_id;
  if (typeof id !== "string" || !id) return null;
  const nameRaw = record.name ?? record.title;
  const linkRaw = record.web_view_link ?? record.webViewLink ?? record.url;
  const mimeRaw = record.mime_type ?? record.mimeType;
  return {
    id,
    name: typeof nameRaw === "string" && nameRaw ? nameRaw : "fără nume",
    link: typeof linkRaw === "string" ? linkRaw : null,
    mime: typeof mimeRaw === "string" ? mimeRaw : null,
  };
}

function folderFrom(data: unknown): DriveFile | null {
  const record = asRecord(data);
  if (record) {
    const direct = toFile({
      ...record,
      id: record.folder_id ?? record.id,
    });
    if (direct && (record.folder_id || record.mime_type === "application/vnd.google-apps.folder" || record.mimeType === "application/vnd.google-apps.folder")) {
      return direct;
    }
  }
  return (
    collect(data)
      .map(toFile)
      .find((file) => file && /folder/i.test(file.mime ?? "")) ?? null
  );
}

export const syncDriveFolder = createServerFn({ method: "POST" })
  .validator((input: { create?: boolean } | undefined) => ({
    create: input?.create !== false,
  }))
  .handler(async ({ data }): Promise<DriveState> => {
    const { callTool, ConnectorType, GoogleDriveTools } = await import(
      "@/lib/app-data/client.server"
    );
    const options = { connectorType: ConnectorType.GoogleDrive };

    const found = await callTool(
      GoogleDriveTools.search,
      {
        exact_name: DRIVE_FOLDER_NAME,
        mime_type_filter: "application/vnd.google-apps.folder",
        max_results: 5,
      },
      options,
    );
    if (!found.ok) {
      return {
        ok: false,
        pending: found.pending,
        loginRequired: found.loginRequired,
        loginUrl: found.loginUrl,
        error: found.errorMessage,
      };
    }

    let folder = folderFrom(found.data);
    let created = false;
    if (!folder && data.create) {
      const made = await callTool(
        GoogleDriveTools.createFolder,
        { folder_name: DRIVE_FOLDER_NAME },
        options,
      );
      if (!made.ok) {
        return {
          ok: false,
          pending: made.pending,
          loginRequired: made.loginRequired,
          loginUrl: made.loginUrl,
          error: made.errorMessage,
        };
      }
      folder = folderFrom(made.data) ?? toFile(asRecord(made.data) ?? {});
      created = true;
    }

    if (!folder) {
      return { ok: false, error: "Folderul nu a putut fi identificat în Drive." };
    }

    const listed = await callTool(
      GoogleDriveTools.listFolder,
      { folder_id: folder.id, max_results: 50 },
      options,
    );
    if (!listed.ok) {
      return {
        ok: true,
        folderId: folder.id,
        folderLink: folder.link ?? undefined,
        created,
        files: [],
        error: listed.errorMessage,
      };
    }

    const files = collect(listed.data)
      .map(toFile)
      .filter((file): file is DriveFile => !!file && file.id !== folder.id);

    return {
      ok: true,
      folderId: folder.id,
      folderLink: folder.link ?? undefined,
      created,
      files,
    };
  });
