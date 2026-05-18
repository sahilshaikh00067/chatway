import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FaComments } from "react-icons/fa";

export default function WappCampaign() {
  const [campaignName, setCampaignName] = useState("");
  const [numbers, setNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState({ images: [], video: null, pdf: null });

  // ─────────────────────────────────────────
  // NUMBER VALIDATION & CLEANING
  // ─────────────────────────────────────────
  // Valid: exactly 10-digit Indian mobile (starts with 6/7/8/9)
  // OR already has 91 prefix → strip it then validate
  const isValidIndianMobile = (raw) => {
    let n = raw.replace(/\D/g, ""); // only digits
    if (n.startsWith("91") && n.length === 12) n = n.slice(2);
    if (n.startsWith("0") && n.length === 11) n = n.slice(1);
    return n.length === 10 && /^[6-9]/.test(n) ? n : null;
  };

  // Parse textarea → deduplicated valid numbers
  const getParsedNumbers = useCallback((text) => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const seen  = new Set();
    const valid = [];
    const invalid = [];

    lines.forEach((line) => {
      const clean = isValidIndianMobile(line);
      if (clean) {
        if (!seen.has(clean)) {
          seen.add(clean);
          valid.push(clean);
        }
        // duplicates silently skipped
      } else {
        invalid.push(line);
      }
    });

    return { valid, invalid, total: lines.length };
  }, []);

  const { valid: validNums, invalid: invalidNums, total: totalEntered } = getParsedNumbers(numbers);
  const duplicateCount = totalEntered - validNums.length - invalidNums.length;

  // When user pastes/types — auto-clean on blur
  const handleNumbersChange = (e) => {
    setNumbers(e.target.value);
  };

  // Auto-clean button: remove invalids & duplicates from textarea
  const handleAutoClean = () => {
    setNumbers(validNums.join("\n"));
  };

  // ─────────────────────────────────────────
  // FILE UPLOAD
  // ─────────────────────────────────────────
  const handleDrop = (acceptedFiles, type) => {
    if (type === "image") {
      const validImages = acceptedFiles.filter((f) => f.size <= 1 * 1024 * 1024);
      if (validImages.length !== acceptedFiles.length) alert("❌ Each image must be under 1MB");
      setFiles((prev) => ({ ...prev, images: [...prev.images, ...validImages].slice(0, 4) }));
      return;
    }
    const file = acceptedFiles[0];
    if (!file) return;
    const limits = { video: 3, pdf: 1 };
    if (file.size > limits[type] * 1024 * 1024) { alert(`❌ ${type} must be under ${limits[type]}MB`); return; }
    setFiles((prev) => ({ ...prev, [type]: file }));
  };

  const removeFile = (type) => {
    setFiles((prev) => {
      const updated = { ...prev };
      if (type === "image") updated.images = [];
      else updated[type] = null;
      return updated;
    });
  };

  const UploadBox = ({ title, type, color }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (f) => handleDrop(f, type),
      accept: type === "image" ? { "image/*": [] } : type === "video" ? { "video/*": [] } : { "application/pdf": [] },
      maxFiles: type === "image" ? 4 : 1,
    });
    const file   = type === "image" ? files.images : files[type];
    const hasFile = type === "image" ? files.images.length > 0 : !!file;

    return (
      <div className="border border-gray-300 rounded overflow-hidden">
        <div className={`${color} text-white px-4 py-2 text-[13px] font-semibold flex justify-between items-center`}>
          <span>{title}</span>
          {hasFile && (
            <button onClick={(e) => { e.stopPropagation(); removeFile(type); }}
              className="text-white text-xs bg-black bg-opacity-30 px-2 py-0.5 rounded">✕ Remove</button>
          )}
        </div>
        <div {...getRootProps()} className={`text-center py-1 text-[13px] cursor-pointer transition ${isDragActive ? "bg-blue-50" : "bg-gray-100 hover:bg-gray-200"}`}>
          <input {...getInputProps()} />
          {hasFile ? (
            <div className="flex flex-col items-center gap-2 px-3">
              {type === "image" ? (
                <>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {files.images.map((img, index) => (
                      <img key={index} src={URL.createObjectURL(img)} alt="preview" className="w-[70px] h-[70px] object-cover rounded border" />
                    ))}
                  </div>
                  <span className="text-green-600 font-semibold text-[12px]">✅ {files.images.length} Images Selected</span>
                </>
              ) : type === "video" ? (
                <>
                  <video src={URL.createObjectURL(file)} className="w-[120px] h-[80px] object-cover rounded border" controls />
                  <span className="text-green-600 font-semibold text-[12px] truncate max-w-[200px]">✅ {file.name}</span>
                  <span className="text-gray-400 text-[11px]">{(file.size / 1024).toFixed(1)} KB</span>
                </>
              ) : (
                <>
                  <div className="text-4xl">📄</div>
                  <span className="text-green-600 font-semibold text-[12px] truncate max-w-[200px]">✅ {file.name}</span>
                  <span className="text-gray-400 text-[11px]">{(file.size / 1024).toFixed(1)} KB</span>
                </>
              )}
            </div>
          ) : (
            <div className="text-gray-500 px-3">
              <div className="text-2xl mb-1">{type === "image" ? "🖼️" : type === "video" ? "🎬" : "📄"}</div>
              Drag & Drop {type} file <br />
              <span className="underline text-blue-500">Browse</span>
              <div className="text-xs text-gray-400 mt-1">
                {type === "image" ? "Max 4 images • 1MB each" : type === "video" ? "Max 1 video • 3MB" : "Max 1 PDF • 1MB"}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────
  // SEND
  // ─────────────────────────────────────────
  const handleSendClick = () => {
    if (!campaignName || !numbers || !message) { alert("Fill all fields ❌"); return; }
    if (validNums.length === 0) { alert("No valid numbers found ❌"); return; }
    if (invalidNums.length > 0) {
      const proceed = window.confirm(
        `⚠️ ${invalidNums.length} invalid number(s) will be skipped.\n${duplicateCount > 0 ? `${duplicateCount} duplicate(s) also removed.\n` : ""}Only ${validNums.length} valid numbers will be sent.\n\nProceed?`
      );
      if (!proceed) return;
    }
    setShowSuccess(true);
    sendCampaignInBackground(validNums);
  };

  const sendCampaignInBackground = async (numberList) => {
    setLoading(true);
    const currentUser = JSON.parse(sessionStorage.getItem("user"));
    const userId = currentUser?.id;

    try {
      const formData = new FormData();
      formData.append("message", message);
      formData.append("user_id", userId);
      formData.append("campaign_name", campaignName);
      numberList.forEach((n) => formData.append("numbers", n));
      files.images.forEach((img) => formData.append("images", img));
      if (files.video) formData.append("video", files.video);
      if (files.pdf)   formData.append("pdf",   files.pdf);

      const res  = await fetch("https://chatway-backend.onrender.com/api/send-whatsapp/", { method: "POST", body: formData });
      const data = await res.json();

      if (data.credit_left !== undefined) {
        const updatedUser = { ...currentUser, credit: data.credit_left };
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      }

      setCampaignName("");
      setNumbers("");
      setMessage("");
      setFiles({ images: [], video: null, pdf: null });

    } catch (err) {
      console.log("ERROR:", err);
    }
    setLoading(false);
  };

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f1f1f1] relative">

      <style>{`
        @keyframes wc-backdrop-in { from{opacity:0} to{opacity:1} }
        @keyframes wc-slide-up { from{opacity:0;transform:translateY(40px) scale(0.94)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes wc-check-pop { 0%{transform:scale(0) rotate(-15deg)} 65%{transform:scale(1.25) rotate(6deg)} 100%{transform:scale(1) rotate(0deg)} }
        @keyframes wc-pulse-ring { 0%,100%{box-shadow:0 0 0 0 #4DBD7455,0 6px 24px #4DBD7433} 50%{box-shadow:0 0 0 10px transparent,0 6px 24px #4DBD7455} }
        @keyframes wc-shimmer { 0%{background-position:-300% center} 100%{background-position:300% center} }
        @keyframes wc-spin { to{transform:rotate(360deg)} }
        .wc-backdrop{animation:wc-backdrop-in 0.22s ease forwards}
        .wc-modal{animation:wc-slide-up 0.38s cubic-bezier(0.34,1.3,0.64,1) forwards}
        .wc-check-icon{animation:wc-check-pop 0.45s cubic-bezier(0.34,1.5,0.64,1) forwards,wc-pulse-ring 2.2s ease-in-out 0.45s infinite}
        .wc-btn-ok{transition:transform 0.15s ease,box-shadow 0.15s ease!important}
        .wc-btn-ok:hover{transform:translateY(-2px)!important;box-shadow:0 8px 24px #20A8D866!important}
        .wc-btn-ok:active{transform:translateY(0) scale(0.98)!important}
        .wc-spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,0.35);border-top-color:#fff;border-radius:50%;animation:wc-spin 0.7s linear infinite}
        .num-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600}
      `}</style>

      {/* SUCCESS POPUP */}
      {showSuccess && (
        <div className="wc-backdrop fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.52)", backdropFilter: "blur(5px)" }}>
          <div className="wc-modal" style={{
            width: 400, background: "linear-gradient(150deg,#ffffff 0%,#f3fdf7 100%)",
            borderRadius: 20, border: "1px solid #c5ebd5",
            boxShadow: "0 32px 80px rgba(0,0,0,0.18),0 0 0 1px rgba(255,255,255,0.9) inset,0 2px 0 rgba(255,255,255,0.95) inset",
            padding: "40px 32px 32px", display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            <div className="wc-check-icon" style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(135deg,#4DBD74,#28a745)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 28, fontWeight: 900, marginBottom: 20,
            }}>✓</div>

            <h1 style={{ fontSize: 25, fontWeight: 800, color: "#1c2b3a", margin: "0 0 7px", letterSpacing: "-0.02em" }}>
              Campaign Sent!
            </h1>
            <p style={{ color: "#9aa5b1", fontSize: 12.5, margin: "0 0 8px", textAlign: "center" }}>
              Your campaign has been submitted successfully
            </p>
            {loading && (
              <p style={{ color: "#f97316", fontSize: 12, margin: "0 0 18px", textAlign: "center" }}>
                <span className="wc-spinner" style={{ marginRight: 6, verticalAlign: "middle" }} />
                Processing in background...
              </p>
            )}
            <div style={{ width: "80%", height: 1, background: "linear-gradient(90deg,transparent,#b8e8cb,transparent)", marginBottom: 24 }} />
            <button onClick={() => setShowSuccess(false)} className="wc-btn-ok" style={{
              padding: "13px 38px", background: "linear-gradient(135deg,#20A8D8,#1591bb)",
              color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13.5,
              cursor: "pointer", boxShadow: "0 4px 14px #20A8D844",
            }}>🚀 Send Another Campaign</button>
          </div>
        </div>
      )}

      {/* MAIN FORM */}
      <div className={`transition-all duration-200 ${showSuccess ? "pointer-events-none select-none opacity-40" : ""}`}>
        <div className="bg-gray-200">
          <marquee className="text-red-600 py-2 text-[18px]">
            NOTE = All campaigns will be delivered Between 8A.M to 6P.M - (Monday to Saturday)
          </marquee>
        </div>

        <div className="p-6">
          <div className="bg-white border border-gray-300 rounded">
            <div className="px-4 py-3 text-[18px] font-semibold text-gray-800 bg-[#f0f3f5] flex items-center gap-2">
              <FaComments /> Wapp Campaign
            </div>
            <div className="p-4">

              {/* CAMPAIGN NAME */}
              <div className="flex mb-5">
                <div className="bg-[#F86C6B] text-white px-4 py-2 text-[15px] flex items-center">Campaign Name</div>
                <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter campaign name..."
                  className="border border-gray-300 w-[320px] h-[38px] px-3 outline-none" />
              </div>

              <div className="flex gap-5">
                {/* NUMBERS PANEL */}
                <div className="w-[22%]">
                  {/* Number stats bar */}
                  <div className="mb-1 flex flex-wrap items-center gap-1">
                    <span className="text-[15px] font-medium">Numbers:</span>
                    <span className="num-badge bg-green-100 text-green-700">✅ {validNums.length} valid</span>
                    {invalidNums.length > 0 && (
                      <span className="num-badge bg-red-100 text-red-600">❌ {invalidNums.length} invalid</span>
                    )}
                    {duplicateCount > 0 && (
                      <span className="num-badge bg-yellow-100 text-yellow-700">♻️ {duplicateCount} dup</span>
                    )}
                  </div>

                  <textarea
                    value={numbers}
                    onChange={handleNumbersChange}
                    placeholder={"Enter numbers\none per line\n\nValid: 10-digit\nIndian mobile"}
                    className="w-full h-[440px] border border-green-400 rounded px-2 py-2 text-[13px] outline-none resize-none"
                  />

                  {/* AUTO CLEAN BUTTON */}
                  {(invalidNums.length > 0 || duplicateCount > 0) && (
                    <button
                      onClick={handleAutoClean}
                      className="mt-2 w-full bg-red-500 hover:bg-red-600 text-white text-[12px] py-1.5 rounded font-semibold transition"
                    >
                      🧹 Remove {invalidNums.length + duplicateCount} Invalid/Duplicate
                    </button>
                  )}

                  {/* Invalid number list preview */}
                  {invalidNums.length > 0 && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-[11px] max-h-[80px] overflow-y-auto">
                      <b className="text-red-600">Invalid numbers:</b>
                      {invalidNums.slice(0, 10).map((n, i) => (
                        <div key={i} className="text-red-500 truncate">{n}</div>
                      ))}
                      {invalidNums.length > 10 && (
                        <div className="text-red-400">...and {invalidNums.length - 10} more</div>
                      )}
                    </div>
                  )}
                </div>

                {/* RIGHT SIDE */}
                <div className="w-[78%]">
                  <p className="mb-1 text-[18px]">Message:</p>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your WhatsApp message here..."
                    className="w-full h-[190px] border border-green-400 rounded px-2 py-2 text-[13px] outline-none resize-none mb-3" />

                  <UploadBox title="📷 Images (Max 4 • 1MB each)" type="image" color="bg-[#63C2DE]" />
                  <div className="flex gap-3 mt-2">
                    <div className="w-1/2"><UploadBox title="🎬 Video (Max 3MB)" type="video" color="bg-[#4DBD74]" /></div>
                    <div className="w-1/2"><UploadBox title="📄 PDF (Max 1MB)" type="pdf" color="bg-[#F86C6B]" /></div>
                  </div>

                  {(files.images.length > 0 || files.video || files.pdf) && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-300 rounded text-sm">
                      <b className="text-green-700">📎 Attachment selected:</b>
                      <ul className="mt-1 text-green-600">
                        {files.images.length > 0 && <li>🖼️ Images: {files.images.length}</li>}
                        {files.video && <li>🎬 Video: {files.video.name}</li>}
                        {files.pdf && <li>📄 PDF: {files.pdf.name}</li>}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* SEND BUTTON */}
              <button onClick={handleSendClick}
                className="mt-4 bg-[#20A8D8] hover:bg-[#1b8db8] text-white px-7 py-3 flex items-center gap-2 rounded">
                🚀 Send Now ({validNums.length} numbers)
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}