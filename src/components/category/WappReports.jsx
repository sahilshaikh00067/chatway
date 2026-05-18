import React, { useEffect, useState, useRef } from "react";
import { Calendar } from "lucide-react";
import * as XLSX from "xlsx";

const BASE = "https://chatway-backend.onrender.com/api";

const WappReports = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("Today");
  const [allEntries, setAllEntries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [openRow, setOpenRow] = useState(null);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const filters = ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "This Month", "Last Month", "Custom Range"];

  const fetchCampaigns = async () => {
    const currentUser = JSON.parse(sessionStorage.getItem("user"));
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/my-campaigns/?user_id=${currentUser.id}`);
      const data = await res.json();
      if (data.status === "success") {
        setAllEntries(data.campaigns);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  useEffect(() => {
    const hasPending = allEntries.some((e) => e.status === "pending");
    if (hasPending) {
      intervalRef.current = setInterval(() => { fetchCampaigns(); }, 60 * 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [allEntries]);

  useEffect(() => {
    const now = new Date();
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    const todayIST = new Date(Math.floor((now.getTime() + IST_OFFSET) / 86400000) * 86400000 - IST_OFFSET);

    let start, end;

    if (selectedFilter === "Today") {
      start = todayIST.getTime();
      end = now.getTime();
    } else if (selectedFilter === "Yesterday") {
      start = todayIST.getTime() - 86400000;
      end = todayIST.getTime() - 1;
    } else if (selectedFilter === "Last 7 Days") {
      start = todayIST.getTime() - 7 * 86400000;
      end = now.getTime();
    } else if (selectedFilter === "Last 30 Days") {
      start = todayIST.getTime() - 30 * 86400000;
      end = now.getTime();
    } else if (selectedFilter === "This Month") {
      const istNow = new Date(now.getTime() + IST_OFFSET);
      start = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), 1) - IST_OFFSET).getTime();
      end = now.getTime();
    } else if (selectedFilter === "Last Month") {
      const istNow = new Date(now.getTime() + IST_OFFSET);
      start = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth() - 1, 1) - IST_OFFSET).getTime();
      end = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), 1) - IST_OFFSET).getTime() - 1;
    } else if (selectedFilter === "Custom Range") {
      if (!customStart || !customEnd) { setEntries(allEntries); return; }
      start = new Date(customStart).getTime();
      end = new Date(customEnd).getTime() + 86399999;
    }

    setEntries(allEntries.filter((e) => e.rawDate >= start && e.rawDate <= end));
    setPage(1);
  }, [selectedFilter, allEntries, customStart, customEnd]);

  const handleDownload = (data) => {
    const total = data.total || 0;
    if (total === 0) { alert("No data available."); return; }

    let rows = [];
    if (data.numberResults && data.numberResults.length > 0) {
      rows = data.numberResults.map((r) => ({
        Number: r.number,
        Status: r.status.toUpperCase(),
      }));
    } else if (data.numberList && data.numberList.length > 0) {
      rows = data.numberList.map((n) => ({
        Number: n,
        Status: "PENDING",
      }));
    } else {
      alert("No number data available for this campaign.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 20 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Campaign Report");
    XLSX.writeFile(wb, `${data.name || "report"}.xlsx`);
  };

  const getFileType = (url) => {
    if (!url) return "file";
    const lower = url.toLowerCase();
    if (lower.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/)) return "image";
    if (lower.match(/\.(mp4|mov|avi|mkv|webm)(\?|$)/)) return "video";
    if (lower.match(/\.pdf(\?|$)/)) return "pdf";
    return "file";
  };

  const toggleRow = (i) => setOpenRow(openRow === i ? null : i);
  const totalPages = Math.ceil(entries.length / perPage);
  const paginated = entries.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="min-h-screen bg-[#f1f1f1]">
      <div className="bg-gray-200">
        <marquee className="text-red-600 py-2 font-normal text-[18px]">
          NOTE = All campaigns will be delivered Between 8A.M to 6P.M - (Monday to Saturday) on working days.
        </marquee>
      </div>

      <div className="p-4">
        <div className="bg-white border border-gray-300 rounded">

          {/* HEADER */}
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-[18px] text-gray-800">Whatsapp Report</h2>
              <button
                onClick={fetchCampaigns}
                className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-600 px-3 py-1 rounded text-sm flex items-center gap-1"
              >
                🔄 Refresh
              </button>
              {allEntries.some((e) => e.status === "pending") && (
                <span className="bg-orange-100 text-orange-600 border border-orange-300 px-3 py-1 rounded text-xs animate-pulse">
                  ⏳ Pending campaigns auto-refresh
                </span>
              )}
            </div>

            <div className="relative">
              <div
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 bg-[#4DBD74] text-white px-4 py-2 rounded cursor-pointer"
              >
                <Calendar size={16} /> {selectedFilter}
              </div>
              {filterOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-300 rounded shadow z-50">
                  {filters.map((f, i) => (
                    <div key={i} onClick={() => { setSelectedFilter(f); setFilterOpen(false); setShowCustom(f === "Custom Range"); }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                      {f}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CUSTOM DATE */}
          {showCustom && (
            <div className="px-4 py-3 flex gap-3 items-center border-b bg-gray-50">
              <label className="text-sm">From:</label>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                className="border border-gray-300 px-2 py-1 rounded outline-none text-sm" />
              <label className="text-sm">To:</label>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                className="border border-gray-300 px-2 py-1 rounded outline-none text-sm" />
            </div>
          )}

          <div className="p-4">
            <div className="mb-3 flex items-center gap-2 text-sm">
              <span>Show</span>
              <select className="border border-gray-300 px-2 py-1 rounded outline-none"
                value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>

            {/* TABLE */}
            <div className="border border-gray-300">
              <table className="w-full text-[15px] border-collapse text-center">
                <thead className="bg-[#20a8d8] text-white">
                  <tr>
                    <th className="px-2 py-2 border-r border-gray-300"></th>
                    <th className="px-3 py-2 border-r border-gray-300">Campname</th>
                    <th className="px-3 py-2 border-r border-gray-300">Number</th>
                    <th className="px-3 py-2 border-r border-gray-300">Message</th>
                    <th className="px-3 py-2 border-r border-gray-300">Status</th>
                    <th className="px-3 py-2 border-r border-gray-300">Submit Date</th>
                    <th className="px-3 py-2">Download</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-6 text-gray-500">⏳ Loading...</td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-6 text-gray-600">No data available in table</td>
                    </tr>
                  ) : (
                    paginated.map((e, i) => (
                      <React.Fragment key={i}>
                        <tr className="border-t bg-gray-200">
                          <td className="border-r border-gray-300">
                            <button onClick={() => toggleRow(i)}
                              className="bg-[#4dbd74] text-white w-5 h-6 rounded-full">
                              {openRow === i ? "-" : "+"}
                            </button>
                          </td>
                          <td className="px-3 py-2 border-r border-gray-300">{e.name}</td>
                          <td className="px-3 py-2 border-r border-gray-300">{e.total}</td>
                          <td className="px-3 py-2 border-r border-gray-300 max-w-[200px] truncate">{e.message}</td>

                          <td className="px-3 py-2 border-r border-gray-300">
                            {e.status === "pending" ? (
                              <span className="bg-orange-400 text-white px-2 py-1 text-xs rounded-full animate-pulse">
                                ⏳ PENDING
                              </span>
                            ) : (
                              <span className="bg-[#4dbd74] text-white px-2 py-1 text-xs rounded-full">
                                COMPLETED
                              </span>
                            )}
                          </td>

                          <td className="px-3 py-2 border-r border-gray-300">{e.date}</td>
                          <td className="px-3 py-2">
                            {e.status === "completed" ? (
                              <button onClick={() => handleDownload(e)}
                                className="bg-[#20A8D8] text-white px-3 py-1 rounded-full text-xs">
                                Download
                              </button>
                            ) : e.status === "pending" && JSON.parse(sessionStorage.getItem("user"))?.role === "admin" ? (
                              <button onClick={() => handleDownload(e)}
                                className="bg-orange-400 text-white px-3 py-1 rounded-full text-xs">
                                Download
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                        </tr>

                        {/* EXPANDED ROW — Failed instead of Pending */}
                        {openRow === i && (
                          <tr>
                            <td colSpan="7" className="bg-gray-100">
                              <div className="p-3 text-left">

                                {/* Stats badges — Failed instead of Pending */}
                                <div className="flex gap-2 flex-wrap justify-center mb-3">
                                  <span className="bg-[#20A8D8] text-white px-3 py-1 rounded text-sm font-semibold">
                                    📊 TOTAL {e.total || 0}
                                  </span>
                                  <span className="bg-[#4DBD74] text-white px-3 py-1 rounded text-sm font-semibold">
                                    ✅ SUCCESS {e.success || 0}
                                  </span>
                                  {/* FAILED — pending_count field use karo */}
                                  <span className="bg-[#F86C6B] text-white px-3 py-1 rounded text-sm font-semibold">
                                    ❌ FAILED {e.pending || e.pending_count || 0}
                                  </span>
                                  <span className="bg-gray-500 text-white px-3 py-1 rounded text-sm font-semibold">
                                    📵 NONWA {e.nonwa || 0}
                                  </span>
                                  <span className="bg-[#6366f1] text-white px-3 py-1 rounded text-sm font-semibold">
                                    🚫 REJECTED {e.rejected || 0}
                                  </span>
                                </div>

                                {/* Files section */}
                                {(e.file_urls || []).length > 0 && (
                                  <div className="mt-2">
                                    <b className="text-gray-700 text-sm block mb-2">📎 Attachments:</b>
                                    <div className="flex gap-3 flex-wrap">
                                      {e.file_urls.map((url, fi) => {
                                        const type = getFileType(url);
                                        return (
                                          <div key={fi} className="border border-gray-300 rounded overflow-hidden bg-white shadow-sm">
                                            {type === "image" ? (
                                              <a href={url} target="_blank" rel="noreferrer">
                                                <img src={url} alt={`img-${fi}`}
                                                  className="w-[80px] h-[80px] object-cover"
                                                  onError={(e) => { e.target.style.display = "none"; }} />
                                              </a>
                                            ) : type === "video" ? (
                                              <a href={url} target="_blank" rel="noreferrer"
                                                className="flex flex-col items-center justify-center w-[80px] h-[80px] bg-gray-100 text-gray-600 text-xs gap-1 hover:bg-gray-200">
                                                <span className="text-2xl">🎬</span><span>Video</span>
                                              </a>
                                            ) : type === "pdf" ? (
                                              <a href={url} target="_blank" rel="noreferrer"
                                                className="flex flex-col items-center justify-center w-[80px] h-[80px] bg-gray-100 text-gray-600 text-xs gap-1 hover:bg-gray-200">
                                                <span className="text-2xl">📄</span><span>PDF</span>
                                              </a>
                                            ) : (
                                              <a href={url} target="_blank" rel="noreferrer"
                                                className="flex flex-col items-center justify-center w-[80px] h-[80px] bg-gray-100 text-blue-500 text-xs gap-1 hover:bg-gray-200 underline">
                                                <span className="text-2xl">📎</span><span>File {fi + 1}</span>
                                              </a>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {e.status === "pending" && (
                                  <div className="mt-3 text-center text-orange-500 text-sm font-medium">
                                    ⏳ Campaign processing — results will appear after completion
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex justify-between mt-4 text-sm">
              <span>
                Showing {entries.length === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, entries.length)} of {entries.length} entries
              </span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}
                  className="border px-3 py-1 hover:bg-gray-200 disabled:opacity-40">Previous</button>
                <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages || totalPages === 0}
                  className="border px-3 py-1 hover:bg-gray-200 disabled:opacity-40">Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WappReports;