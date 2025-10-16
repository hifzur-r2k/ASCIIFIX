import sys
from pdf2docx import Converter

def convert_pdf_to_word(pdf_path, docx_path):
    try:
        # Create converter instance
        cv = Converter(pdf_path)
        
        # Convert PDF to Word
        cv.convert(docx_path, start=0, end=None)
        
        # Close converter
        cv.close()
        
        print(f"SUCCESS: Converted {pdf_path} to {docx_path}")
        return True
        
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python pdf_to_word.py <input.pdf> <output.docx>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    docx_path = sys.argv[2]
    
    success = convert_pdf_to_word(pdf_path, docx_path)
    sys.exit(0 if success else 1)
