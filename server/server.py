from flask import Flask, request, send_file
from flask_cors import CORS
from pypdf import PdfWriter, PdfReader

app = Flask(__name__)
CORS(app)  # This should handle CORS for all routes

def compress_pdf(input_pdf_stream):
    """Compresses a PDF file by optimizing it and returns the compressed PDF as a byte stream."""
    output_pdf_stream = io.BytesIO()
    reader = PdfReader(input_pdf_stream)
    writer = PdfWriter()
    
    for page_num in range(len(reader.pages)):
        page = reader.pages[page_num]
        writer.add_page(page)
    
    writer.write(output_pdf_stream)
    output_pdf_stream.seek(0)
    
    return output_pdf_stream
