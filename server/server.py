import os
import io
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import google.generativeai as genai
import PyPDF2
from pptx import Presentation
from docx import Document

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

genai.configure(api_key="AIzaSyDlcuIhbhk1rJvYwBQA4Hs3_PbZU_UbqRs")
model = genai.GenerativeModel('gemini-1.5-flash')

def count_tokens(text):
    response = model.count_tokens(text)
    print(response.total_tokens)
    return response.total_tokens

def summarize_text(text):
    prompt = f"Summarize the following text:\n\n{text}"
    if not text.strip():
        return ""
    response = model.generate_content(prompt)
    
    return response.text

def extract_pdf_pages(file_stream):
    pdf_text = []
    reader = PyPDF2.PdfReader(file_stream)
    for page_num in range(len(reader.pages)):
        page = reader.pages[page_num]
        pdf_text.append(page.extract_text())
    return pdf_text

def extract_ppt_pages(file_stream):
    ppt_text = []
    presentation = Presentation(file_stream)
    for slide in presentation.slides:
        slide_text = ""
        for shape in slide.shapes:
            if hasattr(shape, "text"):
                slide_text += shape.text + " "
        ppt_text.append(slide_text)
    return ppt_text

def extract_docx_pages(file_stream):
    doc_text = []
    document = Document(file_stream)
    for para in document.paragraphs:
        doc_text.append(para.text)
    return doc_text

def process_document(file_stream, file_type, token_limit=20000):
    extractors = {
        'pdf': extract_pdf_pages,
        'ppt': extract_ppt_pages,
        'docx': extract_docx_pages
    }

    if file_type not in extractors:
        raise ValueError("Unsupported file type")

    extract_text = extractors[file_type]
    document_texts = extract_text(file_stream)
    combined_text = ""
    current_tokens = 0
    summary = ""

    for page_text in document_texts:
        if not page_text.strip():
            continue
        page_tokens = count_tokens(page_text)
        if page_tokens < 10:
            continue
        if current_tokens + page_tokens > token_limit:
            summary = summarize_text(combined_text)
            combined_text = page_text
            current_tokens = page_tokens
        else:
            combined_text += " " + page_text
            current_tokens += page_tokens

    if combined_text.strip():
        current_summary = summarize_text(combined_text)
        summary += current_summary

    print("Final Summary: ", summary)
    return summary

@app.route('/upload', methods=['POST'])
@cross_origin(origin='*')
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    file_type = file.filename.rsplit('.', 1)[-1].lower()
    if file_type not in ['pdf', 'ppt', 'docx']:
        return jsonify({"error": "Unsupported file type"}), 400

    if file:
        summary = process_document(file, file_type)
        return jsonify({"summary": summary}), 200

@app.route('/chat', methods=['POST'])
@cross_origin(origin='*')
def prompt():
    data = request.get_json()
    default = "Answer the question based on the context provided.\n\n"
    context = data['context']
    prompt = data['prompt']
    response = model.generate_content(default + "Question: \n\n" + prompt + "Context: \n\n" + context)
    print(response.text)
    return jsonify({"response": response.text})

if __name__ == '__main__':
    app.run(debug=True)
