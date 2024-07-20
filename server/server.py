from flask import Flask, request, send_file
from flask_cors import CORS
from io import BytesIO
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject

app = Flask(__name__)
CORS(app)  # This should handle CORS for all routes

@app.route('/compress', methods=['POST'])
def compress():
    file = request.files.get('file')
    if file and file.filename.endswith('.pdf'):
        try:
            file_stream = BytesIO(file.read())
            file_stream.seek(0)  # Rewind to the start of the file

            reader = PdfReader(file_stream)
            writer = PdfWriter()

            for page in reader.pages:
                # Create a new page without images
                new_page = writer.add_page(page)

                # Get the existing resources
                resources = page.get('/Resources')
                if resources:
                    xobjects = resources.get('/XObject', {})
                    for xobject in xobjects.values():
                        if xobject['/Subtype'] == '/Image':
                            # Remove images
                            xobject.update({
                                NameObject('/Filter'): NameObject('/FlateDecode')
                            })

            # Save the compressed PDF to a BytesIO object
            output = BytesIO()
            writer.write(output)
            output.seek(0)

            # Check file size
            original_file_size = len(file_stream.getvalue())
            compressed_file_size = len(output.getvalue())
            print(f"Original file size: {original_file_size} bytes")
            print(f"Compressed file size: {compressed_file_size} bytes")

            return send_file(output, as_attachment=True, download_name='compressed_file.pdf', mimetype='application/pdf')

        except Exception as e:
            return f"An error occurred while processing the file: {e}", 500

    return "Unsupported file type", 400

if __name__ == '__main__':
    app.run(debug=True)