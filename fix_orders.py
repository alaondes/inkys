import re

with open('src/admin/views/Orders.tsx', 'r') as f:
    code = f.read()

# Fix OrderItem
code = re.sub(
    r'selectedColor\?: string;\s*selectedSize\?: string;\s*price: number;\s*fileUrl\?: string;\s*image\?: string;\s*selectedColor\?: string;',
    r'price: number;\n  fileUrl?: string;\n  image?: string;\n  selectedColor?: string;\n  selectedSize?: string;',
    code
)

# Fix Receipt items array
code = code.replace(
    'items: Array<{ description: string; quantity: number;\n  selectedColor?: string;\n  selectedSize?: string; unitPrice: number }>;',
    'items: Array<{ description: string; quantity: number; unitPrice: number }>;'
)

with open('src/admin/views/Orders.tsx', 'w') as f:
    f.write(code)
