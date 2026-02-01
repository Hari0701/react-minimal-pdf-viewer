import { useRef, useState } from "react";
import { PdfViewer } from "./PdfViewer";

export const SampleApp = () => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [textLayerMode, setTextLayerMode] = useState(2);
  const [removePageBorders, setRemovePageBorders] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;

    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl(URL.createObjectURL(file));
    setCurrentPage(1);
  };

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 12, borderBottom: "1px solid #ddd", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", backgroundColor: "#f9f9f9" }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: "8px 16px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500
          }}
        >
          Upload PDF
        </button>
        
        {pdfUrl && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
              <label>
                <input 
                  type="checkbox" 
                  checked={removePageBorders} 
                  onChange={(e) => setRemovePageBorders(e.target.checked)} 
                />
                Remove Borders
              </label>
              
              <label>
                Text Layer:
                <select 
                  value={textLayerMode} 
                  onChange={(e) => setTextLayerMode(Number(e.target.value))}
                  style={{ marginLeft: 4 }}
                >
                  <option value={0}>Disabled (0)</option>
                  <option value={1}>Enabled (1)</option>
                  <option value={2}>Enhanced (2)</option>
                </select>
              </label>

              <span style={{ color: "#555", marginLeft: 8 }}>Page {currentPage}</span>
            </div>
          </>
        )}
      </div>

      <div style={{ flex: 1, position: "relative", background: "#e5e5e5" }}>
        {pdfUrl ? (
          <PdfViewer
            document={pdfUrl}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            textLayerMode={textLayerMode}
            removePageBorders={removePageBorders}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#666" }}>
            <p style={{ fontSize: 16 }}>Click "Upload PDF" to view a document</p>
          </div>
        )}
      </div>
    </div>
  );
};
