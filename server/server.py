from pypdf import PdfReader, PdfWriter
import os

def get_file_size(file_path):
    """Returns the size of the file in bytes."""
    return os.path.getsize(file_path)

# File paths
original_file = "./report.pdf"
compressed_file = "./report_small.pdf"

# Read and write PDF
from pypdf import PdfWriter

writer = PdfWriter(clone_from=original_file)

writer.remove_images()

with open(compressed_file, "wb") as f:
    writer.write(f)

# Get file sizes
original_size = get_file_size(original_file)
compressed_size = get_file_size(compressed_file)
print(f"Original file size: {original_size / (1024 * 1024):.2f} MB")
print(f"Compressed file size: {compressed_size / (1024 * 1024):.2f} MB")