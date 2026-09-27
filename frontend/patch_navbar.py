import re

with open("src/components/Navbar.jsx", "r") as f:
    content = f.read()

pattern = r'// Special rendering for \'Catálogo\' to include Dropdown\s*if \(link\.label === "Catálogo"\) \{[\s\S]*?return \(\s*<li key=\{link\.to\}>\s*<Link'

replacement = r"""return (
                    <li key={link.to}>
                      <Link"""

new_content = re.sub(pattern, replacement, content)

with open("src/components/Navbar.jsx", "w") as f:
    f.write(new_content)

