import { useState } from "react";
import { supabase } from "../supabase";

const MAX_PHOTOS = 6;
const MAX_MB = 5;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export default function PhotoUploader({ userId, photos, setPhotos }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(e) {
    const files = Array.from(e.target.files);
    setError("");

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      setError(`Limite de ${MAX_PHOTOS} fotos atingido.`);
      return;
    }

    const toUpload = files.slice(0, remaining);
    const invalid = toUpload.filter(
      (f) => !ACCEPTED.includes(f.type) || f.size > MAX_MB * 1024 * 1024
    );
    if (invalid.length > 0) {
      setError(`Use JPG, PNG ou WebP com no máximo ${MAX_MB}MB cada.`);
      return;
    }

    setUploading(true);
    const urls = [];

    for (const file of toUpload) {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("shirt-photos")
        .upload(path, file, { upsert: false });

      if (upErr) {
        setError("Erro ao enviar: " + upErr.message);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage
        .from("shirt-photos")
        .getPublicUrl(path);

      urls.push(data.publicUrl);
    }

    setPhotos((prev) => [...prev, ...urls]);
    setUploading(false);
    e.target.value = "";
  }

  function removePhoto(url) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  function movePhoto(from, to) {
    const next = [...photos];
    [next[from], next[to]] = [next[to], next[from]];
    setPhotos(next);
  }

  return (
    <div>
      {/* Preview das fotos já enviadas */}
      {photos.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 14,
          }}
        >
          {photos.map((url, i) => (
            <div
              key={url}
              style={{
                position: "relative",
                width: 80,
                height: 80,
                borderRadius: 10,
                overflow: "hidden",
                border: i === 0 ? "2px solid #16a34a" : "1px solid #e5e7eb",
                flexShrink: 0,
              }}
            >
              <img
                src={url}
                alt={`foto ${i + 1}`}
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />

              {/* Badge "capa" na primeira foto */}
              {i === 0 && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 3,
                    left: 3,
                    fontSize: 9,
                    background: "#16a34a",
                    color: "#fff",
                    borderRadius: 4,
                    padding: "1px 5px",
                    fontWeight: 600,
                  }}
                >
                  capa
                </span>
              )}

              {/* Botão remover */}
              <button
                onClick={() => removePhoto(url)}
                style={{
                  position: "absolute",
                  top: 3,
                  right: 3,
                  background: "rgba(0,0,0,.55)",
                  border: "none",
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  fontSize: 10,
                  color: "#fff",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>

              {/* Mover para esquerda */}
              {i > 0 && (
                <button
                  onClick={() => movePhoto(i, i - 1)}
                  style={{
                    position: "absolute",
                    bottom: 3,
                    right: 3,
                    background: "rgba(0,0,0,.45)",
                    border: "none",
                    borderRadius: 4,
                    width: 18,
                    height: 18,
                    fontSize: 11,
                    color: "#fff",
                    cursor: "pointer",
                    lineHeight: 1,
                  }}
                  title="Mover para frente"
                >
                  ←
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Área de upload */}
      {photos.length < MAX_PHOTOS && (
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "22px 16px",
            border: "2px dashed #d1d5db",
            borderRadius: 12,
            cursor: uploading ? "not-allowed" : "pointer",
            background: uploading ? "#f9fafb" : "#fff",
            transition: "border-color .2s",
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles({ target: { files: e.dataTransfer.files } });
          }}
        >
          <span style={{ fontSize: 28 }}>📸</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
            {uploading ? "Enviando..." : "Clique ou arraste fotos aqui"}
          </span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>
            JPG, PNG ou WebP · máx. {MAX_MB}MB · até {MAX_PHOTOS} fotos
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={handleFiles}
            style={{ display: "none" }}
          />
        </label>
      )}

      {/* Contagem e erro */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 8,
        }}
      >
        <span style={{ fontSize: 11, color: "#9ca3af" }}>
          {photos.length}/{MAX_PHOTOS} fotos
        </span>
        {error && (
          <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 500 }}>
            {error}
          </span>
        )}
      </div>
    </div>
  );
}