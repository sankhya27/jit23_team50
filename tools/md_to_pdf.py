from pathlib import Path
import textwrap
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

root = Path(__file__).resolve().parents[1]
md_file = root / 'ALL_FILES.md'
out_file = root / 'ALL_FILES.pdf'

if not md_file.exists():
    print('ERROR: ALL_FILES.md not found at', md_file)
    raise SystemExit(1)

text = md_file.read_text(encoding='utf-8')
lines = text.splitlines()

c = canvas.Canvas(str(out_file), pagesize=letter)
width, height = letter

margin_x = 40
margin_top = 40
margin_bottom = 60

text_obj = c.beginText(margin_x, height - margin_top)
text_obj.setFont('Courier', 9)
wrap_width = 95

for line in lines:
    # wrap long lines
    wrapped = textwrap.wrap(line, wrap_width) or ['']
    for w in wrapped:
        if text_obj.getY() < margin_bottom:
            c.drawText(text_obj)
            c.showPage()
            text_obj = c.beginText(margin_x, height - margin_top)
            text_obj.setFont('Courier', 9)
        text_obj.textLine(w)

c.drawText(text_obj)
c.save()
print('WROTE', out_file)
