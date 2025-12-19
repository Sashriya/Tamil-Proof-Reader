import React, { useState, useEffect, useRef } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [originalText, setOriginalText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState("all");
  const scrollRef = useRef(null);

  const extractJSON = (raw) => {
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  };

  // ⭐ GLOBAL ENTER KEY
  useEffect(() => {
    const handleEnter = (e) => {
      if (["SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "Enter" && file && !loading) uploadAndProofread();
    };

    window.addEventListener("keydown", handleEnter);
    return () => window.removeEventListener("keydown", handleEnter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, loading]);

  useEffect(() => {
    if (mistakes.length > 0 && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [mistakes]);

  useEffect(() => {
    if (filter !== "all") {
      const matched = mistakes.filter((m) => m.category === filter);
      if (mistakes.length > 0 && matched.length === 0) {
        const msg = {
          spelling: "No spelling mistakes found 💛",
          grammar: "No grammar mistakes found 💛",
          punctuation: "No punctuation mistakes found 💛",
          quotation: "No quotation errors found 💛",
          spacing: "No spacing issues found 💛",
          formatting: "No formatting mistakes found 💛",
        };
        alert(msg[filter]);
      }
    }
  }, [filter, mistakes]);

  const uploadAndProofread = async () => {
    if (!file) return alert("Upload a document da!");

    setLoading(true);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("http://127.0.0.1:8000/proofread-file", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    const clean = extractJSON(data.result);

    setOriginalText(clean.original_text);
    setCorrectedText(clean.corrected_text);
    setMistakes(clean.mistakes);

    setLoading(false);

    if (clean.mistakes.length === 0) {
      alert("No mistakes found in the document. It is clean! 💛");
    }
  };

  const filteredMistakes =
    filter === "all" ? mistakes : mistakes.filter((m) => m.category === filter);

  const highlightOriginal = () => {
    if (filteredMistakes.length === 0) return { __html: originalText };
    let html = originalText;

    filteredMistakes.forEach((m) => {
      const wrong = m.wrong.trim();
      const safe = wrong.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      html = html.replace(
        new RegExp(safe, "g"),
        `<span class="bg-red-300/70 px-1 rounded-xl">${wrong}</span>`
      );
    });

    return { __html: html };
  };

  const highlightCorrected = () => {
    if (filteredMistakes.length === 0) return { __html: correctedText };
    let html = correctedText;

    filteredMistakes.forEach((m) => {
      const correct = m.correct.trim();
      const safe = correct.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      html = html.replace(
        new RegExp(safe, "g"),
        `<span class="bg-green-300/70 px-1 rounded-xl">${correct}</span>`
      );
    });

    return { __html: html };
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#d8efff] flex justify-center p-10">

      {/* FLOATING BUBBLES BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-32 h-32 bg-white/50 backdrop-blur-xl rounded-full top-10 left-10 animate-[float_6s_ease-in-out_infinite]"></div>
        <div className="absolute w-40 h-40 bg-white/40 backdrop-blur-xl rounded-full bottom-20 right-20 animate-[float_7s_ease-in-out_infinite]"></div>
        <div className="absolute w-24 h-24 bg-white/30 backdrop-blur-xl rounded-full top-1/2 left-1/4 animate-[float_8s_ease-in-out_infinite]"></div>
      </div>

      {/* MAIN GLASS CONTAINER */}
      <div className="max-w-6xl w-full relative bg-white/30 backdrop-blur-2xl p-10 rounded-3xl shadow-2xl border border-white/40">

        <h1 className="text-5xl font-semibold text-gray-800 text-center mb-8 drop-shadow-lg">
          ✨ AI Tamil Proof-reader 
        </h1>

        {/* FILE UPLOAD */}
        <div className="bg-white/40 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/60 mb-6">
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            className="w-full p-4 bg-white/60 rounded-xl border border-gray-300 shadow-inner"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button
            onClick={uploadAndProofread}
            className="w-full mt-4 py-3 bg-blue-200/70 hover:bg-blue-300 text-gray-800 font-bold rounded-xl shadow-lg hover:scale-105 duration-300 hover:text-gray-900"
          >
            {loading ? "Analyzing Document…" : "Upload & Proof-read"}
          </button>
        </div>

        {/* FILTER DROPDOWN */}
        <div className="mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            disabled={mistakes.length === 0}
            className="p-3 rounded-xl bg-white/60 backdrop-blur-xl border border-gray-300 shadow-lg"
          >
            <option value="all">All Mistakes</option>
            <option value="spelling">Spelling</option>
            <option value="grammar">Grammar</option>
            <option value="punctuation">Punctuation</option>
            <option value="quotation">Quotation</option>
            <option value="spacing">Spacing</option>
            <option value="formatting">Formatting</option>
          </select>
        </div>

        {/* SIDE BY SIDE VIEW */}
        <div className="grid grid-cols-2 gap-10 mt-6">

          {/* ORIGINAL */}
          <div className="bg-white/40 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">📘 Original</h2>

            <div
              className="whitespace-pre-wrap text-gray-900"
              dangerouslySetInnerHTML={highlightOriginal()}
            ></div>

            <div ref={scrollRef} id="scroll-target"></div>
          </div>

          {/* CORRECTED */}
          <div className="bg-white/40 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">✔ Corrected</h2>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(correctedText);
                  alert("Corrected Tamil text copied 💛");
                }}
                className="px-3 py-1 bg-blue-200/70 hover:bg-blue-300 rounded-lg shadow-md hover:scale-105 duration-300 text-gray-800 font-medium"
              >
                📄 Copy
              </button>
            </div>

            <div
              className="whitespace-pre-wrap text-gray-900 mt-3"
              dangerouslySetInnerHTML={highlightCorrected()}
            ></div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
