import sys

file_path = r'c:\Users\mukka\Desktop\internship portal\backend\controllers\publicController.js'
with open(file_path, 'rb') as f:
    content = f.read()

lines = content.splitlines()
for i in range(260, 280):
    if i < len(lines):
        print(f"Line {i+1}: {lines[i]}")
