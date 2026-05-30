"""PDF text extractor for reveal-agent — called from file-analyzer.js.
Usage: python3 pdf_extract.py /path/to/file.pdf
Always outputs valid JSON. Errors go to stderr.
"""
import json
import sys
import fitz

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "no file path provided"}))
        sys.exit(1)

    filepath = sys.argv[1]

    try:
        doc = fitz.open(filepath)
    except Exception as e:
        print(json.dumps({"error": f"cannot open PDF: {e}"}))
        sys.exit(0)

    try:
        meta = doc.metadata

        pages = []
        total_chars = 0
        max_chars = 20000
        max_pages = min(len(doc), 15)

        for i in range(max_pages):
            text = doc[i].get_text("text")
            if total_chars + len(text) > max_chars:
                pages.append(text[:max_chars - total_chars] + "\n...(content truncated)")
                break
            pages.append(text)
            total_chars += len(text)

        full_text = "\n\n".join(pages).strip()

        # Extract tables
        tables_text = []
        for i in range(min(len(doc), 15)):
            tabs = doc[i].find_tables()
            for tab in tabs:
                try:
                    rows = tab.extract()
                    if rows and len(rows) > 1:
                        header = " | ".join(str(c) if c else "" for c in rows[0])
                        body = []
                        for row in rows[1:7]:
                            body.append(" | ".join(str(c) if c else "" for c in row))
                        tables_text.append(
                            f"[Table page {i+1}]: {header}\n" + "\n".join(body)
                        )
                except Exception:
                    pass

        out = {
            "title": (meta.get("title") or ""),
            "author": (meta.get("author") or ""),
            "subject": (meta.get("subject") or ""),
            "pageCount": len(doc),
            "textChars": total_chars,
            "text": full_text,
            "tables": tables_text[:5],
        }
        print(json.dumps(out, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": f"extraction failed: {e}"}, ensure_ascii=False))
    finally:
        doc.close()

if __name__ == "__main__":
    main()
