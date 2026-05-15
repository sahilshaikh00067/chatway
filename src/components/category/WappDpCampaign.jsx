import React, { useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { FaComments } from "react-icons/fa";

export default function WappDpCampaign() {
  const dpRef = useRef(null);
  const [dp, setDp] = useState(null);
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [pdf, setPdf] = useState(null);

  const [campaignName, setCampaignName] = useState("");
  const [numbers, setNumbers] = useState("");
  const [message, setMessage] = useState("");

  // 🔥 FIX 3: showConfirm hata diya — turant showSuccess
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // ===============================
  // UPLOAD BOX
  // ===============================
  const UploadBox = ({ title, type, color }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept:
        type === "image" ? { "image/*": [] }
          : type === "video" ? { "video/*": [] }
            : { "application/pdf": [] },
      multiple: type === "image",
      onDrop: (acceptedFiles) => {
        if (!acceptedFiles.length) return;
        if (type === "image") {
          const valid = acceptedFiles.filter((f) => f.size <= 1 * 1024 * 1024);
          if (valid.length !== acceptedFiles.length) alert("❌ Each image must be under 1MB");
          setImages((prev) => [...prev, ...valid].slice(0, 4));
        }
        if (type === "video") {
          const f = acceptedFiles[0];
          if (f.size > 3 * 1024 * 1024) { alert("❌ Video must be under 3MB"); return; }
          setVideo(f);
        }
        if (type === "pdf") {
          const f = acceptedFiles[0];
          if (f.size > 1 * 1024 * 1024) { alert("❌ PDF must be under 1MB"); return; }
          setPdf(f);
        }
      },
    });

    const hasFile =
      type === "image" ? images.length > 0
        : type === "video" ? !!video
          : !!pdf;

    return (
      <div className="border border-gray-300 rounded overflow-hidden">
        <div className={`${color} text-white px-4 py-2 text-[13px] font-semibold flex justify-between items-center`}>
          <span>{title}</span>
          {hasFile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (type === "image") setImages([]);
                if (type === "video") setVideo(null);
                if (type === "pdf") setPdf(null);
              }}
              className="text-white text-xs bg-black bg-opacity-30 px-2 py-0.5 rounded"
            >✕ Remove</button>
          )}
        </div>
        <div
          {...getRootProps()}
          className={`text-center py-0 text-[13px] cursor-pointer transition ${isDragActive ? "bg-blue-50" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          <input {...getInputProps()} />
          {hasFile ? (
            <div className="flex flex-col items-center gap-2 px-3">
              {type === "image" ? (
                <>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {images.map((img, index) => (
                      <img key={index} src={URL.createObjectURL(img)} alt="preview" className="w-[70px] h-[70px] object-cover rounded border" />
                    ))}
                  </div>
                  <span className="text-green-600 font-semibold text-[12px]">✅ {images.length} Images Selected</span>
                </>
              ) : type === "video" ? (
                <>
                  <video src={URL.createObjectURL(video)} className="w-[120px] h-[80px] object-cover rounded border" controls />
                  <span className="text-green-600 font-semibold text-[12px] truncate max-w-[200px]">✅ {video.name}</span>
                  <span className="text-gray-400 text-[11px]">{(video.size / 1024).toFixed(1)} KB</span>
                </>
              ) : (
                <>
                  <div className="text-4xl">📄</div>
                  <span className="text-green-600 font-semibold text-[12px] truncate max-w-[200px]">✅ {pdf.name}</span>
                  <span className="text-gray-400 text-[11px]">{(pdf.size / 1024).toFixed(1)} KB</span>
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

  const numberList = [...new Set(numbers.split("\n").map((n) => n.trim()).filter((n) => n !== ""))];

  const resetForm = () => {
    setNumbers(""); setMessage(""); setCampaignName("");
    setImages([]); setVideo(null); setPdf(null); setDp(null);
    if (dpRef.current) dpRef.current.value = "";
  };

  // ===============================
  // 🔥 FIX 3: Send click pe TURANT popup, background mein API
  // ===============================
  const handleSendClick = () => {
    if (!campaignName || !numbers || !message) { alert("Fill all fields ❌"); return; }
    if (numberList.length === 0) { alert("Please enter numbers ❌"); return; }

    // TURANT success popup dikha
    setShowSuccess(true);

    // Background mein API call
    sendCampaignInBackground();
  };

  const sendCampaignInBackground = async () => {
    setLoading(true);
    const currentUser = JSON.parse(sessionStorage.getItem("user"));
    const userId = currentUser?.id;

    try {
      const formData = new FormData();
      formData.append("message", message);
      formData.append("user_id", userId);
      formData.append("campaign_name", campaignName);
      numberList.forEach((n) => formData.append("numbers", n));
      if (dp) formData.append("dp", dp);
      images.forEach((img) => formData.append("images", img));
      if (video) formData.append("video", video);
      if (pdf)   formData.append("pdf",   pdf);

      const res  = await fetch("https://chatway-backend.onrender.com/api/send-whatsapp/", { method: "POST", body: formData });
      const data = await res.json();

      // Credit silently update
      if (data.credit_left !== undefined) {
        const updatedUser = { ...currentUser, credit: data.credit_left };
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      }

      resetForm();

    } catch (err) {
      console.log("ERROR:", err);
    }
    setLoading(false);
  };

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="min-h-screen bg-[#f1f1f1] relative">

      <style>{`
        @keyframes wc-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes wc-slide-up {
          from { opacity: 0; transform: translateY(40px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes wc-check-pop {
          0%   { transform: scale(0) rotate(-15deg); }
          65%  { transform: scale(1.25) rotate(6deg); }
          100% { transform: scale(1)   rotate(0deg); }
        }
        @keyframes wc-pulse-ring {
          0%,100% { box-shadow: 0 0 0 0   #4DBD7455, 0 6px 24px #4DBD7433; }
          50%     { box-shadow: 0 0 0 10px transparent, 0 6px 24px #4DBD7455; }
        }
        @keyframes wc-shimmer {
          0%   { background-position: -300% center; }
          100% { background-position:  300% center; }
        }
        @keyframes wc-spin {
          to { transform: rotate(360deg); }
        }
        .wc-backdrop { animation: wc-backdrop-in 0.22s ease forwards; }
        .wc-modal    { animation: wc-slide-up 0.38s cubic-bezier(0.34,1.3,0.64,1) forwards; }
        .wc-check-icon {
          animation: wc-check-pop 0.45s cubic-bezier(0.34,1.5,0.64,1) forwards,
                     wc-pulse-ring 2.2s ease-in-out 0.45s infinite;
        }
        .wc-btn-send {
          position: relative; overflow: hidden;
          transition: transform 0.18s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.18s ease !important;
        }
        .wc-btn-send:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.03) !important;
          box-shadow: 0 8px 24px #20A8D866 !important;
        }
        .wc-btn-send:active:not(:disabled) { transform: translateY(0) scale(0.98) !important; }
        .wc-btn-send::after {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%);
          background-size: 300% 100%;
          animation: wc-shimmer 2.8s infinite;
          pointer-events: none;
        }
        .wc-btn-ok {
          transition: transform 0.15s ease, box-shadow 0.15s ease !important;
        }
        .wc-btn-ok:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 24px #20A8D866 !important;
        }
        .wc-btn-ok:active { transform: translateY(0) scale(0.98) !important; }
        .wc-spinner {
          display: inline-block; width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff;
          border-radius: 50%; animation: wc-spin 0.7s linear infinite;
        }
      `}</style>

      {/* ══════════════════════════════════════════ */}
      {/* 🔥 INSTANT SUCCESS POPUP                  */}
      {/* ══════════════════════════════════════════ */}
      {showSuccess && (
        <div
          className="wc-backdrop fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.52)", backdropFilter: "blur(5px)" }}
        >
          <div
            className="wc-modal"
            style={{
              width: 400,
              background: "linear-gradient(150deg, #ffffff 0%, #f3fdf7 100%)",
              borderRadius: 20,
              border: "1px solid #c5ebd5",
              boxShadow:
                "0 32px 80px rgba(0,0,0,0.18)," +
                "0 0 0 1px rgba(255,255,255,0.9) inset," +
                "0 2px 0 rgba(255,255,255,0.95) inset",
              padding: "40px 32px 32px",
              display: "flex", flexDirection: "column", alignItems: "center",
            }}
          >
            <div
              className="wc-check-icon"
              style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "linear-gradient(135deg, #4DBD74, #28a745)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 28, fontWeight: 900,
                marginBottom: 20,
              }}
            >✓</div>

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

            <div style={{
              width: "80%", height: 1,
              background: "linear-gradient(90deg, transparent, #b8e8cb, transparent)",
              marginBottom: 24,
            }} />

            <button
              onClick={() => setShowSuccess(false)}
              className="wc-btn-ok"
              style={{
                padding: "13px 38px",
                background: "linear-gradient(135deg, #20A8D8, #1591bb)",
                color: "#fff", border: "none", borderRadius: 10,
                fontWeight: 700, fontSize: 13.5, cursor: "pointer",
                boxShadow: "0 4px 14px #20A8D844",
              }}
            >🚀 Send Another Campaign</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MAIN FORM                                            */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className={`transition-all duration-200 ${showSuccess ? "pointer-events-none select-none opacity-40" : ""}`}>

        <div className="bg-gray-200">
          <marquee className="text-red-600 py-2 text-[18px]">
            NOTE = All campaigns will be delivered Between 8A.M to 6P.M - (Monday to Saturday)
          </marquee>
        </div>

        <div className="p-6">
          <div className="bg-white border border-gray-300 rounded">

            <div className="px-4 py-3 text-[18px] font-semibold text-gray-800 bg-[#f0f3f5] flex items-center gap-2">
              <FaComments /> Wapp DP Campaign
            </div>

            <div className="p-4">

              {/* CAMPAIGN NAME */}
              <div className="flex mb-5">
                <div className="bg-[#F86C6B] text-white px-4 py-2 text-[15px] flex items-center whitespace-nowrap">
                  Campaign Name
                </div>
                <input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter campaign name..."
                  className="border border-gray-300 w-[320px] h-[38px] px-3 outline-none"
                />
              </div>

              <div className="flex gap-5">

                {/* LEFT — NUMBERS */}
                <div className="w-[22%]">
                  <p className="mb-1 text-[18px]">Numbers:
                    <span className="text-sm text-gray-400 ml-2">({numberList.length} entered)</span>
                  </p>
                  <textarea
                    value={numbers}
                    onChange={(e) => setNumbers(e.target.value)}
                    className="w-full h-[500px] border border-green-400 rounded px-2 py-2 text-[13px] outline-none resize-none"
                  />
                </div>

                {/* RIGHT */}
                <div className="w-[78%]">
                  <p className="mb-1 text-[18px]">Message:</p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your WhatsApp message here..."
                    className="w-full h-[190px] border border-green-400 rounded px-2 py-2 text-[13px] outline-none resize-none mb-3"
                  />

                  {/* DP UPLOAD */}
                  <div className="border border-gray-300 rounded overflow-hidden mb-2">
                    <div className="bg-[#F86C6B] text-white px-4 py-2 text-[13px] font-semibold flex justify-between items-center">
                      <span>👤 DP Image — Profile picture set hogi (Max 1MB)</span>
                      {dp && (
                        <button
                          onClick={() => { setDp(null); if (dpRef.current) dpRef.current.value = ""; }}
                          className="text-white text-xs bg-black bg-opacity-30 px-2 py-0.5 rounded"
                        >✕ Remove</button>
                      )}
                    </div>
                    <div className="bg-gray-100 px-3 py-3 flex items-center gap-3 flex-wrap">
                      <input
                        ref={dpRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files[0];
                          if (!f) return;
                          if (f.size > 1 * 1024 * 1024) { alert("❌ DP must be under 1MB"); return; }
                          setDp(f);
                        }}
                        className="text-[13px]"
                      />
                      {dp && (
                        <img
                          src={URL.createObjectURL(dp)}
                          alt="DP preview"
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#F86C6B]"
                        />
                      )}
                    </div>
                  </div>

                  {/* IMAGE UPLOAD */}
                  <UploadBox title="📷 Images (Max 4 • 1MB each)" type="image" color="bg-[#63C2DE]" />

                  <div className="flex gap-3 mt-2">
                    <div className="w-1/2">
                      <UploadBox title="🎬 Video (Max 3MB)" type="video" color="bg-[#4DBD74]" />
                    </div>
                    <div className="w-1/2">
                      <UploadBox title="📄 PDF (Max 1MB)" type="pdf" color="bg-[#F86C6B]" />
                    </div>
                  </div>

                  {/* SUMMARY */}
                  {(dp || images.length > 0 || video || pdf) && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-300 rounded text-sm">
                      <b className="text-green-700">📎 Attachment selected:</b>
                      <ul className="mt-1 text-green-600">
                        {dp && <li>👤 DP: {dp.name}</li>}
                        {images.length > 0 && <li>🖼️ Images: {images.length}</li>}
                        {video && <li>🎬 Video: {video.name}</li>}
                        {pdf && <li>📄 PDF: {pdf.name}</li>}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* SEND BUTTON */}
              <button
                onClick={handleSendClick}
                className="bg-[#20A8D8] hover:bg-[#1b8db8] text-white px-8 rounded-b-md py-3 flex items-center gap-2 mt-4"
              >
                Send Now
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}