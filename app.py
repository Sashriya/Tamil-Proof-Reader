from fastapi import FastAPI, UploadFile, Form
import google.generativeai as genai
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from docx import Document

genai.configure(api_key="")
model = genai.GenerativeModel("gemini-2.0-flash")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

def extract_from_pdf(f):
    reader = PdfReader(f)
    text = ""
    for page in reader.pages:
        t = page.extract_text()
        if t:
            text += t + "\n"
    return text

def extract_from_docx(f):
    doc = Document(f)
    return "\n".join([p.text for p in doc.paragraphs])

def extract_from_txt(f):
    return f.read().decode("utf-8")

@app.post("/proofread-file")
async def proofread_file(file: UploadFile):
    if file.filename.endswith(".pdf"):
        text = extract_from_pdf(file.file)
    elif file.filename.endswith(".docx"):
        text = extract_from_docx(file.file)
    else:
        text = extract_from_txt(file.file)

    prompt = f"""
You are a Tamil novel/document proof-reader.

Return corrections ONLY for:
- Tamil spelling
- Tamil ilakkanam (grammar)
- punctuation mistakes (.,!? : ; …)
- incorrect Tamil/English quotation marks (“ ” ‘ ’)
- wrong spacing (double spaces, inconsistent gaps)
- repeated blank lines
- formatting issues (extra newline, accidental breaks)

VERY IMPORTANT RULES:
- Do NOT change English text.
- Do NOT change author writing style.
- Do NOT rewrite dialogue format.
- Do NOT translate anything.

Output STRICT JSON:

{{
  "original_text": "<<ORIGINAL TEXT NOT MODIFIED>>",
  "corrected_text": "<<FULL CORRECTED TEXT>>",
  "mistakes": [
    {{
      "wrong": "wrong word or phrase EXACTLY as in original",
      "correct": "correct version",
      "line_number": 12,
      "category": "grammar / punctuation / quotation / spacing / spelling / formatting"
    }}
  ]
}}

Now correct this text without rewriting:
{text}
"""


    response = model.generate_content(prompt)
    return {"result": response.text}
