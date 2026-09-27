import re

with open("src/pages/admin/CierreCaja.jsx", "r") as f:
    content = f.read()

pattern = r'const inicioDia = new Date\(fechaArqueo\);\s*inicioDia\.setHours\(0, 0, 0, 0\);\s*const finDia = new Date\(fechaArqueo\);\s*finDia\.setHours\(23, 59, 59, 999\);'

replacement = """const [year, month, day] = fechaArqueo.split("-").map(Number);
      const inicioDia = new Date(year, month - 1, day, 0, 0, 0, 0);
      const finDia = new Date(year, month - 1, day, 23, 59, 59, 999);"""

new_content = re.sub(pattern, replacement, content)

with open("src/pages/admin/CierreCaja.jsx", "w") as f:
    f.write(new_content)
